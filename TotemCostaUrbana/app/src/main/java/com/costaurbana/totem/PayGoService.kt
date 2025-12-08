package com.costaurbana.totem

import android.content.Context
import android.hardware.usb.UsbDevice
import android.util.Log
import org.json.JSONObject

class PayGoService(private val context: Context) {

    companion object { private const val TAG = "PayGoService" }

    private var pinpadConnected = false

    fun onUsbPermissionGranted(device: UsbDevice) {
        Log.i(TAG, "Pinpad USB autorizado: ${device.deviceName}")
        pinpadConnected = true

        // TODO: inicializar SDK PayGo usando esse dispositivo
    }

    fun onUsbPermissionDenied() {
        Log.e(TAG, "Permissão USB negada")
        pinpadConnected = false
    }

    fun onPinpadDisconnected() {
        Log.e(TAG, "Pinpad desconectado")
        pinpadConnected = false
    }

    fun getPinpadStatus() = JSONObject().apply {
        put("conectado", pinpadConnected)
        put("modelo", if (pinpadConnected) "PPC930" else JSONObject.NULL)
    }

    fun startTransaction(
        ordemId: String,
        valor: Long,
        metodo: String,
        parcelas: Int,
        callback: (JSONObject) -> Unit
    ) {
        Log.d(TAG, "Iniciando transação: $ordemId")

        if (!pinpadConnected) {
            callback(error("PINPAD_DESCONECTADO", "Pinpad não conectado"))
            return
        }

        // TODO: chamada real do SDK PayGo

        callback(error("SDK_NAO_INTEGRADO", "SDK PayGo ainda não conectado"))
    }

    fun cancelTransaction(callback: (JSONObject) -> Unit) {
        if (!pinpadConnected) {
            callback(error("PINPAD_DESCONECTADO", "Pinpad não conectado"))
            return
        }

        // TODO: cancelamento real PayGo

        callback(error("SDK_NAO_INTEGRADO", "Cancelamento não disponível"))
    }

    private fun error(code: String, msg: String) = JSONObject().apply {
        put("status", "erro")
        put("codigoErro", code)
        put("mensagem", msg)
    }
}
