package com.costaurbana.totem

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

/**
 * PayGo Service - Integração via URI com PayGo Integrado
 * 
 * IMPORTANTE: O PayGo Integrado gerencia internamente o pinpad.
 * Não é necessário conectar ao pinpad via USB diretamente.
 * O app PayGo detecta e conecta ao pinpad automaticamente.
 * 
 * Baseado na documentação: https://github.com/adminti2/mobile-integracao-uri
 * 
 * Intent Actions:
 * - br.com.setis.payment.TRANSACTION (para transações)
 * - br.com.setis.confirmation.TRANSACTION (para confirmação)
 * 
 * Response Action:
 * - br.com.setis.interfaceautomacao.SERVICO
 */
class PayGoService(private val context: Context) {

    companion object {
        private const val TAG = "PayGoService"
        private const val MAX_LOGS = 200
        
        // PayGo Intent Actions
        const val ACTION_TRANSACTION = "br.com.setis.payment.TRANSACTION"
        const val ACTION_CONFIRMATION = "br.com.setis.confirmation.TRANSACTION"
        const val ACTION_RESPONSE = "br.com.setis.interfaceautomacao.SERVICO"
        
        // Package names do PayGo Integrado (várias possibilidades)
        val PAYGO_PACKAGES = listOf(
            "br.com.setis.payment.integrado",
            "br.com.setis.interfaceautomacao",
            "br.com.paygo.integrado",
            "br.com.paygo",
            "br.com.setis.payment"
        )
        
        // Currency code Brasil (ISO4217)
        const val CURRENCY_CODE_BRL = "986"
        
        // Dados da Automação Comercial
        const val POS_NAME = "TotemCostaUrbana"
        const val POS_VERSION = "1.0.0"
        const val POS_DEVELOPER = "CostaUrbana"
    }

    // Status do PayGo e pinpad
    // NOTA: O PayGo gerencia o pinpad internamente, só precisamos saber se PayGo está instalado
    private var payGoInstalled: Boolean = false
    private var payGoPackage: String? = null
    private var payGoVersion: String? = null
    
    // Transação pendente
    private var pendingTransactionId: String? = null
    private var pendingCallback: ((JSONObject) -> Unit)? = null
    
    // Debug
    private var debugMode = true
    private val logs = mutableListOf<String>()

    init {
        addLog("========================================")
        addLog("PayGoService inicializado")
        addLog("Versão: $POS_VERSION")
        addLog("Desenvolvedor: $POS_DEVELOPER")
        checkPayGoInstallation()
        addLog("========================================")
    }

    // ================== PayGo Installation Check ==================

    /**
     * Verifica se o PayGo Integrado está instalado
     * Se o PayGo estiver instalado, consideramos o pinpad como "disponível"
     * porque o PayGo gerencia o pinpad internamente
     */
    fun checkPayGoInstallation(): Boolean {
        addLog("[PAYGO] Verificando instalação do PayGo...")
        
        val pm = context.packageManager
        
        // Tentar encontrar o PayGo Integrado
        for (pkg in PAYGO_PACKAGES) {
            try {
                val info = pm.getPackageInfo(pkg, 0)
                payGoInstalled = true
                payGoPackage = pkg
                payGoVersion = info.versionName
                addLog("[PAYGO] ✅ PayGo encontrado!")
                addLog("[PAYGO]    Package: $pkg")
                addLog("[PAYGO]    Versão: ${info.versionName}")
                addLog("[PAYGO]    VersionCode: ${info.longVersionCode}")
                return true
            } catch (e: PackageManager.NameNotFoundException) {
                // Continuar verificando outros packages
            }
        }
        
        // Verificar se há algum app que responde ao Intent de transação
        val testIntent = Intent(ACTION_TRANSACTION)
        val resolveInfos = pm.queryIntentActivities(testIntent, 0)
        
        if (resolveInfos.isNotEmpty()) {
            addLog("[PAYGO] ✅ App encontrado via Intent resolution:")
            for (info in resolveInfos) {
                val appName = info.activityInfo.applicationInfo.loadLabel(pm).toString()
                val pkgName = info.activityInfo.packageName
                addLog("[PAYGO]    - $appName ($pkgName)")
                payGoInstalled = true
                payGoPackage = pkgName
            }
            return true
        }
        
        payGoInstalled = false
        payGoPackage = null
        addLog("[PAYGO] ❌ PayGo NÃO está instalado!")
        addLog("[PAYGO] Por favor, instale o PayGo Integrado")
        return false
    }

    /**
     * Retorna informações detalhadas sobre o PayGo
     */
    fun getPayGoInfo(): JSONObject {
        return JSONObject().apply {
            put("installed", payGoInstalled)
            put("version", payGoVersion ?: "desconhecido")
            put("packageName", payGoPackage ?: "não encontrado")
            put("packages_checked", JSONArray(PAYGO_PACKAGES))
        }
    }

    // ================== Status ==================

    data class PinpadStatus(
        val conectado: Boolean,
        val modelo: String?
    )

    /**
     * Retorna status do pinpad
     * NOTA: Se PayGo está instalado, consideramos pinpad como disponível
     * porque o PayGo gerencia a conexão internamente
     */
    fun getPinpadStatus(): PinpadStatus {
        // Revalidar instalação do PayGo
        if (!payGoInstalled) {
            checkPayGoInstallation()
        }
        
        return PinpadStatus(
            conectado = payGoInstalled,  // Se PayGo está instalado, pinpad está "disponível"
            modelo = if (payGoInstalled) "PayGo Integrado" else null
        )
    }
    
    /**
     * Retorna status completo do serviço TEF
     */
    fun getFullStatus(): JSONObject {
        // Revalidar instalação
        if (!payGoInstalled) {
            checkPayGoInstallation()
        }
        
        return JSONObject().apply {
            put("pinpad", JSONObject().apply {
                put("conectado", payGoInstalled)  // PayGo gerencia o pinpad
                put("modelo", if (payGoInstalled) "PayGo Integrado" else "")
                put("info", "Pinpad gerenciado pelo PayGo")
            })
            put("paygo", getPayGoInfo())
            put("ready", payGoInstalled)  // Pronto para transações se PayGo instalado
            put("pendingTransaction", pendingTransactionId)
            put("debugMode", debugMode)
            put("logsCount", logs.size)
        }
    }

    // ================== PayGo URI Integration ==================

    /**
     * Inicia uma transação de pagamento via Intent URI
     * 
     * @param ordemId Identificador único da ordem
     * @param valorCentavos Valor em centavos (ex: 1000 = R$10,00)
     * @param metodo Tipo de pagamento: "debito", "credito", "credito_parcelado", "pix"
     * @param parcelas Número de parcelas (para crédito parcelado)
     * @param callback Função chamada com o resultado da transação
     */
    fun startTransaction(
        ordemId: String,
        valorCentavos: Long,
        metodo: String,
        parcelas: Int,
        callback: (JSONObject) -> Unit
    ) {
        addLog("========================================")
        addLog("[TXN] INICIANDO NOVA TRANSAÇÃO")
        addLog("[TXN] OrdemId: $ordemId")
        addLog("[TXN] Valor: R$ ${valorCentavos / 100.0}")
        addLog("[TXN] Método: $metodo")
        addLog("[TXN] Parcelas: $parcelas")
        addLog("========================================")

        // Verificar se PayGo está instalado
        if (!payGoInstalled) {
            // Tentar verificar novamente
            checkPayGoInstallation()
        }
        
        if (!payGoInstalled) {
            addLog("[TXN] ❌ ERRO: PayGo não está instalado!")
            callback(createError("PAYGO_NOT_INSTALLED", "PayGo Integrado não está instalado. Por favor, instale o aplicativo PayGo."))
            return
        }

        // Gerar transactionId único
        val transactionId = "${ordemId}_${System.currentTimeMillis()}"
        pendingTransactionId = transactionId
        pendingCallback = callback

        try {
            // Construir URI de transação
            val transactionUri = buildTransactionUri(
                transactionId = transactionId,
                valorCentavos = valorCentavos,
                metodo = metodo,
                parcelas = parcelas
            )
            
            addLog("[TXN] URI de transação construída:")
            addLog("[TXN] $transactionUri")
            
            // Construir URI de dados da automação
            val posDataUri = buildPosDataUri()
            addLog("[TXN] PosData URI: $posDataUri")
            
            // Construir URI de personalização
            val customizationUri = buildCustomizationUri()
            addLog("[TXN] Customization URI: $customizationUri")
            
            // Criar Intent conforme documentação PayGo
            val intent = Intent(ACTION_TRANSACTION, transactionUri).apply {
                putExtra("posData", posDataUri.toString())
                putExtra("posCustomization", customizationUri.toString())
                putExtra("package", context.packageName)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            addLog("[TXN] Intent criado com action: $ACTION_TRANSACTION")
            addLog("[TXN] Package de retorno: ${context.packageName}")
            
            // Verificar se há app para resolver o Intent
            val resolveInfo = context.packageManager.resolveActivity(intent, 0)
            if (resolveInfo != null) {
                addLog("[TXN] ✅ Intent será resolvido por: ${resolveInfo.activityInfo.packageName}")
            } else {
                addLog("[TXN] ⚠️ Nenhum app encontrado para resolver o Intent")
                addLog("[TXN] Tentando abrir mesmo assim...")
            }
            
            addLog("[TXN] >>> Chamando startActivity() <<<")
            
            // Iniciar Activity do PayGo
            context.startActivity(intent)
            
            addLog("[TXN] ✅ Intent enviado com sucesso!")
            addLog("[TXN] Aguardando resposta do PayGo...")
            addLog("[TXN] O PayGo vai abrir e gerenciar o pagamento no pinpad")
            
        } catch (e: android.content.ActivityNotFoundException) {
            Log.e(TAG, "PayGo não encontrado: ${e.message}", e)
            addLog("[TXN] ❌ ERRO: Activity não encontrada!")
            addLog("[TXN] ${e.message}")
            
            pendingTransactionId = null
            pendingCallback = null
            
            callback(createError("ACTIVITY_NOT_FOUND", "PayGo não encontrado. Verifique se está instalado corretamente."))
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao iniciar transação: ${e.message}", e)
            addLog("[TXN] ❌ ERRO INESPERADO!")
            addLog("[TXN] Tipo: ${e.javaClass.simpleName}")
            addLog("[TXN] Mensagem: ${e.message}")
            e.stackTrace.take(5).forEach { 
                addLog("[TXN]    at ${it.className}.${it.methodName}:${it.lineNumber}")
            }
            
            pendingTransactionId = null
            pendingCallback = null
            
            callback(createError("INTENT_ERROR", "Erro ao chamar PayGo: ${e.message}"))
        }
    }

    /**
     * Constrói a URI de transação conforme especificação PayGo
     * Formato: app://payment/input?operation=VENDA&amount=1000&currencyCode=986&transactionId=xxx
     */
    private fun buildTransactionUri(
        transactionId: String,
        valorCentavos: Long,
        metodo: String,
        parcelas: Int
    ): Uri {
        val builder = Uri.Builder()
            .scheme("app")
            .authority("payment")
            .appendPath("input")
            .appendQueryParameter("operation", "VENDA")
            .appendQueryParameter("transactionId", transactionId)
            .appendQueryParameter("amount", valorCentavos.toString())
            .appendQueryParameter("currencyCode", CURRENCY_CODE_BRL)
        
        // Tipo de cartão e financiamento baseado no método
        when (metodo) {
            "debito" -> {
                builder.appendQueryParameter("cardType", "CARTAO_DEBITO")
                builder.appendQueryParameter("finType", "A_VISTA")
                addLog("[URI] Tipo: DÉBITO à vista")
            }
            "credito" -> {
                builder.appendQueryParameter("cardType", "CARTAO_CREDITO")
                builder.appendQueryParameter("finType", "A_VISTA")
                addLog("[URI] Tipo: CRÉDITO à vista")
            }
            "credito_parcelado" -> {
                builder.appendQueryParameter("cardType", "CARTAO_CREDITO")
                builder.appendQueryParameter("finType", "PARCELADO_ESTABELECIMENTO")
                builder.appendQueryParameter("installments", parcelas.toString())
                addLog("[URI] Tipo: CRÉDITO parcelado ($parcelas x)")
            }
            "pix" -> {
                builder.appendQueryParameter("paymentMode", "PAGAMENTO_CARTEIRA_VIRTUAL")
                addLog("[URI] Tipo: PIX")
            }
            else -> {
                // Padrão para crédito à vista
                builder.appendQueryParameter("cardType", "CARTAO_CREDITO")
                builder.appendQueryParameter("finType", "A_VISTA")
                addLog("[URI] ⚠️ Método desconhecido '$metodo', usando CRÉDITO à vista")
            }
        }
        
        return builder.build()
    }

    /**
     * Constrói a URI de dados da automação comercial
     */
    private fun buildPosDataUri(): Uri {
        return Uri.Builder()
            .scheme("app")
            .authority("payment")
            .appendPath("posData")
            .appendQueryParameter("posName", POS_NAME)
            .appendQueryParameter("posVersion", POS_VERSION)
            .appendQueryParameter("posDeveloper", POS_DEVELOPER)
            .appendQueryParameter("allowCashback", "false")
            .appendQueryParameter("allowDiscount", "false")
            .appendQueryParameter("allowDifferentReceipts", "true")
            .appendQueryParameter("allowShortReceipt", "true")
            .appendQueryParameter("allowDueAmount", "false")
            .build()
    }

    /**
     * Constrói a URI de personalização visual (cores da Costa Urbana)
     */
    private fun buildCustomizationUri(): Uri {
        return Uri.Builder()
            .scheme("app")
            .authority("payment")
            .appendPath("posCustomization")
            // Cores baseadas no tema Costa Urbana (tons escuros com dourado)
            .appendQueryParameter("screenBackgroundColor", "#1a1a2e")  // Fundo escuro
            .appendQueryParameter("toolbarBackgroundColor", "#c9a961") // Dourado
            .appendQueryParameter("fontColor", "#ffffff")              // Texto branco
            .appendQueryParameter("keyboardBackgroundColor", "#2d2d44")
            .appendQueryParameter("keyboardFontColor", "#ffffff")
            .appendQueryParameter("editboxBackgroundColor", "#ffffff")
            .appendQueryParameter("releasedKeyColor", "#3d3d5c")
            .appendQueryParameter("pressedKeyColor", "#c9a961")
            .appendQueryParameter("menuSeparatorColor", "#c9a961")
            .build()
    }

    /**
     * Processa a resposta do PayGo Integrado
     * Chamado pela MainActivity quando recebe o Intent de resposta
     */
    fun handlePayGoResponse(responseUri: Uri) {
        addLog("========================================")
        addLog("[RESP] RESPOSTA DO PAYGO RECEBIDA")
        addLog("[RESP] URI: $responseUri")
        addLog("========================================")
        
        // Log de todos os parâmetros recebidos
        addLog("[RESP] Parâmetros recebidos:")
        responseUri.queryParameterNames.forEach { key ->
            val value = responseUri.getQueryParameter(key)
            addLog("[RESP]    $key = $value")
        }
        
        val callback = pendingCallback
        if (callback == null) {
            addLog("[RESP] ⚠️ Nenhum callback pendente!")
            return
        }
        
        try {
            val result = parseResponseUri(responseUri)
            addLog("[RESP] Resultado parseado:")
            addLog("[RESP]    Status: ${result.optString("status")}")
            addLog("[RESP]    NSU: ${result.optString("nsu")}")
            addLog("[RESP]    Autorização: ${result.optString("autorizacao")}")
            addLog("[RESP]    Mensagem: ${result.optString("mensagem")}")
            
            callback(result)
            addLog("[RESP] ✅ Callback executado com sucesso")
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao processar resposta: ${e.message}", e)
            addLog("[RESP] ❌ ERRO ao processar resposta!")
            addLog("[RESP] ${e.message}")
            callback(createError("PARSE_ERROR", "Erro ao processar resposta: ${e.message}"))
        } finally {
            pendingTransactionId = null
            pendingCallback = null
        }
    }

    /**
     * Parseia a URI de resposta do PayGo para JSONObject
     */
    private fun parseResponseUri(uri: Uri): JSONObject {
        val result = JSONObject()
        
        // Pegar todos os query parameters
        val transactionResult = uri.getQueryParameter("transactionResult")?.toIntOrNull() ?: -1
        val requiresConfirmation = uri.getQueryParameter("requiresConfirmation")?.toBoolean() ?: false
        val confirmationId = uri.getQueryParameter("confirmationTransactionId")
        
        addLog("[PARSE] transactionResult: $transactionResult")
        addLog("[PARSE] requiresConfirmation: $requiresConfirmation")
        
        // Determinar status baseado no transactionResult
        val status = when {
            transactionResult == 0 -> "aprovado"
            transactionResult in 1..99 -> "negado"
            transactionResult == -1 -> "cancelado"
            else -> "erro"
        }
        
        addLog("[PARSE] Status interpretado: $status")
        
        result.put("status", status)
        result.put("transactionResult", transactionResult)
        result.put("requiresConfirmation", requiresConfirmation)
        
        // Dados da transação aprovada
        if (status == "aprovado") {
            result.put("nsu", uri.getQueryParameter("transactionNsu") ?: "")
            result.put("autorizacao", uri.getQueryParameter("authorizationCode") ?: "")
            result.put("bandeira", uri.getQueryParameter("cardName") ?: "")
            result.put("cartaoMascarado", uri.getQueryParameter("maskedPan") ?: "")
            result.put("tipoCartao", uri.getQueryParameter("cardType") ?: "")
            result.put("valor", uri.getQueryParameter("amount")?.toLongOrNull() ?: 0)
            result.put("parcelas", uri.getQueryParameter("installments")?.toIntOrNull() ?: 1)
            result.put("comprovanteCliente", uri.getQueryParameter("cardholderReceipt") ?: "")
            result.put("comprovanteLojista", uri.getQueryParameter("merchantReceipt") ?: "")
            result.put("comprovanteCompleto", uri.getQueryParameter("fullReceipt") ?: "")
            
            if (confirmationId != null) {
                result.put("confirmationTransactionId", confirmationId)
            }
            
            addLog("[PARSE] ✅ Transação APROVADA!")
        } else if (status == "negado") {
            addLog("[PARSE] ❌ Transação NEGADA")
        } else if (status == "cancelado") {
            addLog("[PARSE] ⚠️ Transação CANCELADA pelo usuário")
        }
        
        // Mensagem de resultado
        result.put("mensagem", uri.getQueryParameter("resultMessage") ?: "")
        result.put("timestamp", System.currentTimeMillis())
        result.put("ordemId", pendingTransactionId?.substringBefore("_") ?: "")
        
        // Se requer confirmação, enviar automaticamente
        if (requiresConfirmation && confirmationId != null) {
            addLog("[PARSE] Transação requer confirmação, enviando...")
            sendConfirmation(confirmationId)
        }
        
        return result
    }

    /**
     * Envia confirmação automática da transação
     */
    fun sendConfirmation(confirmationTransactionId: String) {
        addLog("[CONFIRM] Enviando confirmação: $confirmationTransactionId")
        
        val confirmationUri = Uri.Builder()
            .scheme("app")
            .authority("confirmation")
            .appendPath("confirmation")
            .appendQueryParameter("confirmationTransactionId", confirmationTransactionId)
            .appendQueryParameter("transactionStatus", "CONFIRMADO_AUTOMATICO")
            .build()
        
        addLog("[CONFIRM] URI: $confirmationUri")
        
        try {
            val intent = Intent().apply {
                action = ACTION_CONFIRMATION
                putExtra("uri", confirmationUri.toString())
                addFlags(Intent.FLAG_INCLUDE_STOPPED_PACKAGES)
            }
            
            context.sendBroadcast(intent)
            addLog("[CONFIRM] ✅ Confirmação enviada com sucesso")
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao enviar confirmação: ${e.message}", e)
            addLog("[CONFIRM] ❌ ERRO: ${e.message}")
        }
    }

    /**
     * Cancela a transação atual (desfaz)
     */
    fun cancelTransaction(callback: (JSONObject) -> Unit) {
        addLog("[CANCEL] Solicitação de cancelamento recebida")

        val confirmationId = pendingTransactionId
        if (confirmationId == null) {
            addLog("[CANCEL] ⚠️ Nenhuma transação pendente para cancelar")
            callback(createError("NO_TRANSACTION", "Nenhuma transação pendente"))
            return
        }

        addLog("[CANCEL] Cancelando transação: $confirmationId")

        try {
            val cancelUri = Uri.Builder()
                .scheme("app")
                .authority("confirmation")
                .appendPath("confirmation")
                .appendQueryParameter("confirmationTransactionId", confirmationId)
                .appendQueryParameter("transactionStatus", "DESFEITO_MANUAL")
                .build()
            
            addLog("[CANCEL] URI: $cancelUri")
            
            val intent = Intent().apply {
                action = ACTION_CONFIRMATION
                putExtra("uri", cancelUri.toString())
                addFlags(Intent.FLAG_INCLUDE_STOPPED_PACKAGES)
            }
            
            context.sendBroadcast(intent)
            addLog("[CANCEL] ✅ Cancelamento enviado")
            
            pendingTransactionId = null
            pendingCallback = null
            
            callback(JSONObject().apply {
                put("status", "cancelado")
                put("mensagem", "Transação cancelada")
            })
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao cancelar: ${e.message}", e)
            addLog("[CANCEL] ❌ ERRO: ${e.message}")
            callback(createError("CANCEL_ERROR", "Erro ao cancelar: ${e.message}"))
        }
    }

    // ================== Debug & Logs ==================

    fun setDebugMode(enabled: Boolean) {
        debugMode = enabled
        addLog("[DEBUG] Modo debug: ${if (enabled) "ATIVADO" else "DESATIVADO"}")
    }

    fun getLogs(): JSONArray {
        return JSONArray(logs)
    }

    fun clearLogs() {
        logs.clear()
        addLog("[LOGS] Histórico de logs limpo")
    }

    private fun addLog(message: String) {
        val timestamp = java.text.SimpleDateFormat("HH:mm:ss.SSS", java.util.Locale.getDefault())
            .format(java.util.Date())
        val logEntry = "[$timestamp] $message"
        
        synchronized(logs) {
            logs.add(logEntry)
            
            // Manter apenas os últimos MAX_LOGS
            while (logs.size > MAX_LOGS) {
                logs.removeAt(0)
            }
        }
        
        if (debugMode) {
            Log.d(TAG, message)
        }
    }

    // ================== Helpers ==================

    private fun createError(code: String, message: String): JSONObject {
        addLog("[ERROR] Código: $code")
        addLog("[ERROR] Mensagem: $message")
        
        return JSONObject().apply {
            put("status", "erro")
            put("codigoErro", code)
            put("mensagem", message)
            put("timestamp", System.currentTimeMillis())
        }
    }
}
