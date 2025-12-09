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
        private const val ACTION_USB_PERMISSION = "com.costaurbana.totem.USB_PERMISSION"
        
        // Gertec PPC930 USB IDs
        private const val VENDOR_ID_GERTEC = 1753
        
        // URL do Totem Web
        private const val PWA_URL = "https://d8077827-f7c8-4ebd-8463-ec535c4f64a5.lovableproject.com/totem"
        
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
    
    private lateinit var usbManager: UsbManager
    private lateinit var tefBridge: TEFBridge
    private lateinit var payGoService: PayGoService

    private val handler = Handler(Looper.getMainLooper())
    private var autoStartRunnable: Runnable? = null
    private var autoStartCountdown = 10
    private var isPinpadConnected = false
    private val logMessages = StringBuilder()

    private val usbReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                ACTION_USB_PERMISSION -> {
                    synchronized(this) {
                        val device = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
                        } else {
                            @Suppress("DEPRECATION")
                            intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
                        }
                        
                        if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                            device?.let { 
                                addLog("✅ USB Permission granted: ${it.deviceName}")
                                payGoService.onUsbPermissionGranted(it) 
                                isPinpadConnected = true
                                updatePinpadStatus(true)
                                notifyWebViewPinpadStatus(true)
                            }
                        } else {
                            addLog("❌ USB Permission denied")
                            payGoService.onUsbPermissionDenied()
                            isPinpadConnected = false
                            updatePinpadStatus(false)
                            notifyWebViewPinpadStatus(false)
                        }
                    }
                }
                UsbManager.ACTION_USB_DEVICE_ATTACHED -> {
                    addLog("🔌 USB Device attached")
                    checkAndRequestUsbPermission()
                    updateUsbDevicesList()
                }
                UsbManager.ACTION_USB_DEVICE_DETACHED -> {
                    addLog("🔌 USB Device detached")
                    payGoService.onPinpadDisconnected()
                    isPinpadConnected = false
                    updatePinpadStatus(false)
                    updateUsbDevicesList()
                    notifyWebViewPinpadStatus(false)
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        addLog("=== TotemCostaUrbana Starting ===")
        
        // Keep screen on
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContentView(R.layout.activity_main)

        // Initialize all views
        initializeViews()

        // Initialize USB
        usbManager = getSystemService(Context.USB_SERVICE) as UsbManager
        payGoService = PayGoService(this)

        // Configure WebView (but don't show it yet)
        configureWebView()
        
        // Setup JavaScript interface
        setupJavascriptInterface()
        
        // Register USB receiver
        registerUsbReceiver()

        // Update diagnostic info
        updateDiagnosticInfo()
        
        // Check for connected pinpad
        checkAndRequestUsbPermission()

        // Setup button listeners
        setupButtonListeners()

        // Start auto-start countdown
        startAutoStartCountdown()
    }

    private fun initializeViews() {
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
    }

    private fun setupButtonListeners() {
        btnRefresh.setOnClickListener {
            addLog("🔄 Manual refresh triggered")
            updateDiagnosticInfo()
            checkAndRequestUsbPermission()
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

        // USB devices
        updateUsbDevicesList()

        // SDK status (always mock for now)
        tvSdkStatus.text = "Mock (não integrado)"
        statusSdkIndicator.setBackgroundResource(R.drawable.status_indicator_yellow)

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

    private fun updateUsbDevicesList() {
        val deviceList = usbManager.deviceList
        
        if (deviceList.isEmpty()) {
            tvUsbDevicesList.text = "Nenhum dispositivo detectado"
            tvUsbStatus.text = "Nenhum"
            statusUsbIndicator.setBackgroundResource(R.drawable.status_indicator_red)
        } else {
            val sb = StringBuilder()
            var hasGertec = false
            
            deviceList.values.forEachIndexed { index, device ->
                if (index > 0) sb.append("\n")
                val isGertec = device.vendorId == VENDOR_ID_GERTEC
                if (isGertec) hasGertec = true
                
                sb.append("${index + 1}. ")
                sb.append(if (isGertec) "🟢 " else "⚪ ")
                sb.append("VID: ${device.vendorId}, PID: ${device.productId}")
                if (isGertec) sb.append(" (Gertec)")
                sb.append("\n   ${device.deviceName}")
                
                device.productName?.let { sb.append("\n   $it") }
            }
            
            tvUsbDevicesList.text = sb.toString()
            tvUsbStatus.text = "${deviceList.size} dispositivo(s)"
            statusUsbIndicator.setBackgroundResource(
                if (hasGertec) R.drawable.status_indicator_green 
                else R.drawable.status_indicator_yellow
            )
        }
    }

    private fun updatePinpadStatus(connected: Boolean) {
        runOnUiThread {
            if (connected) {
                tvPinpadStatus.text = "Conectado (PPC930)"
                tvPinpadStatus.setTextColor(0xFF22C55E.toInt())
                statusPinpadIndicator.setBackgroundResource(R.drawable.status_indicator_green)
            } else {
                tvPinpadStatus.text = "Desconectado"
                tvPinpadStatus.setTextColor(0xFFEF4444.toInt())
                statusPinpadIndicator.setBackgroundResource(R.drawable.status_indicator_red)
            }
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
        
        runOnUiThread {
            tvLogOutput.text = logMessages.toString()
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
        
        // Hide diagnostic screen, show loading
        diagnosticScreen.visibility = View.GONE
        loadingOverlay.visibility = View.VISIBLE
        webView.visibility = View.VISIBLE
        
        // Enable immersive mode
        enableImmersiveMode()
        
        // Load the PWA
        addLog("🌐 Loading URL: $PWA_URL")
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
                    statusText.text = "Erro ao carregar. Tocque para tentar novamente."
                    loadingOverlay.setOnClickListener {
                        webView.reload()
                    }
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.contains("lovableproject.com") || url.contains("lovable.app")) {
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

    private fun registerUsbReceiver() {
        val filter = IntentFilter().apply {
            addAction(ACTION_USB_PERMISSION)
            addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
            addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(usbReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(usbReceiver, filter)
        }
        
        addLog("📡 USB receiver registered")
    }

    private fun checkAndRequestUsbPermission() {
        val deviceList = usbManager.deviceList
        addLog("🔍 Connected USB devices: ${deviceList.size}")
        
        deviceList.values.forEach { device ->
            addLog("   USB: VID=${device.vendorId}, PID=${device.productId}")
            
            if (device.vendorId == VENDOR_ID_GERTEC) {
                addLog("🎯 Gertec pinpad detected!")
                
                if (!usbManager.hasPermission(device)) {
                    val pendingIntent = PendingIntent.getBroadcast(
                        this,
                        0,
                        Intent(ACTION_USB_PERMISSION),
                        PendingIntent.FLAG_IMMUTABLE
                    )
                    usbManager.requestPermission(device, pendingIntent)
                    addLog("🔐 Requesting USB permission...")
                } else {
                    addLog("✅ USB permission already granted")
                    payGoService.onUsbPermissionGranted(device)
                    isPinpadConnected = true
                    updatePinpadStatus(true)
                }
            }
        }
    }

    private fun notifyAndroidReady() {
        val version = try {
            packageManager.getPackageInfo(packageName, 0).versionName
        } catch (e: Exception) {
            "1.0.0"
        }
        
        val js = """
            (function() {
                console.log('[Android] TEF Android ready, version: $version');
                if (window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('tefAndroidReady', { 
                        detail: { version: '$version' } 
                    }));
                }
            })();
        """.trimIndent()
        
        runOnUiThread {
            webView.evaluateJavascript(js, null)
        }
    }

    private fun notifyWebViewPinpadStatus(connected: Boolean) {
        val eventName = if (connected) "tefPinpadConnected" else "tefPinpadDisconnected"
        val modelo = if (connected) "PPC930" else ""
        
        val js = """
            (function() {
                console.log('[Android] Pinpad status: $connected');
                if (window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('$eventName', { 
                        detail: { modelo: '$modelo' } 
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
        try {
            unregisterReceiver(usbReceiver)
        } catch (e: Exception) {
            Log.w(TAG, "Error unregistering receiver: ${e.message}")
        }
        webView.destroy()
    }
}
