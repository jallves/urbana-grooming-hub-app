package com.costaurbana.totem

import android.content.Context
import android.hardware.usb.UsbDevice
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

/**
 * PayGo Service - Gerencia comunicação com o SDK PayGo TEF Local
 * 
 * NOTA: Este serviço está preparado para receber o SDK real da PayGo.
 * Atualmente retorna erros indicando que o SDK não está integrado.
 * 
 * Quando receber o SDK:
 * 1. Adicionar o .aar na pasta libs/
 * 2. Descomentar a dependência no build.gradle
 * 3. Implementar os métodos reais de transação
 */
class PayGoService(private val context: Context) {

    companion object {
        private const val TAG = "PayGoService"
        private const val MAX_LOGS = 100
    }

    // Status do pinpad
    private var pinpadConnected = false
    private var pinpadModel: String? = null
    private var currentDevice: UsbDevice? = null
    
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

        // TODO: Inicializar SDK PayGo com o dispositivo USB
        // payGoSDK.initialize(device)
        
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

        // TODO: Cleanup SDK PayGo
        // payGoSDK.disconnect()
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

    // ================== Transactions ==================

    fun startTransaction(
        ordemId: String,
        valorCentavos: Long,
        metodo: String,
        parcelas: Int,
        callback: (JSONObject) -> Unit
    ) {
        Log.i(TAG, "startTransaction: ordem=$ordemId, valor=$valorCentavos, metodo=$metodo, parcelas=$parcelas")
        addLog("Iniciando transação: $ordemId - R$ ${valorCentavos / 100.0}")

        if (!pinpadConnected) {
            Log.w(TAG, "Pinpad not connected")
            callback(createError("PINPAD_DESCONECTADO", "Pinpad não conectado. Verifique a conexão USB."))
            return
        }

        // TODO: Implementar chamada real do SDK PayGo
        // Exemplo de como seria:
        /*
        val transactionType = when (metodo) {
            "debito" -> PayGoTransactionType.DEBIT
            "credito" -> PayGoTransactionType.CREDIT
            "credito_parcelado" -> PayGoTransactionType.CREDIT_INSTALLMENT
            "pix" -> PayGoTransactionType.PIX
            else -> PayGoTransactionType.CREDIT
        }
        
        payGoSDK.startPayment(
            amount = valorCentavos,
            type = transactionType,
            installments = parcelas,
            onSuccess = { response ->
                callback(JSONObject().apply {
                    put("status", "aprovado")
                    put("ordemId", ordemId)
                    put("valor", valorCentavos)
                    put("nsu", response.nsu)
                    put("autorizacao", response.authorizationCode)
                    put("bandeira", response.cardBrand)
                    put("comprovanteCliente", response.customerReceipt)
                    put("comprovanteLojista", response.merchantReceipt)
                    put("timestamp", System.currentTimeMillis())
                })
            },
            onError = { error ->
                callback(JSONObject().apply {
                    put("status", "erro")
                    put("codigoErro", error.code)
                    put("mensagem", error.message)
                })
            },
            onCancelled = {
                callback(JSONObject().apply {
                    put("status", "cancelado")
                    put("ordemId", ordemId)
                })
            }
        )
        */

        // Por enquanto, retornar erro indicando que SDK não está integrado
        addLog("ERRO: SDK PayGo ainda não integrado")
        callback(createError(
            "SDK_NAO_INTEGRADO", 
            "SDK PayGo ainda não foi integrado. Aguardando recebimento do SDK."
        ))
    }

    fun cancelTransaction(callback: (JSONObject) -> Unit) {
        Log.i(TAG, "cancelTransaction")
        addLog("Cancelando transação...")

        if (!pinpadConnected) {
            callback(createError("PINPAD_DESCONECTADO", "Pinpad não conectado"))
            return
        }

        // TODO: Implementar cancelamento real
        // payGoSDK.cancelCurrentTransaction()

        addLog("ERRO: SDK PayGo ainda não integrado")
        callback(createError(
            "SDK_NAO_INTEGRADO",
            "Cancelamento não disponível - SDK PayGo não integrado"
        ))
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
