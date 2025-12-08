package com.costaurbana.totem

import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject

class TEFBridge(
    private val activity: MainActivity,
    private val webView: WebView,
    private val payGoService: PayGoService,
    private var isDebugMode: Boolean = false
) {

    companion object { private const val TAG = "TEFBridge" }

    @JavascriptInterface
    fun iniciarPagamento(params: String) {
        Log.d(TAG, "Pagamento solicitado: $params")

        val obj = JSONObject(params)
        val ordemId = obj.optString("ordemId")
        val valor = obj.optLong("valorCentavos")
        val metodo = obj.optString("metodo")
        val parcelas = obj.optInt("parcelas", 1)

        payGoService.startTransaction(ordemId, valor, metodo, parcelas) {
            returnResult(it)
        }
    }

    @JavascriptInterface
    fun cancelarPagamento() {
        payGoService.cancelTransaction { returnResult(it) }
    }

    @JavascriptInterface
    fun verificarPinpad(): String = payGoService.getPinpadStatus().toString()

    @JavascriptInterface
    fun setModoDebug(enabled: Boolean) {
        isDebugMode = enabled
        Log.d(TAG, "Modo debug: $enabled")
    }

    @JavascriptInterface
    fun getLogs(): String {
        // TODO: implementar coleta de logs reais
        return "[]"
    }

    @JavascriptInterface
    fun limparLogs() {
        Log.d(TAG, "Logs limpos")
    }

    private fun returnResult(result: JSONObject) {
        val js = "window.onTefResultado && window.onTefResultado($result);"
        webView.post { webView.evaluateJavascript(js, null) }
    }
}
