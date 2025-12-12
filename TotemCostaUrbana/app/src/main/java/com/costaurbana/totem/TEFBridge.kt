package com.costaurbana.totem

import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject

/**
 * TEF Bridge - Interface JavaScript para comunicação Web <-> Android
 * 
 * Esta classe expõe métodos que podem ser chamados do JavaScript web
 * através do objeto global `window.TEF`
 */
class TEFBridge(
    private val activity: MainActivity,
    private val webView: WebView,
    private val payGoService: PayGoService
) {
    companion object {
        private const val TAG = "TEFBridge"
    }

    /**
     * Inicia um pagamento TEF
     * Chamado do JS: TEF.iniciarPagamento(jsonParams)
     */
    @JavascriptInterface
    fun iniciarPagamento(params: String) {
        Log.i(TAG, "iniciarPagamento chamado: $params")
        
        try {
            val obj = JSONObject(params)
            val ordemId = obj.optString("ordemId", "")
            val valorCentavos = obj.optLong("valorCentavos", 0)
            val metodo = obj.optString("metodo", "credito")
            val parcelas = obj.optInt("parcelas", 1)

            if (ordemId.isEmpty() || valorCentavos <= 0) {
                returnError("PARAMS_INVALIDOS", "ordemId e valorCentavos são obrigatórios")
                return
            }

            Log.d(TAG, "Processando pagamento: ordem=$ordemId, valor=$valorCentavos, metodo=$metodo, parcelas=$parcelas")

            payGoService.startTransaction(ordemId, valorCentavos, metodo, parcelas) { result ->
                returnResult(result)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao processar iniciarPagamento", e)
            returnError("PARSE_ERROR", "Erro ao processar parâmetros: ${e.message}")
        }
    }

    /**
     * Cancela o pagamento atual
     * Chamado do JS: TEF.cancelarPagamento()
     */
    @JavascriptInterface
    fun cancelarPagamento() {
        Log.i(TAG, "cancelarPagamento chamado")
        
        payGoService.cancelTransaction { result ->
            returnResult(result)
        }
    }

    /**
     * Verifica o status do pinpad
     * Chamado do JS: TEF.verificarPinpad()
     * @return JSON string com status do pinpad
     */
    @JavascriptInterface
    fun verificarPinpad(): String {
        Log.d(TAG, "verificarPinpad chamado")
        
        val status = payGoService.getPinpadStatus()
        val result = JSONObject().apply {
            put("conectado", status.conectado)
            put("modelo", status.modelo ?: JSONObject.NULL)
            put("timestamp", System.currentTimeMillis())
        }
        
        Log.i(TAG, "verificarPinpad resultado: conectado=${status.conectado}, modelo=${status.modelo}")
        Log.d(TAG, "verificarPinpad JSON: $result")
        return result.toString()
    }

    /**
     * Ativa/desativa modo debug
     * Chamado do JS: TEF.setModoDebug(enabled)
     */
    @JavascriptInterface
    fun setModoDebug(enabled: Boolean) {
        Log.i(TAG, "setModoDebug: $enabled")
        payGoService.setDebugMode(enabled)
    }

    /**
     * Obtém logs de debug
     * Chamado do JS: TEF.getLogs()
     * @return JSON string com array de logs
     */
    @JavascriptInterface
    fun getLogs(): String {
        val logs = payGoService.getLogs()
        return JSONObject().apply {
            put("logs", logs)
        }.toString()
    }

    /**
     * Limpa logs de debug
     * Chamado do JS: TEF.limparLogs()
     */
    @JavascriptInterface
    fun limparLogs() {
        Log.d(TAG, "limparLogs chamado")
        payGoService.clearLogs()
    }

    /**
     * Retorna resultado para o JavaScript
     */
    private fun returnResult(result: JSONObject) {
        val js = "window.onTefResultado && window.onTefResultado($result);"
        Log.d(TAG, "Enviando resultado para JS: $result")
        
        activity.runOnUiThread {
            webView.evaluateJavascript(js) { response ->
                Log.d(TAG, "JS callback response: $response")
            }
        }
    }

    /**
     * Retorna erro para o JavaScript
     */
    private fun returnError(code: String, message: String) {
        val result = JSONObject().apply {
            put("status", "erro")
            put("codigoErro", code)
            put("mensagem", message)
            put("timestamp", System.currentTimeMillis())
        }
        returnResult(result)
    }
}
