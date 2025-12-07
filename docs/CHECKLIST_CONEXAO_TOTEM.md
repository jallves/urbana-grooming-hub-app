# Checklist de Conexão - Totem TEF

## 📋 Pré-requisitos

### No Totem (Hardware)
- [ ] SDK PayGo instalado
- [ ] APK da barbearia instalado
- [ ] Pinpad PPC930 conectado via USB
- [ ] Totem ligado e com internet

### No APK Android
- [ ] WebView configurado com `@JavascriptInterface`
- [ ] Classe `TEFBridge` implementada
- [ ] SDK PayGo inicializado

---

## 🔧 Passo a Passo para Conexão

### 1. Configurar WebView no Android

O APK deve carregar a PWA e injetar a interface JavaScript:

```kotlin
class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var tefBridge: TEFBridge

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        webView = WebView(this)
        tefBridge = TEFBridge(this, webView)
        
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }
        
        // IMPORTANTE: Adicionar a interface JavaScript
        webView.addJavascriptInterface(tefBridge, "Android")
        
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                injetarInterfaceTEF()
            }
        }
        
        // Carregar a PWA
        webView.loadUrl("https://barbeariacostaurbana.lovable.app/totem/diagnostico")
        
        setContentView(webView)
    }
    
    private fun injetarInterfaceTEF() {
        val script = """
            window.TEF = {
                iniciarPagamento: function(json) { Android.iniciarPagamento(json); },
                cancelarPagamento: function() { Android.cancelarPagamento(); },
                verificarPinpad: function() { return Android.verificarPinpad(); },
                setModoDebug: function(enabled) { Android.setModoDebug(enabled); },
                getLogs: function() { return Android.getLogs(); },
                limparLogs: function() { Android.limparLogs(); }
            };
            console.log('[TEF] Interface injetada');
            window.dispatchEvent(new CustomEvent('tefAndroidReady', { 
                detail: { version: '1.0.0' } 
            }));
        """.trimIndent()
        
        webView.evaluateJavascript(script, null)
    }
}
```

### 2. Implementar TEFBridge

```kotlin
class TEFBridge(
    private val context: Context,
    private val webView: WebView
) {
    private var payGoManager: PayGoManager? = null
    private var modoDebug = false
    private val logs = mutableListOf<String>()
    
    init {
        // Inicializar SDK PayGo
        payGoManager = PayGoManager.getInstance(context)
        payGoManager?.inicializar()
    }
    
    @JavascriptInterface
    fun iniciarPagamento(jsonParams: String) {
        log("iniciarPagamento: $jsonParams")
        
        try {
            val params = JSONObject(jsonParams)
            val ordemId = params.getString("ordemId")
            val valorCentavos = params.getInt("valorCentavos")
            val metodo = params.getString("metodo")
            val parcelas = params.optInt("parcelas", 1)
            
            // Executar na thread principal
            Handler(Looper.getMainLooper()).post {
                payGoManager?.iniciarTransacao(
                    valor = valorCentavos,
                    tipoOperacao = when(metodo) {
                        "debito" -> TipoOperacao.DEBITO
                        "credito" -> TipoOperacao.CREDITO
                        "credito_parcelado" -> TipoOperacao.CREDITO_PARCELADO
                        else -> TipoOperacao.DEBITO
                    },
                    parcelas = parcelas,
                    callback = object : TransacaoCallback {
                        override fun onSucesso(resultado: ResultadoTransacao) {
                            enviarResultado(JSONObject().apply {
                                put("status", "aprovado")
                                put("valor", resultado.valor)
                                put("nsu", resultado.nsu)
                                put("autorizacao", resultado.codigoAutorizacao)
                                put("bandeira", resultado.bandeira)
                                put("ordemId", ordemId)
                                put("timestamp", System.currentTimeMillis())
                            })
                        }
                        
                        override fun onErro(erro: ErroTransacao) {
                            enviarResultado(JSONObject().apply {
                                put("status", "erro")
                                put("mensagem", erro.mensagem)
                                put("codigoErro", erro.codigo)
                                put("ordemId", ordemId)
                            })
                        }
                        
                        override fun onCancelado() {
                            enviarResultado(JSONObject().apply {
                                put("status", "cancelado")
                                put("ordemId", ordemId)
                            })
                        }
                    }
                )
            }
        } catch (e: Exception) {
            log("Erro: ${e.message}")
            enviarResultado(JSONObject().apply {
                put("status", "erro")
                put("mensagem", e.message)
            })
        }
    }
    
    @JavascriptInterface
    fun cancelarPagamento() {
        log("cancelarPagamento")
        payGoManager?.cancelarTransacao()
    }
    
    @JavascriptInterface
    fun verificarPinpad(): String {
        val status = payGoManager?.verificarPinpad()
        return JSONObject().apply {
            put("conectado", status?.conectado ?: false)
            put("modelo", status?.modelo ?: "")
            put("timestamp", System.currentTimeMillis())
        }.toString()
    }
    
    @JavascriptInterface
    fun setModoDebug(enabled: Boolean) {
        modoDebug = enabled
        log("Modo debug: $enabled")
    }
    
    @JavascriptInterface
    fun getLogs(): String {
        return JSONObject().apply {
            put("logs", JSONArray(logs))
        }.toString()
    }
    
    @JavascriptInterface
    fun limparLogs() {
        logs.clear()
    }
    
    private fun enviarResultado(resultado: JSONObject) {
        log("Resultado: $resultado")
        Handler(Looper.getMainLooper()).post {
            webView.evaluateJavascript(
                "if(window.onTefResultado) { window.onTefResultado($resultado); }",
                null
            )
        }
    }
    
    private fun log(message: String) {
        val timestamp = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        val logEntry = "[$timestamp] $message"
        logs.add(logEntry)
        if (modoDebug) {
            Log.d("TEFBridge", logEntry)
        }
    }
    
    // Notificar eventos do pinpad
    fun notificarPinpadConectado(modelo: String) {
        Handler(Looper.getMainLooper()).post {
            webView.evaluateJavascript("""
                window.dispatchEvent(new CustomEvent('tefPinpadConnected', {
                    detail: { modelo: '$modelo' }
                }));
            """.trimIndent(), null)
        }
    }
    
    fun notificarPinpadDesconectado() {
        Handler(Looper.getMainLooper()).post {
            webView.evaluateJavascript("""
                window.dispatchEvent(new CustomEvent('tefPinpadDisconnected'));
            """.trimIndent(), null)
        }
    }
}
```

### 3. Testar a Conexão

1. **Acesse a página de diagnóstico:**
   ```
   https://barbeariacostaurbana.lovable.app/totem/diagnostico
   ```

2. **Verifique no diagnóstico:**
   - ✓ `window.TEF encontrado` - Interface injetada corretamente
   - ✓ `Pinpad conectado` - USB funcionando
   - ✓ `Android TEF pronto` - Comunicação OK

3. **Teste um pagamento:**
   - Use valor pequeno (R$ 1,00)
   - Observe o fluxo completo

---

## ⚠️ Troubleshooting

### "window.TEF NÃO encontrado"

**Causa:** O APK não está injetando a interface JavaScript.

**Solução:**
1. Verifique se `webView.addJavascriptInterface(tefBridge, "Android")` está sendo chamado
2. Verifique se `injetarInterfaceTEF()` é chamado em `onPageFinished`
3. Confirme que JavaScript está habilitado: `javaScriptEnabled = true`

### "Pinpad não conectado"

**Causa:** Comunicação USB não estabelecida.

**Solução:**
1. Verifique cabo USB do pinpad
2. Confirme permissões USB no AndroidManifest:
   ```xml
   <uses-feature android:name="android.hardware.usb.host" android:required="true" />
   ```
3. Verifique se o SDK PayGo inicializou corretamente

### "Erro ao iniciar pagamento"

**Causa:** Problema na comunicação com SDK PayGo.

**Solução:**
1. Verifique logs do Android: `adb logcat -s TEFBridge`
2. Confirme credenciais do SDK PayGo
3. Verifique se o pinpad está no modo correto

---

## 📱 Comandos ADB Úteis

```bash
# Ver logs do TEFBridge
adb logcat -s TEFBridge

# Ver logs gerais do app
adb logcat | grep -i "tef\|paygo\|pinpad"

# Instalar APK
adb install -r app-debug.apk

# Limpar dados do app
adb shell pm clear com.barbearia.totem

# Verificar dispositivos USB
adb shell lsusb
```

---

## ✅ Checklist Final

- [ ] APK carrega a PWA corretamente
- [ ] `window.TEF` está disponível no console
- [ ] Diagnóstico mostra "Android TEF: Disponível"
- [ ] Diagnóstico mostra "Pinpad: Conectado"
- [ ] Pagamento de teste funciona (R$ 1,00)
- [ ] Resultado do pagamento retorna para a PWA
- [ ] Logs do Android aparecem na aba de diagnóstico
