package com.costaurbana.totem

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.*
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.*
import android.util.Log
import android.view.*
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "TotemMain"
        private const val ACTION_USB_PERMISSION = "com.costaurbana.totem.USB_PERMISSION"

        private const val VENDOR_ID_GERTEC = 1753
        private const val PRODUCT_ID_PPC930 = 0xC902

        private const val PWA_URL =
            "https://d8077827-f7c8-4ebd-8463-ec535c4f64a5.lovableproject.com/totem"
    }

    private lateinit var webView: WebView
    private lateinit var usbManager: UsbManager
    private lateinit var tefBridge: TEFBridge
    private lateinit var payGoService: PayGoService

    private var isDebugMode = true

    private val usbReceiver = object : BroadcastReceiver() {
        override fun onReceive(c: Context?, intent: Intent?) {
            when (intent?.action) {
                ACTION_USB_PERMISSION -> {
                    val device = intent.getParcelableExtra<UsbDevice>(UsbManager.EXTRA_DEVICE)
                    if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                        device?.let { payGoService.onUsbPermissionGranted(it) }
                    } else payGoService.onUsbPermissionDenied()
                }
                UsbManager.ACTION_USB_DEVICE_ATTACHED -> checkAndRequestUsbPermission()
                UsbManager.ACTION_USB_DEVICE_DETACHED -> payGoService.onPinpadDisconnected()
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedState: Bundle?) {
        super.onCreate(savedState)

        enableImmersiveMode()
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContentView(R.layout.activity_main)

        usbManager = getSystemService(Context.USB_SERVICE) as UsbManager
        payGoService = PayGoService(this)

        webView = findViewById(R.id.webView)

        configureWebView()
        prepareJavascriptInterface()
        registerUsbReceiver()
        checkAndRequestUsbPermission()

        webView.loadUrl(PWA_URL)
    }

    private fun configureWebView() {
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        }

        WebView.setWebContentsDebuggingEnabled(true)

        webView.webChromeClient = object : WebChromeClient() {}
    }

    private fun prepareJavascriptInterface() {
        tefBridge = TEFBridge(
            activity = this,
            webView = webView,
            payGoService = payGoService,
            isDebugMode = isDebugMode
        )

        webView.addJavascriptInterface(tefBridge, "TEF")
    }

    private fun registerUsbReceiver() {
        val filter = IntentFilter().apply {
            addAction(ACTION_USB_PERMISSION)
            addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
            addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
        }
        registerReceiver(usbReceiver, filter)
    }

    private fun checkAndRequestUsbPermission() {
        usbManager.deviceList.values.forEach { device ->
            if (device.vendorId == VENDOR_ID_GERTEC) {
                val intent = PendingIntent.getBroadcast(
                    this, 0, Intent(ACTION_USB_PERMISSION), PendingIntent.FLAG_IMMUTABLE
                )
                usbManager.requestPermission(device, intent)
            }
        }
    }

    private fun enableImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let {
                it.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                it.systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility =
                (View.SYSTEM_UI_FLAG_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(usbReceiver)
    }
}
