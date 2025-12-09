package com.costaurbana.totem

import android.content.Context
import android.content.Intent
import android.hardware.usb.UsbDevice
import android.net.Uri
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

/**
 * PayGo Service - Integração via URI com PayGo Integrado
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
        private const val MAX_LOGS = 100
        
        // PayGo Intent Actions
        const val ACTION_TRANSACTION = "br.com.setis.payment.TRANSACTION"
        const val ACTION_CONFIRMATION = "br.com.setis.confirmation.TRANSACTION"
        const val ACTION_RESPONSE = "br.com.setis.interfaceautomacao.SERVICO"
        
        // Currency code Brasil (ISO4217)
        const val CURRENCY_CODE_BRL = "986"
        
        // Dados da Automação Comercial
        const val POS_NAME = "TotemCostaUrbana"
        const val POS_VERSION = "1.0.0"
        const val POS_DEVELOPER = "CostaUrbana"
    }

    // Status do pinpad
    private var pinpadConnected = false
    private var pinpadModel: String? = null
    private var currentDevice: UsbDevice? = null
    
    // Transação pendente
    private var pendingTransactionId: String? = null
    private var pendingCallback: ((JSONObject) -> Unit)? = null
    
    // Debug
    private var debugMode = true
    private val logs = mutableListOf<String>()

    // ================== USB Device Management ==================

    fun onUsbPermissionGranted(device: UsbDevice) {
        Log.i(TAG, "USB Permission granted: ${device.deviceName}")
        addLog("USB Permission granted: ${device.deviceName}")
        
        currentDevice = device
        pinpadConnected = true
        pinpadModel = "PPC930" // Gertec pinpad
        
        addLog("Pinpad conectado: $pinpadModel")
    }

    fun onUsbPermissionDenied() {
        Log.w(TAG, "USB Permission denied")
        addLog("USB Permission denied")
        
        pinpadConnected = false
        pinpadModel = null
        currentDevice = null
    }

    fun onPinpadDisconnected() {
        Log.i(TAG, "Pinpad disconnected")
        addLog("Pinpad desconectado")
        
        pinpadConnected = false
        pinpadModel = null
        currentDevice = null
    }

    // ================== Status ==================

    data class PinpadStatus(
        val conectado: Boolean,
        val modelo: String?
    )

    fun getPinpadStatus(): PinpadStatus {
        return PinpadStatus(
            conectado = pinpadConnected,
            modelo = if (pinpadConnected) pinpadModel else null
        )
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
        Log.i(TAG, "startTransaction: ordem=$ordemId, valor=$valorCentavos, metodo=$metodo, parcelas=$parcelas")
        addLog("Iniciando transação: $ordemId - R$ ${valorCentavos / 100.0}")

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
            
            // Construir URI de dados da automação
            val posDataUri = buildPosDataUri()
            
            // Construir URI de personalização (opcional)
            val customizationUri = buildCustomizationUri()
            
            // Criar Intent
            val intent = Intent(ACTION_TRANSACTION, transactionUri).apply {
                putExtra("DadosAutomacao", posDataUri.toString())
                putExtra("Personalizacao", customizationUri.toString())
                putExtra("package", context.packageName)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            
            addLog("URI Transação: $transactionUri")
            addLog("Chamando PayGo Integrado...")
            
            // Iniciar Activity do PayGo
            context.startActivity(intent)
            
            addLog("Intent enviado para PayGo")
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao iniciar transação: ${e.message}", e)
            addLog("ERRO: ${e.message}")
            
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
            }
            "credito" -> {
                builder.appendQueryParameter("cardType", "CARTAO_CREDITO")
                builder.appendQueryParameter("finType", "A_VISTA")
            }
            "credito_parcelado" -> {
                builder.appendQueryParameter("cardType", "CARTAO_CREDITO")
                builder.appendQueryParameter("finType", "PARCELADO_ESTABELECIMENTO")
                builder.appendQueryParameter("installments", parcelas.toString())
            }
            "pix" -> {
                builder.appendQueryParameter("paymentMode", "PAGAMENTO_CARTEIRA_VIRTUAL")
            }
        }
        
        return builder.build()
    }

    /**
     * Constrói a URI de dados da automação comercial
     * Formato: app://payment/posData?posName=xxx&posVersion=xxx&...
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
     * Formato: app://payment/posCustomization?screenBackgroundColor=%23xxx&...
     */
    private fun buildCustomizationUri(): Uri {
        return Uri.Builder()
            .scheme("app")
            .authority("payment")
            .appendPath("posCustomization")
            // Cores baseadas no tema Costa Urbana (tons escuros com dourado)
            .appendQueryParameter("screenBackgroundColor", "%231a1a2e")  // Fundo escuro
            .appendQueryParameter("toolbarBackgroundColor", "%23c9a961") // Dourado
            .appendQueryParameter("fontColor", "%23ffffff")              // Texto branco
            .appendQueryParameter("keyboardBackgroundColor", "%232d2d44")
            .appendQueryParameter("keyboardFontColor", "%23ffffff")
            .appendQueryParameter("editboxBackgroundColor", "%23ffffff")
            .appendQueryParameter("releasedKeyColor", "%233d3d5c")
            .appendQueryParameter("pressedKeyColor", "%23c9a961")
            .appendQueryParameter("menuSeparatorColor", "%23c9a961")
            .build()
    }

    /**
     * Processa a resposta do PayGo Integrado
     * Chamado pela MainActivity quando recebe o Intent de resposta
     */
    fun handlePayGoResponse(responseUri: Uri) {
        Log.i(TAG, "handlePayGoResponse: $responseUri")
        addLog("Resposta recebida: $responseUri")
        
        val callback = pendingCallback
        if (callback == null) {
            addLog("ERRO: Nenhum callback pendente para resposta")
            return
        }
        
        try {
            val result = parseResponseUri(responseUri)
            addLog("Resultado: ${result.optString("status")}")
            callback(result)
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao processar resposta: ${e.message}", e)
            addLog("ERRO ao processar: ${e.message}")
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
        
        // Determinar status baseado no transactionResult
        val status = when {
            transactionResult == 0 -> "aprovado"
            transactionResult in 1..99 -> "negado"
            transactionResult == -1 -> "cancelado"
            else -> "erro"
        }
        
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
        }
        
        // Mensagem de resultado
        result.put("mensagem", uri.getQueryParameter("resultMessage") ?: "")
        result.put("timestamp", System.currentTimeMillis())
        result.put("ordemId", pendingTransactionId?.substringBefore("_") ?: "")
        
        // Se requer confirmação, enviar automaticamente
        if (requiresConfirmation && confirmationId != null) {
            sendConfirmation(confirmationId)
        }
        
        return result
    }

    /**
     * Envia confirmação automática da transação
     */
    fun sendConfirmation(confirmationTransactionId: String) {
        addLog("Enviando confirmação: $confirmationTransactionId")
        
        val confirmationUri = Uri.Builder()
            .scheme("app")
            .authority("confirmation")
            .appendPath("confirmation")
            .appendQueryParameter("confirmationTransactionId", confirmationTransactionId)
            .appendQueryParameter("transactionStatus", "CONFIRMADO_AUTOMATICO")
            .build()
        
        try {
            val intent = Intent().apply {
                action = ACTION_CONFIRMATION
                putExtra("uri", confirmationUri.toString())
                addFlags(Intent.FLAG_INCLUDE_STOPPED_PACKAGES)
            }
            
            context.sendBroadcast(intent)
            addLog("Confirmação enviada com sucesso")
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao enviar confirmação: ${e.message}", e)
            addLog("ERRO confirmação: ${e.message}")
        }
    }

    /**
     * Cancela a transação atual (desfaz)
     */
    fun cancelTransaction(callback: (JSONObject) -> Unit) {
        Log.i(TAG, "cancelTransaction")
        addLog("Cancelando transação...")

        val confirmationId = pendingTransactionId
        if (confirmationId == null) {
            callback(createError("NO_TRANSACTION", "Nenhuma transação pendente"))
            return
        }

        try {
            val cancelUri = Uri.Builder()
                .scheme("app")
                .authority("confirmation")
                .appendPath("confirmation")
                .appendQueryParameter("confirmationTransactionId", confirmationId)
                .appendQueryParameter("transactionStatus", "DESFEITO_MANUAL")
                .build()
            
            val intent = Intent().apply {
                action = ACTION_CONFIRMATION
                putExtra("uri", cancelUri.toString())
                addFlags(Intent.FLAG_INCLUDE_STOPPED_PACKAGES)
            }
            
            context.sendBroadcast(intent)
            addLog("Cancelamento enviado")
            
            pendingTransactionId = null
            pendingCallback = null
            
            callback(JSONObject().apply {
                put("status", "cancelado")
                put("mensagem", "Transação cancelada")
            })
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao cancelar: ${e.message}", e)
            addLog("ERRO cancelamento: ${e.message}")
            callback(createError("CANCEL_ERROR", "Erro ao cancelar: ${e.message}"))
        }
    }

    // ================== Debug & Logs ==================

    fun setDebugMode(enabled: Boolean) {
        debugMode = enabled
        addLog("Debug mode: $enabled")
    }

    fun getLogs(): JSONArray {
        return JSONArray(logs)
    }

    fun clearLogs() {
        logs.clear()
        addLog("Logs limpos")
    }

    private fun addLog(message: String) {
        val timestamp = java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault())
            .format(java.util.Date())
        val logEntry = "[$timestamp] $message"
        
        logs.add(logEntry)
        
        // Manter apenas os últimos MAX_LOGS
        while (logs.size > MAX_LOGS) {
            logs.removeAt(0)
        }
        
        if (debugMode) {
            Log.d(TAG, message)
        }
    }

    // ================== Helpers ==================

    private fun createError(code: String, message: String): JSONObject {
        return JSONObject().apply {
            put("status", "erro")
            put("codigoErro", code)
            put("mensagem", message)
            put("timestamp", System.currentTimeMillis())
        }
    }
}
