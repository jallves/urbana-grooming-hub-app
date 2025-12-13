package com.costaurbana.totem

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Bitmap
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "TotemMain"
        
        // URL do Totem Web - Produção
        private const val PWA_URL = "https://barbeariacostaurbana.com.br/totem"
        
        // Auto-start delay
        private const val AUTO_START_DELAY = 10000L // 10 seconds
    }

    // Views - Diagnostic Screen
    private lateinit var diagnosticScreen: ScrollView
    private lateinit var tvAppVersion: TextView
    private lateinit var tvPackageName: TextView
    private lateinit var tvBuildNumber: TextView
    private lateinit var tvAndroidVersion: TextView
    private lateinit var tvSdkVersion: TextView
    private lateinit var tvDeviceModel: TextView
    private lateinit var tvNetworkStatus: TextView
    private lateinit var tvUsbStatus: TextView
    private lateinit var tvPinpadStatus: TextView
    private lateinit var tvSdkStatus: TextView
    private lateinit var tvUsbDevicesList: TextView
    private lateinit var tvLogOutput: TextView
    private lateinit var tvAutoStartInfo: TextView
    private lateinit var statusNetworkIndicator: View
    private lateinit var statusUsbIndicator: View
    private lateinit var statusPinpadIndicator: View
    private lateinit var statusSdkIndicator: View
    private lateinit var btnRefresh: Button
    private lateinit var btnStartTotem: Button

    // Views - WebView
    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var statusText: TextView
    private lateinit var loadingOverlay: View
    
    private lateinit var tefBridge: TEFBridge
    private lateinit var payGoService: PayGoService

    private val handler = Handler(Looper.getMainLooper())
    private var autoStartRunnable: Runnable? = null
    private var autoStartCountdown = 10
    private val logMessages = StringBuilder()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        try {
            // Keep screen on
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

            setContentView(R.layout.activity_main)

            // Initialize all views FIRST before any addLog calls
            initializeViews()
            
            // NOW we can use addLog safely
            addLog("=== TotemCostaUrbana Starting ===")
            addLog("Android: ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})")
            addLog("Device: ${Build.MANUFACTURER} ${Build.MODEL}")

            // Initialize PayGo Service (gerencia pinpad internamente)
            payGoService = PayGoService(this)
            
            // Configure WebView (but don't show it yet)
            configureWebView()
            
            // Setup JavaScript interface
            setupJavascriptInterface()

            // Update diagnostic info
            updateDiagnosticInfo()

            // Setup button listeners
            setupButtonListeners()

            // Start auto-start countdown
            startAutoStartCountdown()
            
            // Handle PayGo response if launched via Intent
            handlePayGoIntent(intent)
            
            addLog("=== Initialization Complete ===")
            
        } catch (e: Exception) {
            Log.e(TAG, "CRITICAL ERROR in onCreate: ${e.message}", e)
            // Show error on screen if possible
            try {
                android.widget.Toast.makeText(
                    this,
                    "Erro ao inicializar: ${e.message}",
                    android.widget.Toast.LENGTH_LONG
                ).show()
            } catch (_: Exception) {}
        }
    }
    
    /**
     * Recebe Intent quando a Activity já está em execução (singleTask)
     * Usado para receber respostas do PayGo Integrado
     */
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        addLog("onNewIntent received")
        intent?.let { handlePayGoIntent(it) }
    }
    
    /**
     * Processa Intent de resposta do PayGo Integrado
     * Action: br.com.setis.interfaceautomacao.SERVICO
     */
    private fun handlePayGoIntent(intent: Intent?) {
        if (intent == null) return
        
        val action = intent.action
        addLog("handlePayGoIntent: action=$action")
        
        // Verificar se é resposta do PayGo
        if (action == PayGoService.ACTION_RESPONSE) {
            addLog("✅ PayGo response received!")
            
            val responseUri = intent.data
            if (responseUri != null) {
                addLog("Response URI: $responseUri")
                payGoService.handlePayGoResponse(responseUri)
                
                // Notificar WebView do resultado
                notifyWebViewPaymentResult(responseUri)
                
                // Retornar para o WebView (se estava em background)
                if (webView.visibility != View.VISIBLE) {
                    startTotemWebView()
                }
            } else {
                addLog("⚠️ PayGo response without URI data")
                // Tentar verificar extras
                intent.extras?.let { extras ->
                    addLog("Intent extras: ${extras.keySet().joinToString()}")
                }
            }
        }
        
        // Verificar também scheme "app" que pode vir como resposta
        intent.data?.let { uri ->
            if (uri.scheme == "app" && (uri.host == "payment" || uri.host == "resolve")) {
                addLog("✅ PayGo URI response via data: $uri")
                payGoService.handlePayGoResponse(uri)
                notifyWebViewPaymentResult(uri)
            }
        }
    }
    
    /**
     * Notifica o WebView sobre o resultado do pagamento
     */
    private fun notifyWebViewPaymentResult(responseUri: android.net.Uri) {
        try {
            // Converter query params para JSON
            val jsonParams = org.json.JSONObject()
            responseUri.queryParameterNames.forEach { key ->
                responseUri.getQueryParameter(key)?.let { value ->
                    jsonParams.put(key, value)
                }
            }
            
            val jsonString = jsonParams.toString()
            
            val js = """
                (function() {
                    console.log('[Android] PayGo response received');
                    console.log('[Android] Response data:', $jsonString);
                    if (window.onTefResultado) {
                        try {
                            window.onTefResultado($jsonString);
                            console.log('[Android] onTefResultado called successfully');
                        } catch(e) {
                            console.error('[Android] Error calling onTefResultado:', e);
                        }
                    } else {
                        console.warn('[Android] window.onTefResultado not defined');
                    }
                    if (window.dispatchEvent) {
                        window.dispatchEvent(new CustomEvent('tefPaymentResult', { 
                            detail: $jsonString 
                        }));
                    }
                })();
            """.trimIndent()
            
            runOnUiThread {
                if (!isFinishing && !isDestroyed) {
                    webView.evaluateJavascript(js, null)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error notifying WebView payment result: ${e.message}", e)
        }
    }

    private fun initializeViews() {
        try {
            // Diagnostic screen views
            diagnosticScreen = findViewById(R.id.diagnosticScreen)
            tvAppVersion = findViewById(R.id.tvAppVersion)
            tvPackageName = findViewById(R.id.tvPackageName)
            tvBuildNumber = findViewById(R.id.tvBuildNumber)
            tvAndroidVersion = findViewById(R.id.tvAndroidVersion)
            tvSdkVersion = findViewById(R.id.tvSdkVersion)
            tvDeviceModel = findViewById(R.id.tvDeviceModel)
            tvNetworkStatus = findViewById(R.id.tvNetworkStatus)
            tvUsbStatus = findViewById(R.id.tvUsbStatus)
            tvPinpadStatus = findViewById(R.id.tvPinpadStatus)
            tvSdkStatus = findViewById(R.id.tvSdkStatus)
            tvUsbDevicesList = findViewById(R.id.tvUsbDevicesList)
            tvLogOutput = findViewById(R.id.tvLogOutput)
            tvAutoStartInfo = findViewById(R.id.tvAutoStartInfo)
            statusNetworkIndicator = findViewById(R.id.statusNetworkIndicator)
            statusUsbIndicator = findViewById(R.id.statusUsbIndicator)
            statusPinpadIndicator = findViewById(R.id.statusPinpadIndicator)
            statusSdkIndicator = findViewById(R.id.statusSdkIndicator)
            btnRefresh = findViewById(R.id.btnRefresh)
            btnStartTotem = findViewById(R.id.btnStartTotem)

            // WebView views
            webView = findViewById(R.id.webView)
            progressBar = findViewById(R.id.progressBar)
            statusText = findViewById(R.id.statusText)
            loadingOverlay = findViewById(R.id.loadingOverlay)
            
            addLog("✅ Views initialized successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing views: ${e.message}", e)
            throw e
        }
    }

    private fun setupButtonListeners() {
        btnRefresh.setOnClickListener {
            addLog("🔄 Manual refresh triggered")
            updateDiagnosticInfo()
        }

        btnStartTotem.setOnClickListener {
            cancelAutoStart()
            startTotemWebView()
        }
    }

    private fun updateDiagnosticInfo() {
        // App info
        try {
            val packageInfo = packageManager.getPackageInfo(packageName, 0)
            tvAppVersion.text = packageInfo.versionName ?: "1.0.0"
            tvBuildNumber.text = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo.longVersionCode.toString()
            } else {
                @Suppress("DEPRECATION")
                packageInfo.versionCode.toString()
            }
        } catch (e: Exception) {
            tvAppVersion.text = "1.0.0"
            tvBuildNumber.text = "1"
        }
        tvPackageName.text = packageName

        // System info
        tvAndroidVersion.text = "${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})"
        tvSdkVersion.text = Build.VERSION.SDK_INT.toString()
        tvDeviceModel.text = "${Build.MANUFACTURER} ${Build.MODEL}"

        // Network status
        updateNetworkStatus()

        // PayGo status (o PayGo gerencia o pinpad)
        updatePayGoStatus()

        addLog("📊 Diagnostic info updated")
    }

    private fun updateNetworkStatus() {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork
        val capabilities = connectivityManager.getNetworkCapabilities(network)

        val isConnected = capabilities != null && (
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
        )

        if (isConnected) {
            val type = when {
                capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> "WiFi"
                capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) == true -> "Ethernet"
                capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true -> "Mobile"
                else -> "Connected"
            }
            tvNetworkStatus.text = type
            tvNetworkStatus.setTextColor(0xFF22C55E.toInt())
            statusNetworkIndicator.setBackgroundResource(R.drawable.status_indicator_green)
            addLog("✅ Network: $type")
        } else {
            tvNetworkStatus.text = "Desconectado"
            tvNetworkStatus.setTextColor(0xFFEF4444.toInt())
            statusNetworkIndicator.setBackgroundResource(R.drawable.status_indicator_red)
            addLog("❌ Network: Disconnected")
        }
    }

    private fun updatePayGoStatus() {
        val payGoInfo = payGoService.getPayGoInfo()
        val installed = payGoInfo.optBoolean("installed", false)
        val version = payGoInfo.optString("version", "")
        
        if (installed) {
            tvSdkStatus.text = "PayGo Instalado (v$version)"
            tvSdkStatus.setTextColor(0xFF22C55E.toInt())
            statusSdkIndicator.setBackgroundResource(R.drawable.status_indicator_green)
            
            // Pinpad é gerenciado pelo PayGo
            tvPinpadStatus.text = "Gerenciado pelo PayGo"
            tvPinpadStatus.setTextColor(0xFF22C55E.toInt())
            statusPinpadIndicator.setBackgroundResource(R.drawable.status_indicator_green)
            
            // USB não precisa ser verificado para pinpad (PayGo gerencia)
            tvUsbStatus.text = "Via PayGo"
            statusUsbIndicator.setBackgroundResource(R.drawable.status_indicator_green)
            tvUsbDevicesList.text = "O PayGo Integrado gerencia a conexão com o pinpad internamente.\nNão é necessário conectar via USB diretamente."
            
            addLog("✅ PayGo: Instalado v$version")
            addLog("✅ Pinpad: Gerenciado pelo PayGo")
        } else {
            tvSdkStatus.text = "PayGo NÃO instalado"
            tvSdkStatus.setTextColor(0xFFEF4444.toInt())
            statusSdkIndicator.setBackgroundResource(R.drawable.status_indicator_red)
            
            tvPinpadStatus.text = "Instale o PayGo"
            tvPinpadStatus.setTextColor(0xFFEF4444.toInt())
            statusPinpadIndicator.setBackgroundResource(R.drawable.status_indicator_red)
            
            tvUsbStatus.text = "N/A"
            statusUsbIndicator.setBackgroundResource(R.drawable.status_indicator_yellow)
            tvUsbDevicesList.text = "❌ PayGo Integrado não está instalado!\n\nInstale o aplicativo PayGo para processar pagamentos com cartão."
            
            addLog("❌ PayGo: NÃO instalado")
        }
    }

    private fun addLog(message: String) {
        val timestamp = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        val logLine = "[$timestamp] $message\n"
        
        Log.i(TAG, message)
        
        logMessages.append(logLine)
        
        // Keep only last 50 lines
        val lines = logMessages.toString().lines()
        if (lines.size > 50) {
            logMessages.clear()
            logMessages.append(lines.takeLast(50).joinToString("\n"))
        }
        
        // Verificar se tvLogOutput foi inicializado antes de usar
        runOnUiThread {
            try {
                if (::tvLogOutput.isInitialized) {
                    tvLogOutput.text = logMessages.toString()
                }
            } catch (e: Exception) {
                // Ignorar erro se view ainda não está pronta
            }
        }
    }

    private fun startAutoStartCountdown() {
        autoStartCountdown = 10
        
        autoStartRunnable = object : Runnable {
            override fun run() {
                if (autoStartCountdown > 0) {
                    tvAutoStartInfo.text = "Iniciando automaticamente em ${autoStartCountdown}s... (toque em Iniciar para começar agora)"
                    autoStartCountdown--
                    handler.postDelayed(this, 1000)
                } else {
                    startTotemWebView()
                }
            }
        }
        
        handler.post(autoStartRunnable!!)
    }

    private fun cancelAutoStart() {
        autoStartRunnable?.let { handler.removeCallbacks(it) }
        tvAutoStartInfo.text = "Auto-start cancelado"
    }

    private fun startTotemWebView() {
        addLog("▶️ Starting Totem WebView...")
        
        // Verificar conexão de internet antes de carregar
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork
        val capabilities = connectivityManager.getNetworkCapabilities(network)
        
        val isConnected = capabilities != null && (
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
        )
        
        if (!isConnected) {
            addLog("❌ SEM CONEXÃO DE INTERNET!")
            android.widget.Toast.makeText(
                this,
                "Sem conexão de internet. Verifique a conexão e tente novamente.",
                android.widget.Toast.LENGTH_LONG
            ).show()
            return
        }
        
        addLog("✅ Conexão de internet OK")
        
        // Hide diagnostic screen, show loading
        diagnosticScreen.visibility = View.GONE
        loadingOverlay.visibility = View.VISIBLE
        webView.visibility = View.VISIBLE
        
        // Enable immersive mode
        enableImmersiveMode()
        
        // Load the PWA
        addLog("🌐 Loading URL: $PWA_URL")
        addLog("🌐 WebView settings:")
        addLog("   - JavaScript: ${webView.settings.javaScriptEnabled}")
        addLog("   - DOM Storage: ${webView.settings.domStorageEnabled}")
        addLog("   - Mixed Content: ${webView.settings.mixedContentMode}")
        
        statusText.text = "Carregando..."
        webView.loadUrl(PWA_URL)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = false
            displayZoomControls = false
            setSupportZoom(false)
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                safeBrowsingEnabled = false
            }
        }

        WebView.setWebContentsDebuggingEnabled(true)

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                addLog("📄 Page started: $url")
                loadingOverlay.visibility = View.VISIBLE
                statusText.text = "Carregando..."
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                addLog("✅ Page finished: $url")
                loadingOverlay.visibility = View.GONE
                notifyAndroidReady()
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    addLog("❌ Error loading page: ${error?.description}")
                    addLog("❌ Error code: ${error?.errorCode}")
                    statusText.text = "Erro ao carregar. Toque para tentar novamente."
                    loadingOverlay.setOnClickListener {
                        webView.reload()
                    }
                }
            }
            
            @android.annotation.SuppressLint("WebViewClientOnReceivedSslError")
            override fun onReceivedSslError(
                view: WebView?,
                handler: android.webkit.SslErrorHandler?,
                error: android.net.http.SslError?
            ) {
                addLog("⚠️ SSL Error: ${error?.primaryError}")
                addLog("⚠️ SSL URL: ${error?.url}")
                // Aceitar certificado para domínio de produção
                if (error?.url?.contains("barbeariacostaurbana.com.br") == true) {
                    addLog("✅ Aceitando SSL para domínio confiável")
                    handler?.proceed()
                } else {
                    addLog("❌ Rejeitando SSL para domínio desconhecido")
                    super.onReceivedSslError(view, handler, error)
                }
            }
            
            override fun onReceivedHttpError(
                view: WebView?,
                request: WebResourceRequest?,
                errorResponse: android.webkit.WebResourceResponse?
            ) {
                super.onReceivedHttpError(view, request, errorResponse)
                if (request?.isForMainFrame == true) {
                    addLog("❌ HTTP Error: ${errorResponse?.statusCode} - ${errorResponse?.reasonPhrase}")
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                addLog("🔗 URL loading: $url")
                // Permitir todos os URLs do domínio
                if (url.contains("barbeariacostaurbana.com.br") ||
                    url.contains("lovableproject.com") || 
                    url.contains("lovable.app")) {
                    return false
                }
                return false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                progressBar.progress = newProgress
                progressBar.visibility = if (newProgress == 100) View.GONE else View.VISIBLE
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                consoleMessage?.let {
                    Log.d(TAG, "[WebView] ${it.messageLevel()}: ${it.message()}")
                }
                return true
            }
        }
    }

    private fun setupJavascriptInterface() {
        tefBridge = TEFBridge(
            activity = this,
            webView = webView,
            payGoService = payGoService
        )
        
        webView.addJavascriptInterface(tefBridge, "TEF")
        addLog("📱 JavaScript interface 'TEF' added")
    }

    private fun notifyAndroidReady() {
        val version = try {
            packageManager.getPackageInfo(packageName, 0).versionName
        } catch (e: Exception) {
            "1.0.0"
        }
        
        val payGoInfo = payGoService.getPayGoInfo()
        val payGoInstalled = payGoInfo.optBoolean("installed", false)
        
        val js = """
            (function() {
                console.log('[Android] TEF Android ready, version: $version');
                console.log('[Android] PayGo installed: $payGoInstalled');
                console.log('[Android] window.TEF available:', typeof window.TEF !== 'undefined');
                
                // Disparar evento de pronto
                if (window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('tefAndroidReady', { 
                        detail: { 
                            version: '$version', 
                            pinpadConnected: $payGoInstalled,
                            payGoInstalled: $payGoInstalled
                        } 
                    }));
                }
                
                // Também disparar evento de pinpad conectado se PayGo estiver instalado
                if ($payGoInstalled && window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('tefPinpadConnected', { 
                        detail: { modelo: 'PayGo Integrado' } 
                    }));
                }
            })();
        """.trimIndent()
        
        runOnUiThread {
            webView.evaluateJavascript(js, null)
        }
    }

    private fun enableImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let { controller ->
                controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            )
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus && webView.visibility == View.VISIBLE) {
            enableImmersiveMode()
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // If WebView is visible and can go back
        if (webView.visibility == View.VISIBLE && webView.canGoBack()) {
            webView.goBack()
        } else if (webView.visibility == View.VISIBLE) {
            // Return to diagnostic screen
            webView.visibility = View.GONE
            loadingOverlay.visibility = View.GONE
            diagnosticScreen.visibility = View.VISIBLE
            addLog("⬅️ Returned to diagnostic screen")
        }
        // Don't call super - this is a kiosk app
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        if (webView.visibility == View.VISIBLE) {
            enableImmersiveMode()
        }
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        cancelAutoStart()
        webView.destroy()
    }
}
