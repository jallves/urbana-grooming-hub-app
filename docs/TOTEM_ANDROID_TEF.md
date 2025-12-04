# Totem Android - Integração TEF PayGo Local

## Visão Geral

Este documento descreve a arquitetura e implementação do app Android nativo para o Totem da Barbearia Costa Urbana, com integração TEF PayGo Local e pinpad PPC930 USB.

---

## 1. Requisitos do Sistema

### Hardware
- **Tablet**: Samsung Galaxy Tab A SM-T510 (ou compatível)
- **Pinpad**: Gertec PPC930 USB
  - Vendor ID: `1753` (0x6D9 - GERTEC)
  - Product ID: `c902` (0xC902)
  - Classe: Communication Device Class (CDC), ACM

### Software
- Android SDK 21+ (Lollipop)
- SDK PayGo TEF Local (fornecido pela PayGo)
- WebView com suporte a JavaScript ES6+

---

## 2. Arquitetura do App

```
┌─────────────────────────────────────────────────────────────┐
│                    Android App (Kotlin/Java)                │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │   WebView     │  │ TEF Bridge    │  │  USB Manager    │  │
│  │   (PWA)       │◄─┤ (JavaScript   │◄─┤  (Pinpad        │  │
│  │               │  │  Interface)   │  │   PPC930)       │  │
│  └───────┬───────┘  └───────┬───────┘  └────────┬────────┘  │
│          │                  │                   │           │
│          ▼                  ▼                   ▼           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              PayGo TEF Local SDK                      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Pinpad PPC930  │
                    │  (USB CDC/ACM)  │
                    └─────────────────┘
```

---

## 3. Configuração do Projeto Android

### 3.1 build.gradle (app)

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.costaurbana.totem"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
        debug {
            debuggable true
        }
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.webkit:webkit:1.8.0'
    
    // PayGo TEF Local SDK (adicionar manualmente)
    implementation files('libs/paygo-tef-local-sdk.aar')
    
    // USB Serial
    implementation 'com.github.mik3y:usb-serial-for-android:3.5.1'
}
```

### 3.2 AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.costaurbana.totem">

    <!-- Permissões -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.USB_PERMISSION" />
    
    <!-- USB Feature -->
    <uses-feature android:name="android.hardware.usb.host" android:required="true" />

    <application
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.Totem.Fullscreen"
        android:hardwareAccelerated="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="landscape"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <category android:name="android.intent.category.HOME" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
            
            <!-- USB Device Filter para PPC930 -->
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

### 3.3 res/xml/device_filter.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Gertec PPC930 -->
    <usb-device vendor-id="1753" product-id="51458" />
</resources>
```

---

## 4. Implementação Principal

### 4.1 MainActivity.kt

```kotlin
package com.costaurbana.totem

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    
    companion object {
        private const val TAG = "TotemMain"
        private const val ACTION_USB_PERMISSION = "com.costaurbana.totem.USB_PERMISSION"
        
        // Gertec PPC930
        private const val VENDOR_ID_GERTEC = 1753
        private const val PRODUCT_ID_PPC930 = 0xC902
        
        // URL do PWA - CONFIGURAR ANTES DO BUILD
        private const val PWA_URL = "https://d8077827-f7c8-4ebd-8463-ec535c4f64a5.lovableproject.com/totem"
    }
    
    private lateinit var webView: WebView
    private lateinit var usbManager: UsbManager
    private lateinit var tefBridge: TEFBridge
    
    private var isDebugMode = false
    
    private val usbReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
                ACTION_USB_PERMISSION -> {
                    synchronized(this) {
                        val device = intent.getParcelableExtra<UsbDevice>(UsbManager.EXTRA_DEVICE)
                        if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                            device?.let {
                                Log.i(TAG, "Permissão USB concedida para: ${it.deviceName}")
                                tefBridge.onUsbPermissionGranted(it)
                            }
                        } else {
                            Log.w(TAG, "Permissão USB negada")
                            tefBridge.onUsbPermissionDenied()
                        }
                    }
                }
                UsbManager.ACTION_USB_DEVICE_ATTACHED -> {
                    Log.i(TAG, "Dispositivo USB conectado")
                    checkAndRequestUsbPermission()
                }
                UsbManager.ACTION_USB_DEVICE_DETACHED -> {
                    Log.w(TAG, "Dispositivo USB desconectado")
                    tefBridge.onPinpadDisconnected()
                }
            }
        }
    }
    
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Modo fullscreen imersivo
        enableImmersiveMode()
        
        // Manter tela ligada
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        // Inicializar USB Manager
        usbManager = getSystemService(Context.USB_SERVICE) as UsbManager
        
        // Configurar WebView
        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                cacheMode = WebSettings.LOAD_DEFAULT
                mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                allowFileAccess = true
                allowContentAccess = true
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
                loadWithOverviewMode = true
                useWideViewPort = true
                mediaPlaybackRequiresUserGesture = false
            }
            
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    Log.i(TAG, "Página carregada: $url")
                    
                    // Notificar PWA que o app Android está pronto
                    view?.evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('tefAndroidReady', { detail: { version: '1.0.0' } }));",
                        null
                    )
                }
                
                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    Log.e(TAG, "Erro ao carregar página: ${error?.description}")
                }
            }
            
            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(message: ConsoleMessage?): Boolean {
                    Log.d(TAG, "Console: ${message?.message()}")
                    return true
                }
            }
        }
        
        // Inicializar TEF Bridge
        tefBridge = TEFBridge(this, webView, usbManager, isDebugMode)
        
        // Adicionar interface JavaScript
        webView.addJavascriptInterface(tefBridge, "TEF")
        
        setContentView(webView)
        
        // Registrar receivers USB
        registerUsbReceivers()
        
        // Verificar pinpad conectado
        checkAndRequestUsbPermission()
        
        // Carregar PWA
        webView.loadUrl(PWA_URL)
    }
    
    private fun enableImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let {
                it.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                it.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_FULLSCREEN
            )
        }
    }
    
    private fun registerUsbReceivers() {
        val filter = IntentFilter().apply {
            addAction(ACTION_USB_PERMISSION)
            addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
            addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(usbReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(usbReceiver, filter)
        }
    }
    
    private fun checkAndRequestUsbPermission() {
        val deviceList = usbManager.deviceList
        
        for (device in deviceList.values) {
            if (device.vendorId == VENDOR_ID_GERTEC) {
                Log.i(TAG, "Pinpad Gertec encontrado: ${device.deviceName}")
                
                if (usbManager.hasPermission(device)) {
                    tefBridge.onUsbPermissionGranted(device)
                } else {
                    val permissionIntent = PendingIntent.getBroadcast(
                        this,
                        0,
                        Intent(ACTION_USB_PERMISSION),
                        PendingIntent.FLAG_IMMUTABLE
                    )
                    usbManager.requestPermission(device, permissionIntent)
                }
                return
            }
        }
        
        Log.w(TAG, "Nenhum pinpad Gertec encontrado")
    }
    
    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            enableImmersiveMode()
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(usbReceiver)
        tefBridge.destroy()
    }
    
    override fun onBackPressed() {
        // Desabilitar botão voltar para modo kiosk
        // super.onBackPressed()
    }
    
    // Método para ativar/desativar modo debug
    fun setDebugMode(enabled: Boolean) {
        isDebugMode = enabled
        tefBridge.setDebugMode(enabled)
        Log.i(TAG, "Modo debug: $enabled")
    }
}
```

### 4.2 TEFBridge.kt

```kotlin
package com.costaurbana.totem

import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

class TEFBridge(
    private val context: MainActivity,
    private val webView: WebView,
    private val usbManager: UsbManager,
    private var isDebugMode: Boolean = false
) {
    
    companion object {
        private const val TAG = "TEFBridge"
    }
    
    private val mainHandler = Handler(Looper.getMainLooper())
    private var currentTransactionId: String? = null
    private var isPinpadConnected = false
    
    // Lista de logs para debug
    private val debugLogs = mutableListOf<String>()
    
    // =============================================
    // INTERFACE JAVASCRIPT
    // =============================================
    
    /**
     * Inicia um pagamento TEF
     * 
     * @param jsonParams JSON string com os parâmetros:
     *   - ordemId: ID único da ordem
     *   - valorCentavos: Valor em centavos
     *   - metodo: "debito" | "credito" | "credito_parcelado" | "voucher"
     *   - parcelas: Número de parcelas (para crédito parcelado)
     */
    @JavascriptInterface
    fun iniciarPagamento(jsonParams: String) {
        log("iniciarPagamento chamado: $jsonParams")
        
        try {
            val params = JSONObject(jsonParams)
            
            val ordemId = params.getString("ordemId")
            val valorCentavos = params.getLong("valorCentavos")
            val metodo = params.getString("metodo")
            val parcelas = params.optInt("parcelas", 1)
            
            // Validações
            if (valorCentavos <= 0) {
                sendError("VALOR_INVALIDO", "Valor deve ser maior que zero")
                return
            }
            
            if (!isPinpadConnected) {
                sendError("PINPAD_DESCONECTADO", "Pinpad não está conectado")
                return
            }
            
            currentTransactionId = ordemId
            
            // Executar em thread separada para não travar o WebView
            Thread {
                processPayment(ordemId, valorCentavos, metodo, parcelas)
            }.start()
            
        } catch (e: Exception) {
            log("Erro ao parsear parâmetros: ${e.message}")
            sendError("PARAMETROS_INVALIDOS", "Erro ao processar parâmetros: ${e.message}")
        }
    }
    
    /**
     * Cancela o pagamento atual
     */
    @JavascriptInterface
    fun cancelarPagamento() {
        log("cancelarPagamento chamado")
        
        if (currentTransactionId == null) {
            sendError("SEM_TRANSACAO", "Nenhuma transação em andamento")
            return
        }
        
        Thread {
            cancelCurrentTransaction()
        }.start()
    }
    
    /**
     * Verifica o status do pinpad
     */
    @JavascriptInterface
    fun verificarPinpad(): String {
        val status = JSONObject().apply {
            put("conectado", isPinpadConnected)
            put("modelo", if (isPinpadConnected) "PPC930" else null)
            put("timestamp", System.currentTimeMillis())
        }
        return status.toString()
    }
    
    /**
     * Ativa/desativa modo debug
     */
    @JavascriptInterface
    fun setModoDebug(enabled: Boolean) {
        isDebugMode = enabled
        log("Modo debug alterado: $enabled")
    }
    
    /**
     * Retorna logs de debug
     */
    @JavascriptInterface
    fun getLogs(): String {
        return JSONObject().apply {
            put("logs", debugLogs.takeLast(100))
        }.toString()
    }
    
    /**
     * Limpa logs de debug
     */
    @JavascriptInterface
    fun limparLogs() {
        debugLogs.clear()
        log("Logs limpos")
    }
    
    // =============================================
    // INTEGRAÇÃO COM SDK PAYGO
    // =============================================
    
    private fun processPayment(ordemId: String, valorCentavos: Long, metodo: String, parcelas: Int) {
        log("Processando pagamento: ordem=$ordemId, valor=$valorCentavos, metodo=$metodo, parcelas=$parcelas")
        
        try {
            // TODO: Integrar com SDK PayGo TEF Local
            // Este é um exemplo de como a integração deve ser feita
            
            /*
            // Exemplo de integração com PayGo SDK:
            val paygoManager = PayGoManager.getInstance(context)
            
            val transactionType = when (metodo) {
                "debito" -> PayGoTransactionType.DEBIT
                "credito" -> PayGoTransactionType.CREDIT
                "credito_parcelado" -> PayGoTransactionType.CREDIT_INSTALLMENT
                "voucher" -> PayGoTransactionType.VOUCHER
                else -> PayGoTransactionType.CREDIT
            }
            
            val request = PayGoTransactionRequest.Builder()
                .setAmount(valorCentavos)
                .setTransactionType(transactionType)
                .setInstallments(parcelas)
                .setReference(ordemId)
                .build()
            
            paygoManager.startTransaction(request, object : PayGoCallback {
                override fun onSuccess(response: PayGoResponse) {
                    sendSuccess(
                        status = "aprovado",
                        valor = valorCentavos,
                        bandeira = response.cardBrand,
                        nsu = response.nsu,
                        autorizacao = response.authorizationCode,
                        codigoResposta = response.responseCode,
                        comprovanteCliente = response.customerReceipt,
                        comprovanteLojista = response.merchantReceipt
                    )
                }
                
                override fun onError(error: PayGoError) {
                    sendError(error.code, error.message)
                }
                
                override fun onCancelled() {
                    sendCancelled()
                }
            })
            */
            
            // SIMULAÇÃO PARA TESTES (remover em produção)
            Thread.sleep(3000) // Simula processamento
            
            sendSuccess(
                status = "aprovado",
                valor = valorCentavos,
                bandeira = "VISA",
                nsu = generateNSU(),
                autorizacao = generateAuthCode(),
                codigoResposta = "00",
                comprovanteCliente = "COMPROVANTE CLIENTE\n------------------\nValor: R$ ${valorCentavos / 100.0}\nNSU: ${generateNSU()}",
                comprovanteLojista = "COMPROVANTE LOJISTA\n-------------------\nValor: R$ ${valorCentavos / 100.0}\nNSU: ${generateNSU()}"
            )
            
        } catch (e: Exception) {
            log("Erro no processamento: ${e.message}")
            sendError("ERRO_PROCESSAMENTO", "Erro ao processar pagamento: ${e.message}")
        }
    }
    
    private fun cancelCurrentTransaction() {
        log("Cancelando transação: $currentTransactionId")
        
        try {
            // TODO: Integrar com SDK PayGo para cancelamento
            /*
            val paygoManager = PayGoManager.getInstance(context)
            paygoManager.cancelCurrentTransaction()
            */
            
            sendCancelled()
            
        } catch (e: Exception) {
            log("Erro ao cancelar: ${e.message}")
            sendError("ERRO_CANCELAMENTO", "Erro ao cancelar: ${e.message}")
        }
    }
    
    // =============================================
    // CALLBACKS PARA O WEBVIEW
    // =============================================
    
    private fun sendSuccess(
        status: String,
        valor: Long,
        bandeira: String?,
        nsu: String?,
        autorizacao: String?,
        codigoResposta: String?,
        comprovanteCliente: String?,
        comprovanteLojista: String?
    ) {
        val resultado = JSONObject().apply {
            put("status", status)
            put("valor", valor)
            put("bandeira", bandeira)
            put("nsu", nsu)
            put("autorizacao", autorizacao)
            put("codigoResposta", codigoResposta)
            put("comprovanteCliente", comprovanteCliente)
            put("comprovanteLojista", comprovanteLojista)
            put("ordemId", currentTransactionId)
            put("timestamp", System.currentTimeMillis())
        }
        
        sendResultToWebView(resultado)
        currentTransactionId = null
    }
    
    private fun sendError(codigo: String, mensagem: String) {
        val resultado = JSONObject().apply {
            put("status", "erro")
            put("codigoErro", codigo)
            put("mensagem", mensagem)
            put("ordemId", currentTransactionId)
            put("timestamp", System.currentTimeMillis())
        }
        
        sendResultToWebView(resultado)
        currentTransactionId = null
    }
    
    private fun sendCancelled() {
        val resultado = JSONObject().apply {
            put("status", "cancelado")
            put("ordemId", currentTransactionId)
            put("timestamp", System.currentTimeMillis())
        }
        
        sendResultToWebView(resultado)
        currentTransactionId = null
    }
    
    private fun sendResultToWebView(resultado: JSONObject) {
        val jsonString = resultado.toString().replace("'", "\\'")
        log("Enviando resultado para WebView: $jsonString")
        
        mainHandler.post {
            webView.evaluateJavascript(
                "window.onTefResultado && window.onTefResultado($jsonString);",
                null
            )
        }
    }
    
    // =============================================
    // GERENCIAMENTO USB/PINPAD
    // =============================================
    
    fun onUsbPermissionGranted(device: UsbDevice) {
        log("Permissão USB concedida: ${device.deviceName}")
        isPinpadConnected = true
        
        // Notificar PWA
        mainHandler.post {
            webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('tefPinpadConnected', { detail: { modelo: 'PPC930' } }));",
                null
            )
        }
        
        // TODO: Inicializar comunicação com SDK PayGo
        initializePayGoSDK(device)
    }
    
    fun onUsbPermissionDenied() {
        log("Permissão USB negada")
        isPinpadConnected = false
        
        mainHandler.post {
            webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('tefPinpadError', { detail: { erro: 'PERMISSAO_NEGADA' } }));",
                null
            )
        }
    }
    
    fun onPinpadDisconnected() {
        log("Pinpad desconectado")
        isPinpadConnected = false
        
        mainHandler.post {
            webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('tefPinpadDisconnected'));",
                null
            )
        }
    }
    
    private fun initializePayGoSDK(device: UsbDevice) {
        log("Inicializando SDK PayGo...")
        
        // TODO: Inicializar SDK PayGo TEF Local
        /*
        val paygoManager = PayGoManager.getInstance(context)
        paygoManager.initialize(device, object : PayGoInitCallback {
            override fun onInitialized() {
                log("SDK PayGo inicializado com sucesso")
            }
            
            override fun onError(error: PayGoError) {
                log("Erro ao inicializar SDK: ${error.message}")
            }
        })
        */
    }
    
    fun setDebugMode(enabled: Boolean) {
        isDebugMode = enabled
    }
    
    fun destroy() {
        log("Destruindo TEFBridge")
        // TODO: Cleanup do SDK PayGo
    }
    
    // =============================================
    // UTILITÁRIOS
    // =============================================
    
    private fun log(message: String) {
        val timestamp = SimpleDateFormat("HH:mm:ss.SSS", Locale.getDefault()).format(Date())
        val logEntry = "[$timestamp] $message"
        
        Log.d(TAG, message)
        
        if (isDebugMode) {
            debugLogs.add(logEntry)
            if (debugLogs.size > 1000) {
                debugLogs.removeAt(0)
            }
        }
    }
    
    private fun generateNSU(): String {
        return String.format("%012d", System.currentTimeMillis() % 1000000000000L)
    }
    
    private fun generateAuthCode(): String {
        return String.format("%06d", (Math.random() * 999999).toInt())
    }
}
```

### 4.3 res/values/styles.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.Totem.Fullscreen" parent="Theme.AppCompat.NoActionBar">
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
        <item name="android:windowBackground">@android:color/black</item>
    </style>
</resources>
```

---

## 5. Contato PayGo para SDK

Para solicitar o SDK PayGo TEF Local, entre em contato:

- **Email**: suporte@paygo.com.br
- **Telefone**: (11) 3003-0000
- **Portal**: https://portal.paygo.com.br

### Informações para homologação:
- **Modelo do Pinpad**: Gertec PPC930
- **Tipo de conexão**: USB (CDC/ACM)
- **Ambiente**: Homologação → Produção
- **Modalidades**: Débito, Crédito à vista, Crédito parcelado, Voucher

---

## 6. Checklist de Implementação

### App Android
- [ ] Configurar projeto Android Studio
- [ ] Implementar WebView com JavaScript habilitado
- [ ] Implementar TEFBridge com interface JavaScript
- [ ] Integrar SDK PayGo TEF Local
- [ ] Configurar permissões USB para PPC930
- [ ] Implementar modo fullscreen imersivo
- [ ] Testar comunicação com pinpad
- [ ] Implementar tratamento de erros
- [ ] Adicionar modo debug/logs

### PWA (Costa Urbana)
- [x] Implementar `window.onTefResultado(resultado)`
- [x] Detectar ambiente Android WebView
- [x] Criar hooks para comunicação com bridge
- [x] Atualizar UI durante processamento
- [x] Implementar fallback para ambiente web

### Homologação
- [ ] Obter SDK PayGo TEF Local
- [ ] Configurar ambiente de homologação PayGo
- [ ] Testar transações de débito
- [ ] Testar transações de crédito à vista
- [ ] Testar transações de crédito parcelado
- [ ] Testar cancelamentos
- [ ] Validar comprovantes
- [ ] Documentar cenários de erro

---

## 7. Troubleshooting

### Pinpad não detectado
1. Verificar cabo USB conectado corretamente
2. Verificar se Vendor/Product ID estão corretos no device_filter.xml
3. Reiniciar o tablet
4. Verificar se outro app não está usando o pinpad

### Erro de permissão USB
1. Verificar se o intent-filter está configurado no manifest
2. Verificar se o PendingIntent está com FLAG_IMMUTABLE
3. Desinstalar e reinstalar o app

### WebView não carrega
1. Verificar conexão com internet
2. Verificar se a URL do PWA está correta
3. Verificar logs do WebChromeClient
4. Limpar cache do WebView

### Transação não processa
1. Verificar logs do SDK PayGo
2. Verificar se o pinpad está inicializado
3. Verificar conectividade com servidor PayGo
4. Ativar modo debug e capturar logs

---

## 8. Segurança

- **Não armazenar** dados de cartão no app
- **Não logar** dados sensíveis em produção
- **Usar HTTPS** para comunicação com PWA
- **Validar** todos os inputs do JavaScript
- **Ofuscar** código em builds de produção
- **Implementar** certificate pinning se necessário
