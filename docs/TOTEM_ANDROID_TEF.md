# Totem Android - Integração TEF PayGo Local

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Requisitos](#requisitos)
4. [Estrutura do Projeto Android](#estrutura-do-projeto-android)
5. [Configuração Inicial](#configuração-inicial)
6. [Implementação Detalhada](#implementação-detalhada)
7. [Integração SDK PayGo](#integração-sdk-paygo)
8. [Comunicação JavaScript ↔ Android](#comunicação-javascript--android)
9. [Fluxo de Transações](#fluxo-de-transações)
10. [Gerenciamento USB/Pinpad](#gerenciamento-usbpinpad)
11. [Modo Debug e Logs](#modo-debug-e-logs)
12. [Homologação PayGo](#homologação-paygo)
13. [Deploy e Distribuição](#deploy-e-distribuição)
14. [Troubleshooting](#troubleshooting)
15. [Referências](#referências)

---

## Visão Geral

Este documento descreve a arquitetura e implementação do app Android nativo para o Totem da Barbearia Costa Urbana, com integração TEF PayGo Local e pinpad PPC930 USB.

### Objetivo

Criar um APK Android que:
- Carrega o PWA do Totem em uma WebView fullscreen
- Expõe uma bridge JavaScript para comunicação com o código nativo
- Integra o SDK PayGo TEF Local para processar pagamentos
- Gerencia o pinpad Gertec PPC930 via USB

### Por que é necessário um APK nativo?

O SDK PayGo TEF Local é **exclusivamente nativo Android** (Java/Kotlin). Não existe versão web/JavaScript do SDK, portanto:

1. **PWA sozinho NÃO consegue** acessar o SDK
2. **Capacitor/Cordova NÃO resolve** porque precisamos do SDK proprietário da PayGo
3. **APK nativo é obrigatório** para chamar as funções do SDK

### Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FLUXO DE PAGAMENTO                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌─────────────────┐  │
│  │   PWA   │────▶│  Bridge  │────▶│  PayGo   │────▶│  Pinpad PPC930  │  │
│  │(WebView)│     │   TEF    │     │   SDK    │     │      (USB)      │  │
│  └────┬────┘     └────┬─────┘     └────┬─────┘     └────────┬────────┘  │
│       │               │                │                    │           │
│       │    JS call    │   SDK call     │   USB command      │           │
│       │◀──────────────│◀───────────────│◀───────────────────│           │
│       │   resultado   │   callback     │   resposta         │           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Arquitetura do Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          APK TOTEM COSTA URBANA                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          CAMADA DE APRESENTAÇÃO                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                      MainActivity.kt                             │  │  │
│  │  │  • Modo fullscreen imersivo                                      │  │  │
│  │  │  • Gerenciamento do ciclo de vida                                │  │  │
│  │  │  • Configuração da WebView                                       │  │  │
│  │  │  • Registro de receivers USB                                     │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          CAMADA DE BRIDGE                              │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                       TEFBridge.kt                               │  │  │
│  │  │  • @JavascriptInterface para o PWA                               │  │  │
│  │  │  • Parsing de parâmetros JSON                                    │  │  │
│  │  │  • Callbacks para o WebView                                      │  │  │
│  │  │  • Sistema de logs para debug                                    │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          CAMADA DE SERVIÇO                             │  │
│  │  ┌────────────────────────┐  ┌─────────────────────────────────────┐  │  │
│  │  │   PayGoService.kt      │  │      USBPinpadManager.kt            │  │  │
│  │  │  • Wrapper do SDK      │  │  • Detecção de dispositivos         │  │  │
│  │  │  • Gerencia transações │  │  • Solicitação de permissões        │  │  │
│  │  │  • Callbacks           │  │  • Comunicação serial               │  │  │
│  │  └────────────────────────┘  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          CAMADA DE INTEGRAÇÃO                          │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                   PayGo TEF Local SDK (.aar)                     │  │  │
│  │  │  • Biblioteca proprietária da PayGo                              │  │  │
│  │  │  • Comunicação com pinpad                                        │  │  │
│  │  │  • Processamento de transações                                   │  │  │
│  │  │  • Geração de comprovantes                                       │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │  Pinpad PPC930 USB  │
                          │  (Gertec)           │
                          └─────────────────────┘
```

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

---

## 9. Fluxo de Transações

### 9.1 Diagrama de Sequência - Pagamento com Sucesso

```
┌─────────┐          ┌───────────┐          ┌──────────┐          ┌─────────┐
│   PWA   │          │ TEFBridge │          │  PayGo   │          │ Pinpad  │
│(WebView)│          │  (Kotlin) │          │   SDK    │          │ PPC930  │
└────┬────┘          └─────┬─────┘          └────┬─────┘          └────┬────┘
     │                     │                     │                     │
     │ TEF.iniciarPagamento(json)                │                     │
     │────────────────────▶│                     │                     │
     │                     │                     │                     │
     │                     │ startTransaction()  │                     │
     │                     │────────────────────▶│                     │
     │                     │                     │                     │
     │                     │                     │ Insira o cartão     │
     │                     │                     │────────────────────▶│
     │                     │                     │                     │
     │                     │                     │◀────────────────────│
     │                     │                     │    Cartão lido      │
     │                     │                     │                     │
     │                     │                     │ Digite a senha      │
     │                     │                     │────────────────────▶│
     │                     │                     │                     │
     │                     │                     │◀────────────────────│
     │                     │                     │    Senha OK         │
     │                     │                     │                     │
     │                     │                     │──────┐              │
     │                     │                     │      │ Autorização  │
     │                     │                     │◀─────┘ Adquirente   │
     │                     │                     │                     │
     │                     │◀────────────────────│                     │
     │                     │   onSuccess()       │                     │
     │                     │                     │                     │
     │◀────────────────────│                     │                     │
     │ window.onTefResultado(resultado)          │                     │
     │                     │                     │                     │
```

### 9.2 Diagrama de Sequência - Pagamento Negado

```
┌─────────┐          ┌───────────┐          ┌──────────┐          ┌─────────┐
│   PWA   │          │ TEFBridge │          │  PayGo   │          │ Pinpad  │
└────┬────┘          └─────┬─────┘          └────┬─────┘          └────┬────┘
     │                     │                     │                     │
     │ TEF.iniciarPagamento(json)                │                     │
     │────────────────────▶│                     │                     │
     │                     │────────────────────▶│                     │
     │                     │                     │────────────────────▶│
     │                     │                     │◀────────────────────│
     │                     │                     │                     │
     │                     │                     │──────┐              │
     │                     │                     │      │ Autorização  │
     │                     │                     │◀─────┘ NEGADA       │
     │                     │                     │                     │
     │                     │◀────────────────────│                     │
     │                     │   onError(51, "Saldo insuficiente")       │
     │                     │                     │                     │
     │◀────────────────────│                     │                     │
     │ window.onTefResultado({status:"negado"})  │                     │
```

### 9.3 Códigos de Resposta Comuns

| Código | Descrição | Ação Recomendada |
|--------|-----------|------------------|
| 00 | Transação aprovada | Finalizar venda |
| 05 | Não autorizada | Solicitar outra forma de pagamento |
| 14 | Cartão inválido | Verificar cartão |
| 51 | Saldo insuficiente | Tentar valor menor |
| 54 | Cartão expirado | Usar outro cartão |
| 55 | Senha inválida | Digitar novamente |
| 57 | Transação não permitida | Verificar tipo de cartão |
| 91 | Emissor indisponível | Tentar novamente |
| 96 | Falha de comunicação | Verificar conexão |

---

## 10. Gerenciamento USB/Pinpad

### 10.1 Identificação do Dispositivo

O pinpad Gertec PPC930 usa comunicação USB CDC/ACM:

```kotlin
// Identificadores USB
const val VENDOR_ID_GERTEC = 1753      // 0x06D9
const val PRODUCT_ID_PPC930 = 0xC902   // 51458 em decimal

// Verificar no device_filter.xml
// vendor-id deve ser em decimal: 1753
// product-id deve ser em decimal: 51458
```

### 10.2 Fluxo de Conexão USB

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FLUXO DE CONEXÃO USB                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│  │ App inicia   │───▶│ Busca USB    │───▶│ Pinpad encontrado?       │  │
│  └──────────────┘    │ devices      │    └─────────────┬────────────┘  │
│                      └──────────────┘                  │               │
│                                                        │               │
│                             ┌───────────────────────────┼───────────┐  │
│                             │ NÃO                       │ SIM       │  │
│                             ▼                           ▼           │  │
│                  ┌──────────────────────┐    ┌──────────────────┐   │  │
│                  │ Aguarda evento       │    │ Tem permissão?   │   │  │
│                  │ USB_DEVICE_ATTACHED  │    └────────┬─────────┘   │  │
│                  └──────────────────────┘             │             │  │
│                                           ┌───────────┼───────────┐ │  │
│                                           │ NÃO       │ SIM       │ │  │
│                                           ▼           ▼           │ │  │
│                                ┌────────────────┐ ┌────────────┐  │ │  │
│                                │ Solicita       │ │ Inicializa │  │ │  │
│                                │ permissão      │ │ SDK PayGo  │  │ │  │
│                                └───────┬────────┘ └────────────┘  │ │  │
│                                        │                          │ │  │
│                                        ▼                          │ │  │
│                                ┌────────────────┐                 │ │  │
│                                │ Usuário aceita │                 │ │  │
│                                │ permissão?     │                 │ │  │
│                                └───────┬────────┘                 │ │  │
│                                        │                          │ │  │
│                              ┌─────────┼─────────┐                │ │  │
│                              │ SIM     │ NÃO     │                │ │  │
│                              ▼         ▼         │                │ │  │
│                    ┌────────────┐ ┌──────────┐   │                │ │  │
│                    │ Inicializa │ │ Notifica │   │                │ │  │
│                    │ SDK PayGo  │ │ erro PWA │   │                │ │  │
│                    └────────────┘ └──────────┘   │                │ │  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Tratamento de Desconexão

```kotlin
// No TEFBridge.kt
fun onPinpadDisconnected() {
    isPinpadConnected = false
    
    // Se há transação em andamento, cancelar
    currentTransactionId?.let {
        sendError("PINPAD_DESCONECTADO", "Pinpad desconectado durante transação")
    }
    
    // Notificar PWA
    mainHandler.post {
        webView.evaluateJavascript(
            "window.dispatchEvent(new CustomEvent('tefPinpadDisconnected'));",
            null
        )
    }
    
    // Tentar reconectar automaticamente
    scheduleReconnect()
}

private fun scheduleReconnect() {
    mainHandler.postDelayed({
        checkAndRequestUsbPermission()
    }, 5000) // Tenta reconectar após 5 segundos
}
```

---

## 11. Modo Debug e Logs

### 11.1 Ativando Modo Debug

No PWA:
```javascript
// Ativar modo debug
if (window.TEF) {
    window.TEF.setModoDebug(true);
}
```

No código Android (para desenvolvimento):
```kotlin
// Em MainActivity.kt, durante onCreate
if (BuildConfig.DEBUG) {
    WebView.setWebContentsDebuggingEnabled(true)
    setDebugMode(true)
}
```

### 11.2 Capturando Logs para Homologação

```kotlin
// Adicionar em TEFBridge.kt
@JavascriptInterface
fun exportarLogsParaArquivo(): String {
    try {
        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val fileName = "tef_logs_$timestamp.txt"
        val file = File(context.getExternalFilesDir(null), fileName)
        
        file.writeText(debugLogs.joinToString("\n"))
        
        return JSONObject().apply {
            put("sucesso", true)
            put("arquivo", file.absolutePath)
            put("tamanho", file.length())
        }.toString()
    } catch (e: Exception) {
        return JSONObject().apply {
            put("sucesso", false)
            put("erro", e.message)
        }.toString()
    }
}
```

### 11.3 Formato dos Logs

```
[10:30:45.123] iniciarPagamento chamado: {"ordemId":"ORD123","valorCentavos":5000,"metodo":"credito"}
[10:30:45.125] Validando parâmetros...
[10:30:45.126] Iniciando transação no SDK PayGo
[10:30:45.500] SDK PayGo: Aguardando cartão
[10:30:48.200] SDK PayGo: Cartão lido - VISA ****1234
[10:30:48.250] SDK PayGo: Solicitando senha
[10:30:52.100] SDK PayGo: Senha confirmada
[10:30:52.150] SDK PayGo: Enviando para autorização
[10:30:54.800] SDK PayGo: Transação aprovada - NSU: 123456789012
[10:30:54.850] Enviando resultado para WebView
[10:30:54.852] Resultado enviado com sucesso
```

---

## 12. Homologação PayGo

### 12.1 Processo de Homologação

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ETAPAS DA HOMOLOGAÇÃO PAYGO                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. CADASTRO                                                            │
│     ├── Criar conta no Portal PayGo                                     │
│     ├── Solicitar acesso ao SDK TEF Local                               │
│     └── Receber credenciais de homologação                              │
│                                                                         │
│  2. DESENVOLVIMENTO                                                     │
│     ├── Integrar SDK no projeto Android                                 │
│     ├── Configurar ambiente de homologação                              │
│     └── Implementar todas as modalidades                                │
│                                                                         │
│  3. TESTES INTERNOS                                                     │
│     ├── Transações de débito (aprovado/negado)                          │
│     ├── Transações de crédito à vista                                   │
│     ├── Transações de crédito parcelado (2x, 3x, 6x, 12x)               │
│     ├── Transações de voucher                                           │
│     ├── Cancelamentos                                                   │
│     └── Cenários de erro (timeout, sem conexão, cartão inválido)        │
│                                                                         │
│  4. VALIDAÇÃO PAYGO                                                     │
│     ├── Enviar logs de todas as transações                              │
│     ├── Demonstração remota (se solicitado)                             │
│     └── Correções (se necessário)                                       │
│                                                                         │
│  5. PRODUÇÃO                                                            │
│     ├── Receber credenciais de produção                                 │
│     ├── Configurar ambiente de produção                                 │
│     ├── Teste de sanidade (1 transação real)                            │
│     └── Go-live                                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Cenários Obrigatórios de Teste

| # | Cenário | Valor | Parcelas | Resultado Esperado |
|---|---------|-------|----------|-------------------|
| 1 | Débito aprovado | R$ 10,00 | - | Aprovado |
| 2 | Débito negado | R$ 0,51 | - | Negado (saldo) |
| 3 | Crédito à vista | R$ 25,00 | 1 | Aprovado |
| 4 | Crédito 2x | R$ 50,00 | 2 | Aprovado |
| 5 | Crédito 3x | R$ 75,00 | 3 | Aprovado |
| 6 | Crédito 6x | R$ 150,00 | 6 | Aprovado |
| 7 | Crédito 12x | R$ 300,00 | 12 | Aprovado |
| 8 | Voucher | R$ 30,00 | - | Aprovado |
| 9 | Cancelamento | - | - | Cancelado |
| 10 | Timeout | - | - | Erro tratado |
| 11 | Cartão inválido | R$ 10,00 | - | Erro tratado |
| 12 | Senha incorreta | R$ 10,00 | - | Erro tratado |

### 12.3 Contato PayGo

| Canal | Informação |
|-------|------------|
| **Email Suporte** | suporte@paygo.com.br |
| **Email Comercial** | comercial@paygo.com.br |
| **Telefone** | (11) 3003-0000 |
| **Portal** | https://portal.paygo.com.br |
| **Documentação** | https://docs.paygo.com.br |

### 12.4 Dados para Solicitar SDK

Ao entrar em contato com a PayGo, forneça:

```
Empresa: Barbearia Costa Urbana
CNPJ: [Seu CNPJ]
Contato: [Nome do responsável]
Email: [Email]
Telefone: [Telefone]

Necessidades:
- SDK TEF Local para Android
- Pinpad: Gertec PPC930 (USB)
- Tablet: Samsung Galaxy Tab A SM-T510
- Modalidades: Débito, Crédito (à vista e parcelado), Voucher
- Ambiente: Homologação inicialmente, depois Produção

Observações:
- Integração via WebView + JavascriptInterface
- App de Totem para autoatendimento
```

---

## 13. Deploy e Distribuição

### 13.1 Gerando APK de Release

```bash
# No Android Studio ou via terminal

# 1. Configurar keystore (primeira vez)
keytool -genkey -v -keystore totem-release.keystore \
    -alias totem \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000

# 2. Configurar em build.gradle
android {
    signingConfigs {
        release {
            storeFile file("totem-release.keystore")
            storePassword "sua_senha"
            keyAlias "totem"
            keyPassword "sua_senha"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

# 3. Gerar APK
./gradlew assembleRelease

# APK estará em: app/build/outputs/apk/release/app-release.apk
```

### 13.2 Instalação no Tablet

```bash
# Via ADB
adb install -r app-release.apk

# Ou copiar para o tablet e instalar manualmente
# (Habilitar "Fontes desconhecidas" nas configurações)
```

### 13.3 Configuração como Launcher

Para o app funcionar como Totem (kiosk mode):

1. No AndroidManifest.xml (já configurado):
```xml
<intent-filter>
    <category android:name="android.intent.category.HOME" />
    <category android:name="android.intent.category.DEFAULT" />
</intent-filter>
```

2. Após instalar, pressionar Home e selecionar o app como launcher padrão

3. Para sair do modo kiosk (manutenção):
```bash
adb shell am start -a android.settings.SETTINGS
```

---

## 14. Checklist de Implementação

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

---

## 16. Segurança

### 16.1 Boas Práticas

| Prática | Implementação |
|---------|---------------|
| **Não armazenar dados de cartão** | SDK PayGo gerencia isso |
| **Não logar dados sensíveis** | Mascarar PAN, CVV em logs |
| **Usar HTTPS** | WebView só aceita HTTPS |
| **Validar inputs** | Sanitizar JSON do JavaScript |
| **Ofuscar código** | ProGuard habilitado em release |
| **Certificate pinning** | Opcional, mas recomendado |

### 16.2 Configuração ProGuard

```proguard
# proguard-rules.pro

# Manter classes do SDK PayGo
-keep class com.paygo.** { *; }
-keepclassmembers class com.paygo.** { *; }

# Manter interface JavaScript
-keepclassmembers class com.costaurbana.totem.TEFBridge {
    @android.webkit.JavascriptInterface <methods>;
}

# Logs
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
}
```

---

## 17. Estrutura Final do Projeto

```
totem-android/
├── app/
│   ├── build.gradle
│   ├── proguard-rules.pro
│   ├── libs/
│   │   └── paygo-tef-local-sdk.aar    # SDK PayGo (obter com PayGo)
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml
│           ├── java/com/costaurbana/totem/
│           │   ├── MainActivity.kt
│           │   ├── TEFBridge.kt
│           │   ├── PayGoService.kt        # Wrapper do SDK
│           │   └── USBPinpadManager.kt    # Gerenciador USB
│           └── res/
│               ├── xml/
│               │   └── device_filter.xml
│               ├── values/
│               │   ├── strings.xml
│               │   └── styles.xml
│               └── mipmap-*/
│                   └── ic_launcher.png
├── build.gradle
├── settings.gradle
└── gradle.properties
```

---

## 18. Referências

### Documentação Oficial

| Recurso | Link |
|---------|------|
| Android WebView | https://developer.android.com/reference/android/webkit/WebView |
| JavascriptInterface | https://developer.android.com/reference/android/webkit/JavascriptInterface |
| USB Host | https://developer.android.com/guide/topics/connectivity/usb/host |
| PayGo Portal | https://portal.paygo.com.br |
| Gertec PPC930 | https://www.gertec.com.br/produto/ppc930 |

### Bibliotecas Úteis

| Biblioteca | Uso |
|------------|-----|
| usb-serial-for-android | Comunicação serial USB |
| Timber | Logging avançado |
| Moshi/Gson | Parsing JSON |

---

## 19. Próximos Passos

1. **Solicitar SDK PayGo** - Entrar em contato com suporte@paygo.com.br
2. **Contratar desenvolvedor Android** - Com experiência em TEF/pagamentos
3. **Configurar ambiente** - Android Studio + Tablet + Pinpad
4. **Desenvolver** - Seguir esta documentação
5. **Homologar** - Testar com PayGo
6. **Deploy** - Instalar nos Totems

---

## 20. Suporte

Para dúvidas sobre esta documentação ou o PWA:
- **Sistema**: Barbearia Costa Urbana
- **PWA URL**: https://d8077827-f7c8-4ebd-8463-ec535c4f64a5.lovableproject.com/totem

Para dúvidas sobre o SDK PayGo:
- **Email**: suporte@paygo.com.br
- **Portal**: https://portal.paygo.com.br
