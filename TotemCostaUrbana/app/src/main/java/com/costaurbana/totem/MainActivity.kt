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
import android.os.Build
import android.os.Bundle
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
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "TotemMain"
        private const val ACTION_USB_PERMISSION = "com.costaurbana.totem.USB_PERMISSION"
        
        // Gertec PPC930 USB IDs
        private const val VENDOR_ID_GERTEC = 1753
        
        // URL do Totem Web
        private const val PWA_URL = "https://d8077827-f7c8-4ebd-8463-ec535c4f64a5.lovableproject.com/totem"
    }

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var statusText: TextView
    private lateinit var loadingOverlay: View
    
    private lateinit var usbManager: UsbManager
    private lateinit var tefBridge: TEFBridge
    private lateinit var payGoService: PayGoService

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
                                Log.i(TAG, "USB Permission granted for device: ${it.deviceName}")
                                payGoService.onUsbPermissionGranted(it) 
                                notifyWebViewPinpadStatus(true)
                            }
                        } else {
                            Log.w(TAG, "USB Permission denied")
                            payGoService.onUsbPermissionDenied()
                            notifyWebViewPinpadStatus(false)
                        }
                    }
                }
                UsbManager.ACTION_USB_DEVICE_ATTACHED -> {
                    Log.i(TAG, "USB Device attached")
                    checkAndRequestUsbPermission()
                }
                UsbManager.ACTION_USB_DEVICE_DETACHED -> {
                    Log.i(TAG, "USB Device detached")
                    payGoService.onPinpadDisconnected()
                    notifyWebViewPinpadStatus(false)
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.i(TAG, "=== TotemCostaUrbana Starting ===")
        
        // Fullscreen mode
        enableImmersiveMode()
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContentView(R.layout.activity_main)

        // Initialize views
        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        statusText = findViewById(R.id.statusText)
        loadingOverlay = findViewById(R.id.loadingOverlay)

        // Initialize USB
        usbManager = getSystemService(Context.USB_SERVICE) as UsbManager
        payGoService = PayGoService(this)

        // Configure WebView
        configureWebView()
        
        // Setup JavaScript interface
        setupJavascriptInterface()
        
        // Register USB receiver
        registerUsbReceiver()
        
        // Check for connected pinpad
        checkAndRequestUsbPermission()

        // Load the PWA
        Log.i(TAG, "Loading URL: $PWA_URL")
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
            
            // Modern settings
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                safeBrowsingEnabled = false
            }
        }

        // Enable debugging in development
        WebView.setWebContentsDebuggingEnabled(true)

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                Log.d(TAG, "Page started: $url")
                loadingOverlay.visibility = View.VISIBLE
                statusText.text = "Carregando..."
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.i(TAG, "Page finished: $url")
                loadingOverlay.visibility = View.GONE
                
                // Notify WebView that Android is ready
                notifyAndroidReady()
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    Log.e(TAG, "Error loading page: ${error?.description}")
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
                
                // Keep navigation inside WebView for our domain
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
                if (newProgress == 100) {
                    progressBar.visibility = View.GONE
                } else {
                    progressBar.visibility = View.VISIBLE
                }
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                consoleMessage?.let {
                    Log.d(TAG, "[WebView] ${it.messageLevel()}: ${it.message()} (${it.sourceId()}:${it.lineNumber()})")
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
        Log.i(TAG, "JavaScript interface 'TEF' added")
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
        
        Log.d(TAG, "USB receiver registered")
    }

    private fun checkAndRequestUsbPermission() {
        val deviceList = usbManager.deviceList
        Log.d(TAG, "Connected USB devices: ${deviceList.size}")
        
        deviceList.values.forEach { device ->
            Log.d(TAG, "USB Device: ${device.deviceName}, Vendor: ${device.vendorId}, Product: ${device.productId}")
            
            if (device.vendorId == VENDOR_ID_GERTEC) {
                Log.i(TAG, "Gertec pinpad detected!")
                
                if (!usbManager.hasPermission(device)) {
                    val pendingIntent = PendingIntent.getBroadcast(
                        this,
                        0,
                        Intent(ACTION_USB_PERMISSION),
                        PendingIntent.FLAG_IMMUTABLE
                    )
                    usbManager.requestPermission(device, pendingIntent)
                    Log.d(TAG, "Requesting USB permission...")
                } else {
                    Log.i(TAG, "USB permission already granted")
                    payGoService.onUsbPermissionGranted(device)
                    notifyWebViewPinpadStatus(true)
                }
            }
        }
    }

    private fun notifyAndroidReady() {
        val version = packageManager.getPackageInfo(packageName, 0).versionName
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
        if (hasFocus) {
            enableImmersiveMode()
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            // No back navigation - this is a kiosk app
            // super.onBackPressed()
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        enableImmersiveMode()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(usbReceiver)
        } catch (e: Exception) {
            Log.w(TAG, "Error unregistering receiver: ${e.message}")
        }
        webView.destroy()
    }
}
