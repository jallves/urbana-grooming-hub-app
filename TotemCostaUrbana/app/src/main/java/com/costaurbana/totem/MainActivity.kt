package com.costaurbana.totem

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
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
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * MainActivity - Totem de Autoatendimento Costa Urbana
 * 
 * Fluxo:
 * 1. Mostra tela de diagnóstico com informações do sistema
 * 2. Após 10 segundos (ou toque no botão), abre o WebView com o PWA
 * 3. O WebView se comunica com o PayGo via TEFBridge para pagamentos
 */
class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "TotemMain"
        
        // URL do Totem Web - Produção
        private const val PWA_URL = "https://barbeariacostaurbana.com.br/totem"
        
        // Auto-start delay
        private const val AUTO_START_DELAY = 10000L // 10 seconds
    }

    // Flag para indicar se views foram inicializadas (thread-safe)
    @Volatile
    private var viewsInitialized = false

    // Views - Diagnostic Screen (nullable para evitar lateinit crash)
    private var diagnosticScreen: ScrollView? = null
    private var tvAppVersion: TextView? = null
    private var tvPackageName: TextView? = null
    private var tvBuildNumber: TextView? = null
    private var tvAndroidVersion: TextView? = null
    private var tvSdkVersion: TextView? = null
    private var tvDeviceModel: TextView? = null
    private var tvNetworkStatus: TextView? = null
    private var tvUsbStatus: TextView? = null
    private var tvPinpadStatus: TextView? = null
    private var tvSdkStatus: TextView? = null
    private var tvUsbDevicesList: TextView? = null
    private var tvLogOutput: TextView? = null
    private var tvAutoStartInfo: TextView? = null
    private var statusNetworkIndicator: View? = null
    private var statusUsbIndicator: View? = null
    private var statusPinpadIndicator: View? = null
    private var statusSdkIndicator: View? = null
    private var btnRefresh: Button? = null
    private var btnStartTotem: Button? = null

    // Views - WebView (nullable para evitar lateinit crash)
    private var webView: WebView? = null
    private var progressBar: ProgressBar? = null
    private var statusText: TextView? = null
    private var loadingOverlay: View? = null
    
    // Services (nullable - inicializados após views)
    private var tefBridge: TEFBridge? = null
    private var payGoService: PayGoService? = null

    private val handler = Handler(Looper.getMainLooper())
    private var autoStartRunnable: Runnable? = null
    private var autoStartCountdown = 10
    private val logMessages = StringBuilder()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.i(TAG, "onCreate() starting...")
        
        try {
            // Keep screen on
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

            // Set content view FIRST
            setContentView(R.layout.activity_main)

            // Initialize all views
            initializeViews()
            
            // Mark views as initialized BEFORE calling addLog
            viewsInitialized = true
            
            // NOW we can use addLog safely
            addLog("=== TotemCostaUrbana Starting ===")
            addLog("Android: ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})")
            addLog("Device: ${Build.MANUFACTURER} ${Build.MODEL}")

            // Initialize PayGo Service (gerencia pinpad internamente)
            payGoService = PayGoService(this)
            addLog("PayGoService initialized")
            
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
                Toast.makeText(
                    this,
                    "Erro ao inicializar: ${e.message}",
                    Toast.LENGTH_LONG
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
    /**
     * Processa Intent de resposta do PayGo Integrado
     * Action: br.com.setis.interfaceautomacao.SERVICO
     * 
     * IMPORTANTE (Documentação PayGo):
     * Quando há transação pendente e a nova transação retorna erro (-2599),
     * o Intent contém um extra "TransacaoPendenteDados" com os dados da
     * transação PENDENTE ORIGINAL (não da transação em curso).
     * 
     * Esses dados devem ser usados para resolver a pendência corretamente.
     */
    private fun handlePayGoIntent(intent: Intent?) {
        if (intent == null) return
        
        val action = intent.action
        addLog("handlePayGoIntent: action=$action")
        
        // ════════════════════════════════════════════════════════════════════
        // CAPTURA DO EXTRA "TransacaoPendenteDados" (CRÍTICO para Passo 34)
        // Conforme documentação: https://github.com/adminti2/mobile-integracao-uri
        // ════════════════════════════════════════════════════════════════════
        val transacaoPendenteDados = intent.getStringExtra("TransacaoPendenteDados")
        if (!transacaoPendenteDados.isNullOrEmpty()) {
            addLog("════════════════════════════════════════")
            addLog("⚠️ TRANSAÇÃO PENDENTE DETECTADA!")
            addLog("TransacaoPendenteDados: $transacaoPendenteDados")
            addLog("════════════════════════════════════════")
            
            // Parsear os dados da transação pendente
            // Formato esperado: URI app://resolve/pendingTransaction?merchantId=xxx&providerName=xxx&...
            payGoService?.savePendingDataFromUri(transacaoPendenteDados)
            
            // ════════════════════════════════════════════════════════════════════
            // CORREÇÃO PASSO 34: Validar dados da pendência antes de confirmar
            // Se os dados forem inválidos/desconhecidos, enviar DESFEITO_MANUAL
            // ════════════════════════════════════════════════════════════════════
            val isValidPending = payGoService?.validatePendingData(transacaoPendenteDados) ?: false
            val confirmationStatus = if (isValidPending) "CONFIRMADO_AUTOMATICO" else "DESFEITO_MANUAL"
            
            addLog("📤 Enviando resolução: $confirmationStatus (dados válidos=$isValidPending)")
            payGoService?.sendPendingResolution(transacaoPendenteDados, confirmationStatus)
            
            // Notificar o WebView sobre a pendência detectada
            notifyWebViewPendingTransaction(transacaoPendenteDados)
        }
        
        // Verificar se é resposta do PayGo
        if (action == PayGoService.ACTION_RESPONSE) {
            addLog("✅ PayGo response received!")
            
            val responseUri = intent.data
            if (responseUri != null) {
                addLog("Response URI: $responseUri")
                payGoService?.handlePayGoResponse(responseUri)
                
                // Notificar WebView do resultado
                notifyWebViewPaymentResult(responseUri)
                
                // Retornar para o WebView (se estava em background)
                if (webView?.visibility != View.VISIBLE) {
                    startTotemWebView()
                }
            } else {
                addLog("⚠️ PayGo response without URI data")
                // Tentar verificar extras
                intent.extras?.let { extras ->
                    addLog("Intent extras: ${extras.keySet().joinToString()}")
                    extras.keySet().forEach { key ->
                        addLog("  Extra '$key': ${extras.get(key)}")
                    }
                }
            }
        }
        
        // Verificar também scheme "app" que pode vir como resposta
        intent.data?.let { uri ->
            if (uri.scheme == "app" && (uri.host == "payment" || uri.host == "resolve")) {
                addLog("✅ PayGo URI response via data: $uri")
                payGoService?.handlePayGoResponse(uri)
                notifyWebViewPaymentResult(uri)
            }
        }
    }
    
    /**
     * Notifica o WebView sobre uma transação pendente detectada
     * Isso permite que o frontend capture os dados corretos para resolução
     */
    private fun notifyWebViewPendingTransaction(pendingDataUri: String) {
        val currentWebView = webView ?: return
        
        try {
            // Parsear a URI de pendência para JSON
            val uri = android.net.Uri.parse(pendingDataUri)
            val jsonParams = JSONObject()
            
            uri.queryParameterNames.forEach { key ->
                uri.getQueryParameter(key)?.let { value ->
                    jsonParams.put(key, value)
                }
            }
            
            val jsonString = jsonParams.toString()
            addLog("📤 Notificando WebView sobre pendência: $jsonString")
            
            val js = """
                (function() {
                    console.log('[Android] ═══════════════════════════════════════');
                    console.log('[Android] ⚠️ TRANSAÇÃO PENDENTE DETECTADA');
                    console.log('[Android] TransacaoPendenteDados recebido do PayGo');
                    console.log('[Android] Dados:', JSON.stringify($jsonString, null, 2));
                    console.log('[Android] ═══════════════════════════════════════');
                    
                    // Salvar dados da pendência REAL (não da transação em curso)
                    var pendingData = $jsonString;
                    pendingData._source = 'TransacaoPendenteDados';
                    pendingData._capturedAt = new Date().toISOString();
                    
                    try {
                        localStorage.setItem('tef_real_pending_data', JSON.stringify(pendingData));
                        sessionStorage.setItem('tef_real_pending_data', JSON.stringify(pendingData));
                        console.log('[Android] ✅ Dados da pendência REAL salvos no storage');
                    } catch(e) {
                        console.error('[Android] Erro ao salvar pendência:', e);
                    }
                    
                    // Disparar evento customizado
                    try {
                        var event = new CustomEvent('tefPendingTransactionDetected', { 
                            detail: pendingData,
                            bubbles: true
                        });
                        window.dispatchEvent(event);
                        console.log('[Android] ✅ Evento tefPendingTransactionDetected disparado');
                    } catch(e) {
                        console.error('[Android] Erro no CustomEvent:', e);
                    }
                    
                    // Callback direto se existir
                    if (typeof window.onTefPendingDetected === 'function') {
                        try {
                            window.onTefPendingDetected(pendingData);
                            console.log('[Android] ✅ onTefPendingDetected chamado');
                        } catch(e) {
                            console.error('[Android] Erro em onTefPendingDetected:', e);
                        }
                    }
                })();
            """.trimIndent()
            
            runOnUiThread {
                if (!isFinishing && !isDestroyed) {
                    currentWebView.evaluateJavascript(js, null)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error notifying WebView pending transaction: ${e.message}", e)
            addLog("❌ Erro ao notificar pendência: ${e.message}")
        }
    }
    
    /**
     * Notifica o WebView sobre o resultado do pagamento
     * Implementa retry para garantir que o callback seja recebido
     */
    private fun notifyWebViewPaymentResult(responseUri: android.net.Uri) {
        val currentWebView = webView ?: run {
            addLog("❌ WebView não disponível para notificação")
            return
        }
        
        try {
            // Converter query params para JSON estruturado
            val jsonParams = JSONObject()
            responseUri.queryParameterNames.forEach { key ->
                responseUri.getQueryParameter(key)?.let { value ->
                    // Tentar converter valores numéricos
                    when {
                        value.matches(Regex("-?\\d+")) -> jsonParams.put(key, value.toLong())
                        value.matches(Regex("-?\\d+\\.\\d+")) -> jsonParams.put(key, value.toDouble())
                        value.equals("true", ignoreCase = true) -> jsonParams.put(key, true)
                        value.equals("false", ignoreCase = true) -> jsonParams.put(key, false)
                        else -> jsonParams.put(key, value)
                    }
                }
            }
            
            // Determinar status baseado em transactionResult
            val transactionResult = jsonParams.optInt("transactionResult", -99)
            val status = when {
                transactionResult == 0 -> "aprovado"
                transactionResult in 1..99 -> "negado"
                transactionResult == -1 -> "cancelado"
                else -> "erro"
            }
            jsonParams.put("status", status)
            
            val jsonString = jsonParams.toString()
            addLog("📤 Notificando WebView: $status")
            
            // JavaScript com retry mechanism e fallback de navegação
            val js = """
                (function() {
                    console.log('[Android] ═══════════════════════════════════════');
                    console.log('[Android] PayGo RESPONSE RECEIVED');
                    console.log('[Android] Status: $status');
                    console.log('[Android] Data:', JSON.stringify($jsonString, null, 2));
                    console.log('[Android] ═══════════════════════════════════════');
                    
                    var resultado = $jsonString;
                    var notified = false;
                    var maxRetries = 5;
                    var retryCount = 0;
                    
                    // Salvar resultado em AMBOS sessionStorage E localStorage para recuperação
                    // localStorage é mais persistente e sobrevive a recarregamentos
                    try {
                        sessionStorage.setItem('lastTefResult', JSON.stringify(resultado));
                        sessionStorage.setItem('lastTefResultTime', Date.now().toString());
                        localStorage.setItem('lastTefResult', JSON.stringify(resultado));
                        localStorage.setItem('lastTefResultTime', Date.now().toString());
                        console.log('[Android] Resultado salvo no sessionStorage E localStorage');
                    } catch(e) {
                        console.error('[Android] Erro ao salvar no storage:', e);
                    }
                    
                    // Função para tentar notificar
                    function tryNotify() {
                        if (notified) return true;
                        retryCount++;
                        console.log('[Android] Tentativa ' + retryCount + ' de notificação...');
                        
                        // Método 1: Callback direto
                        if (typeof window.onTefResultado === 'function') {
                            try {
                                console.log('[Android] Chamando window.onTefResultado()...');
                                window.onTefResultado(resultado);
                                console.log('[Android] ✅ onTefResultado chamado com sucesso!');
                                notified = true;
                                return true;
                            } catch(e) {
                                console.error('[Android] ❌ Erro em onTefResultado:', e);
                            }
                        } else {
                            console.warn('[Android] ⚠️ window.onTefResultado não definido (tentativa ' + retryCount + ')');
                        }
                        
                        // Método 2: CustomEvent (sempre disparar como backup)
                        try {
                            var event = new CustomEvent('tefPaymentResult', { 
                                detail: resultado,
                                bubbles: true,
                                cancelable: false
                            });
                            window.dispatchEvent(event);
                            document.dispatchEvent(event);
                            console.log('[Android] CustomEvent tefPaymentResult disparado');
                        } catch(e) {
                            console.error('[Android] Erro no CustomEvent:', e);
                        }
                        
                        return notified;
                    }
                    
                    // Função de fallback: forçar navegação
                    function forceNavigation() {
                        console.log('[Android] ⚠️ Executando fallback de navegação...');
                        if (resultado.status === 'aprovado') {
                            console.log('[Android] Pagamento aprovado - navegando para sucesso');
                            // Verificar se estamos em rota de produto ou serviço
                            var currentPath = window.location.pathname;
                            var targetPath = '/totem/payment-success';
                            if (currentPath.includes('product')) {
                                targetPath = '/totem/product-payment-success';
                            }
                            console.log('[Android] Redirecionando para: ' + targetPath);
                            // Usar history API se disponível
                            if (window.history && window.history.pushState) {
                                window.history.pushState({
                                    paymentResult: resultado,
                                    fromPayGo: true
                                }, '', targetPath);
                                window.dispatchEvent(new PopStateEvent('popstate', { state: { paymentResult: resultado } }));
                            }
                            // Fallback: recarregar na rota correta
                            setTimeout(function() {
                                if (window.location.pathname.includes('payment-card') || 
                                    window.location.pathname.includes('payment-pix')) {
                                    window.location.href = targetPath + '?fromPayGo=true&status=' + resultado.status;
                                }
                            }, 500);
                        } else if (resultado.status === 'cancelado' || resultado.status === 'negado') {
                            console.log('[Android] Pagamento cancelado/negado - voltando ao checkout');
                        }
                    }
                    
                    // Tentar notificar com retries agressivos
                    function attemptNotification() {
                        if (!tryNotify() && retryCount < maxRetries) {
                            setTimeout(attemptNotification, 300);
                        } else if (!notified) {
                            console.error('[Android] ❌ Todas as tentativas falharam - executando fallback');
                            forceNavigation();
                        }
                    }
                    
                    // Iniciar tentativas
                    attemptNotification();
                })();
            """.trimIndent()
            
            runOnUiThread {
                if (!isFinishing && !isDestroyed) {
                    currentWebView.evaluateJavascript(js) { result ->
                        addLog("JS executado, resultado: $result")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error notifying WebView payment result: ${e.message}", e)
            addLog("❌ Erro ao notificar: ${e.message}")
        }
    }

    /**
     * Inicializa todas as views do layout
     * IMPORTANTE: Não chamar addLog() aqui - views ainda não estão marcadas como inicializadas
     */
    private fun initializeViews() {
        Log.i(TAG, "initializeViews() starting...")
        
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
            
            Log.i(TAG, "initializeViews() completed successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing views: ${e.message}", e)
            throw e
        }
    }

    private fun setupButtonListeners() {
        btnRefresh?.setOnClickListener {
            addLog("🔄 Manual refresh triggered")
            updateDiagnosticInfo()
        }

        btnStartTotem?.setOnClickListener {
            cancelAutoStart()
            startTotemWebView()
        }
    }

    private fun updateDiagnosticInfo() {
        // App info
        try {
            val packageInfo = packageManager.getPackageInfo(packageName, 0)
            tvAppVersion?.text = packageInfo.versionName ?: "1.0.0"
            tvBuildNumber?.text = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo.longVersionCode.toString()
            } else {
                @Suppress("DEPRECATION")
                packageInfo.versionCode.toString()
            }
        } catch (e: Exception) {
            tvAppVersion?.text = "1.0.0"
            tvBuildNumber?.text = "1"
        }
        tvPackageName?.text = packageName

        // System info
        tvAndroidVersion?.text = "${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})"
        tvSdkVersion?.text = Build.VERSION.SDK_INT.toString()
        tvDeviceModel?.text = "${Build.MANUFACTURER} ${Build.MODEL}"

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
            tvNetworkStatus?.text = type
            tvNetworkStatus?.setTextColor(0xFF22C55E.toInt())
            statusNetworkIndicator?.setBackgroundResource(R.drawable.status_indicator_green)
            addLog("✅ Network: $type")
        } else {
            tvNetworkStatus?.text = "Desconectado"
            tvNetworkStatus?.setTextColor(0xFFEF4444.toInt())
            statusNetworkIndicator?.setBackgroundResource(R.drawable.status_indicator_red)
            addLog("❌ Network: Disconnected")
        }
    }

    private fun updatePayGoStatus() {
        val service = payGoService ?: return
        
        val payGoInfo = service.getPayGoInfo()
        val installed = payGoInfo.optBoolean("installed", false)
        val version = payGoInfo.optString("version", "")
        
        if (installed) {
            tvSdkStatus?.text = "PayGo Instalado (v$version)"
            tvSdkStatus?.setTextColor(0xFF22C55E.toInt())
            statusSdkIndicator?.setBackgroundResource(R.drawable.status_indicator_green)
            
            // Pinpad é gerenciado pelo PayGo
            tvPinpadStatus?.text = "Gerenciado pelo PayGo"
            tvPinpadStatus?.setTextColor(0xFF22C55E.toInt())
            statusPinpadIndicator?.setBackgroundResource(R.drawable.status_indicator_green)
            
            // USB não precisa ser verificado para pinpad (PayGo gerencia)
            tvUsbStatus?.text = "Via PayGo"
            statusUsbIndicator?.setBackgroundResource(R.drawable.status_indicator_green)
            tvUsbDevicesList?.text = "O PayGo Integrado gerencia a conexão com o pinpad internamente.\nNão é necessário conectar via USB diretamente."
            
            addLog("✅ PayGo: Instalado v$version")
            addLog("✅ Pinpad: Gerenciado pelo PayGo")
        } else {
            tvSdkStatus?.text = "PayGo NÃO instalado"
            tvSdkStatus?.setTextColor(0xFFEF4444.toInt())
            statusSdkIndicator?.setBackgroundResource(R.drawable.status_indicator_red)
            
            tvPinpadStatus?.text = "Instale o PayGo"
            tvPinpadStatus?.setTextColor(0xFFEF4444.toInt())
            statusPinpadIndicator?.setBackgroundResource(R.drawable.status_indicator_red)
            
            tvUsbStatus?.text = "N/A"
            statusUsbIndicator?.setBackgroundResource(R.drawable.status_indicator_yellow)
            tvUsbDevicesList?.text = "❌ PayGo Integrado não está instalado!\n\nInstale o aplicativo PayGo para processar pagamentos com cartão."
            
            addLog("❌ PayGo: NÃO instalado")
        }
    }

    /**
     * Adiciona mensagem ao log de eventos
     * Thread-safe: verifica se views estão inicializadas antes de atualizar UI
     */
    private fun addLog(message: String) {
        val timestamp = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        val logLine = "[$timestamp] $message\n"
        
        // Sempre logar no Logcat
        Log.i(TAG, message)
        
        // Acumular mensagens
        synchronized(logMessages) {
            logMessages.append(logLine)
            
            // Keep only last 50 lines
            val lines = logMessages.toString().lines()
            if (lines.size > 50) {
                logMessages.clear()
                logMessages.append(lines.takeLast(50).joinToString("\n"))
            }
        }
        
        // Atualizar UI apenas se views estiverem inicializadas
        if (viewsInitialized) {
            runOnUiThread {
                try {
                    tvLogOutput?.text = logMessages.toString()
                } catch (e: Exception) {
                    Log.w(TAG, "Could not update log view: ${e.message}")
                }
            }
        }
    }

    private fun startAutoStartCountdown() {
        autoStartCountdown = 10
        
        autoStartRunnable = object : Runnable {
            override fun run() {
                if (autoStartCountdown > 0) {
                    tvAutoStartInfo?.text = "Iniciando automaticamente em ${autoStartCountdown}s... (toque em Iniciar para começar agora)"
                    autoStartCountdown--
                    handler.postDelayed(this, 1000)
                } else {
                    startTotemWebView()
                }
            }
        }
        
        autoStartRunnable?.let { handler.post(it) }
    }

    private fun cancelAutoStart() {
        autoStartRunnable?.let { handler.removeCallbacks(it) }
        tvAutoStartInfo?.text = "Auto-start cancelado"
    }

    private fun startTotemWebView() {
        val currentWebView = webView ?: run {
            addLog("❌ WebView not initialized!")
            return
        }
        
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
            Toast.makeText(
                this,
                "Sem conexão de internet. Verifique a conexão e tente novamente.",
                Toast.LENGTH_LONG
            ).show()
            return
        }
        
        addLog("✅ Conexão de internet OK")
        
        // Hide diagnostic screen, show loading
        diagnosticScreen?.visibility = View.GONE
        loadingOverlay?.visibility = View.VISIBLE
        currentWebView.visibility = View.VISIBLE
        
        // Enable immersive mode
        enableImmersiveMode()
        
        // Load the PWA
        addLog("🌐 Loading URL: $PWA_URL")
        addLog("🌐 WebView settings:")
        addLog("   - JavaScript: ${currentWebView.settings.javaScriptEnabled}")
        addLog("   - DOM Storage: ${currentWebView.settings.domStorageEnabled}")
        addLog("   - Mixed Content: ${currentWebView.settings.mixedContentMode}")
        
        statusText?.text = "Carregando..."
        currentWebView.loadUrl(PWA_URL)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        val currentWebView = webView ?: return
        
        currentWebView.settings.apply {
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

        currentWebView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                addLog("📄 Page started: $url")
                loadingOverlay?.visibility = View.VISIBLE
                statusText?.text = "Carregando..."
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                addLog("✅ Page finished: $url")
                loadingOverlay?.visibility = View.GONE
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
                    statusText?.text = "Erro ao carregar. Toque para tentar novamente."
                    loadingOverlay?.setOnClickListener {
                        webView?.reload()
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

        currentWebView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                progressBar?.progress = newProgress
                progressBar?.visibility = if (newProgress == 100) View.GONE else View.VISIBLE
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
        val currentWebView = webView ?: return
        val service = payGoService ?: return
        
        tefBridge = TEFBridge(
            activity = this,
            webView = currentWebView,
            payGoService = service
        )
        
        currentWebView.addJavascriptInterface(tefBridge!!, "TEF")
        addLog("📱 JavaScript interface 'TEF' added")
    }

    private fun notifyAndroidReady() {
        val currentWebView = webView ?: return
        
        val version = try {
            packageManager.getPackageInfo(packageName, 0).versionName
        } catch (e: Exception) {
            "1.0.0"
        }
        
        val payGoInstalled = payGoService?.getPayGoInfo()?.optBoolean("installed", false) ?: false
        
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
            currentWebView.evaluateJavascript(js, null)
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
        if (hasFocus && webView?.visibility == View.VISIBLE) {
            enableImmersiveMode()
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        val currentWebView = webView
        
        // If WebView is visible and can go back
        if (currentWebView != null && currentWebView.visibility == View.VISIBLE && currentWebView.canGoBack()) {
            currentWebView.goBack()
        } else if (currentWebView != null && currentWebView.visibility == View.VISIBLE) {
            // Return to diagnostic screen
            currentWebView.visibility = View.GONE
            loadingOverlay?.visibility = View.GONE
            diagnosticScreen?.visibility = View.VISIBLE
            addLog("⬅️ Returned to diagnostic screen")
        }
        // Don't call super - this is a kiosk app
    }

    override fun onResume() {
        super.onResume()
        webView?.onResume()
        if (webView?.visibility == View.VISIBLE) {
            enableImmersiveMode()
        }
    }

    override fun onPause() {
        super.onPause()
        webView?.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        cancelAutoStart()
        webView?.destroy()
    }
}
