# Guia de Integração APK ↔ PWA Totem

## 📋 Resumo

O PWA do Totem já está preparado com toda a lógica JavaScript. O desenvolvedor Android precisa apenas implementar a **ponte (JavaScriptInterface)** que conecta o WebView ao SDK PayGo.

---

## 🔗 Arquitetura de Comunicação

```
┌─────────────────────────────────────────────────────────────────┐
│                         TOTEM ANDROID                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    WebView (PWA)                         │   │
│  │                                                          │   │
│  │   window.TEF.iniciarPagamento(json)  ──────────────────┐│   │
│  │                                                        ││   │
│  │   window.onTefResultado(resultado)   ◄─────────────────┘│   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ▲                                      │
│                          │ JavaScriptInterface                  │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   TEFBridge (Kotlin)                     │   │
│  │                                                          │   │
│  │   @JavascriptInterface                                   │   │
│  │   fun iniciarPagamento(jsonParams: String)               │   │
│  │   fun cancelarPagamento()                                │   │
│  │   fun verificarPinpad(): String                          │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ▲                                      │
│                          │                                      │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   PayGo SDK + Pinpad                     │   │
│  │                                                          │   │
│  │   PPC930 via USB CDC/ACM                                 │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ O que já está pronto no PWA

| Componente | Arquivo | Status |
|------------|---------|--------|
| Ponte JavaScript | `src/lib/tef/tefAndroidBridge.ts` | ✅ Pronto |
| Hook React | `src/hooks/useTEFAndroid.ts` | ✅ Pronto |
| Painel Admin TEF | `src/components/admin/tef/TEFAndroidIntegration.tsx` | ✅ Pronto |
| Documentação | `docs/TOTEM_ANDROID_TEF.md` | ✅ Pronto |

---

## 🔧 O que o Desenvolvedor Android Precisa Fazer

### PASSO 1: Configurar WebView

```kotlin
class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var tefBridge: TEFBridge
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        webView = WebView(this)
        setContentView(webView)
        
        // Configurar WebView
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }
        
        // Criar e injetar a ponte TEF
        tefBridge = TEFBridge(this, webView)
        webView.addJavascriptInterface(tefBridge, "TEF")
        
        // Carregar o PWA
        webView.loadUrl("https://barbeariacostaurbana.lovable.app/totem")
    }
}
```

### PASSO 2: Implementar TEFBridge

```kotlin
class TEFBridge(
    private val context: Context,
    private val webView: WebView
) {
    private val gson = Gson()
    private val logs = mutableListOf<String>()
    private var debugMode = false
    private var payGoClient: PayGoClient? = null
    
    init {
        // Inicializar SDK PayGo aqui
        initPayGo()
    }
    
    // ============================================
    // FUNÇÕES EXPOSTAS PARA O JAVASCRIPT (PWA)
    // ============================================
    
    /**
     * Inicia um pagamento TEF
     * Chamado pelo PWA: window.TEF.iniciarPagamento(json)
     */
    @JavascriptInterface
    fun iniciarPagamento(jsonParams: String) {
        log("iniciarPagamento chamado: $jsonParams")
        
        try {
            val params = gson.fromJson(jsonParams, PaymentParams::class.java)
            
            // Chamar SDK PayGo
            payGoClient?.processPayment(
                amount = params.valorCentavos,
                paymentType = when (params.metodo) {
                    "debito" -> PaymentType.DEBIT
                    "credito" -> PaymentType.CREDIT
                    "credito_parcelado" -> PaymentType.CREDIT_INSTALLMENT
                    else -> PaymentType.CREDIT
                },
                installments = params.parcelas ?: 1,
                callback = object : PaymentCallback {
                    override fun onSuccess(result: PaymentResult) {
                        enviarResultado(TEFResultado(
                            status = "aprovado",
                            valor = result.amount,
                            bandeira = result.cardBrand,
                            nsu = result.nsu,
                            autorizacao = result.authCode,
                            ordemId = params.ordemId,
                            comprovanteCliente = result.customerReceipt,
                            comprovanteLojista = result.merchantReceipt
                        ))
                    }
                    
                    override fun onError(error: PaymentError) {
                        enviarResultado(TEFResultado(
                            status = "negado",
                            codigoErro = error.code,
                            mensagem = error.message,
                            ordemId = params.ordemId
                        ))
                    }
                    
                    override fun onCancelled() {
                        enviarResultado(TEFResultado(
                            status = "cancelado",
                            ordemId = params.ordemId
                        ))
                    }
                }
            )
        } catch (e: Exception) {
            log("Erro: ${e.message}")
            enviarResultado(TEFResultado(
                status = "erro",
                mensagem = e.message ?: "Erro desconhecido"
            ))
        }
    }
    
    /**
     * Cancela o pagamento em andamento
     */
    @JavascriptInterface
    fun cancelarPagamento() {
        log("cancelarPagamento chamado")
        payGoClient?.cancelCurrentTransaction()
    }
    
    /**
     * Verifica status do pinpad
     * Retorna JSON com { conectado: boolean, modelo?: string }
     */
    @JavascriptInterface
    fun verificarPinpad(): String {
        log("verificarPinpad chamado")
        
        val connected = payGoClient?.isPinpadConnected() ?: false
        val model = payGoClient?.getPinpadModel()
        
        return gson.toJson(mapOf(
            "conectado" to connected,
            "modelo" to model,
            "timestamp" to System.currentTimeMillis()
        ))
    }
    
    /**
     * Ativa/desativa modo debug
     */
    @JavascriptInterface
    fun setModoDebug(enabled: Boolean) {
        debugMode = enabled
        log("Modo debug: $enabled")
    }
    
    /**
     * Retorna logs para debug
     */
    @JavascriptInterface
    fun getLogs(): String {
        return gson.toJson(mapOf("logs" to logs))
    }
    
    /**
     * Limpa logs
     */
    @JavascriptInterface
    fun limparLogs() {
        logs.clear()
    }
    
    // ============================================
    // FUNÇÕES INTERNAS
    // ============================================
    
    /**
     * Envia resultado para o PWA
     * O PWA espera receber via: window.onTefResultado(resultado)
     */
    private fun enviarResultado(resultado: TEFResultado) {
        val json = gson.toJson(resultado)
        log("Enviando resultado: $json")
        
        // Executar na thread principal
        (context as Activity).runOnUiThread {
            webView.evaluateJavascript(
                "if(window.onTefResultado) { window.onTefResultado($json); }",
                null
            )
        }
    }
    
    /**
     * Notifica PWA que pinpad foi conectado
     */
    fun notificarPinpadConectado(modelo: String) {
        log("Pinpad conectado: $modelo")
        
        (context as Activity).runOnUiThread {
            webView.evaluateJavascript("""
                window.dispatchEvent(new CustomEvent('tefPinpadConnected', { 
                    detail: { modelo: '$modelo' } 
                }));
            """.trimIndent(), null)
        }
    }
    
    /**
     * Notifica PWA que pinpad foi desconectado
     */
    fun notificarPinpadDesconectado() {
        log("Pinpad desconectado")
        
        (context as Activity).runOnUiThread {
            webView.evaluateJavascript("""
                window.dispatchEvent(new CustomEvent('tefPinpadDisconnected'));
            """.trimIndent(), null)
        }
    }
    
    private fun log(message: String) {
        val timestamp = SimpleDateFormat("HH:mm:ss.SSS", Locale.getDefault())
            .format(Date())
        val logEntry = "[$timestamp] $message"
        logs.add(logEntry)
        if (debugMode) {
            Log.d("TEFBridge", logEntry)
        }
    }
    
    private fun initPayGo() {
        // TODO: Inicializar SDK PayGo conforme documentação
    }
}

// Data classes
data class PaymentParams(
    val ordemId: String,
    val valorCentavos: Int,
    val metodo: String,
    val parcelas: Int?
)

data class TEFResultado(
    val status: String,
    val valor: Int? = null,
    val bandeira: String? = null,
    val nsu: String? = null,
    val autorizacao: String? = null,
    val codigoResposta: String? = null,
    val codigoErro: String? = null,
    val mensagem: String? = null,
    val comprovanteCliente: String? = null,
    val comprovanteLojista: String? = null,
    val ordemId: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)
```

### PASSO 3: Configurar USB para Pinpad PPC930

```xml
<!-- AndroidManifest.xml -->
<manifest>
    <uses-feature android:name="android.hardware.usb.host" android:required="true" />
    
    <application>
        <!-- ... -->
        
        <activity android:name=".MainActivity">
            <intent-filter>
                <action android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED" />
            </intent-filter>
            <meta-data
                android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED"
                android:resource="@xml/device_filter" />
        </activity>
    </application>
</manifest>
```

```xml
<!-- res/xml/device_filter.xml -->
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- PayGo PPC930 -->
    <usb-device vendor-id="6790" product-id="29987" />
</resources>
```

---

## 📝 Contrato de Comunicação

### 1. JavaScript → Android (PWA chama APK)

| Função | Parâmetros | Descrição |
|--------|------------|-----------|
| `iniciarPagamento(json)` | `{ ordemId, valorCentavos, metodo, parcelas }` | Inicia transação |
| `cancelarPagamento()` | - | Cancela transação atual |
| `verificarPinpad()` | - | Retorna status JSON |
| `setModoDebug(bool)` | `true/false` | Ativa logs |
| `getLogs()` | - | Retorna logs JSON |
| `limparLogs()` | - | Limpa logs |

### 2. Android → JavaScript (APK notifica PWA)

| Evento | Método | Payload |
|--------|--------|---------|
| Resultado pagamento | `window.onTefResultado(resultado)` | `TEFResultado` |
| Pinpad conectado | `CustomEvent('tefPinpadConnected')` | `{ modelo }` |
| Pinpad desconectado | `CustomEvent('tefPinpadDisconnected')` | - |
| Android pronto | `CustomEvent('tefAndroidReady')` | `{ version }` |

### 3. Estrutura do Resultado (TEFResultado)

```json
{
  "status": "aprovado | negado | cancelado | erro",
  "valor": 5000,
  "bandeira": "VISA",
  "nsu": "123456789",
  "autorizacao": "AUTH123",
  "codigoResposta": "00",
  "codigoErro": null,
  "mensagem": "Transação aprovada",
  "comprovanteCliente": "...",
  "comprovanteLojista": "...",
  "ordemId": "ORD-123",
  "timestamp": 1702000000000
}
```

---

## 🧪 Teste de Comunicação

### No PWA (Console do navegador do Totem)

```javascript
// 1. Verificar se Android injetou a interface
console.log('TEF disponível:', typeof window.TEF !== 'undefined');

// 2. Verificar pinpad
if (window.TEF) {
  const status = JSON.parse(window.TEF.verificarPinpad());
  console.log('Pinpad:', status);
}

// 3. Testar pagamento (modo debug)
if (window.TEF) {
  window.TEF.setModoDebug(true);
  
  window.onTefResultado = (resultado) => {
    console.log('Resultado:', resultado);
  };
  
  window.TEF.iniciarPagamento(JSON.stringify({
    ordemId: 'TEST-001',
    valorCentavos: 100,
    metodo: 'credito',
    parcelas: 1
  }));
}
```

### No Android (Logcat)

```bash
adb logcat -s TEFBridge:D
```

---

## 🚀 Checklist do Desenvolvedor

### Configuração Inicial
- [ ] WebView configurado com JavaScript habilitado
- [ ] `TEFBridge` implementado com `@JavascriptInterface`
- [ ] `webView.addJavascriptInterface(tefBridge, "TEF")`
- [ ] URL do PWA carregando: `https://barbeariacostaurbana.lovable.app/totem`

### SDK PayGo
- [ ] SDK PayGo importado no projeto
- [ ] Credenciais PayGo configuradas
- [ ] Inicialização do SDK no onCreate

### Pinpad USB
- [ ] Permissão USB no AndroidManifest.xml
- [ ] device_filter.xml com VID/PID do PPC930
- [ ] Listener de conexão/desconexão USB

### Comunicação
- [ ] `iniciarPagamento()` chamando SDK e retornando via `onTefResultado`
- [ ] `cancelarPagamento()` interrompendo transação
- [ ] `verificarPinpad()` retornando JSON correto
- [ ] Eventos de pinpad sendo disparados para o PWA

### Testes
- [ ] Testar comunicação básica (verificarPinpad)
- [ ] Testar pagamento débito R$ 1,00
- [ ] Testar pagamento crédito à vista R$ 1,00
- [ ] Testar pagamento crédito parcelado R$ 10,00
- [ ] Testar cancelamento durante transação
- [ ] Testar desconexão do pinpad

---

## 📞 Contato

Dúvidas sobre o lado PWA (JavaScript):
- Verificar código em `src/lib/tef/tefAndroidBridge.ts`
- Verificar hook em `src/hooks/useTEFAndroid.ts`

Dúvidas sobre SDK PayGo:
- Documentação PayGo: https://paygo.com.br/desenvolvedores
- Suporte técnico PayGo
