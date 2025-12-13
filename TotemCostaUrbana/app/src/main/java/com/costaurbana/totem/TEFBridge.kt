package com.costaurbana.totem

import android.content.Intent
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONArray
import org.json.JSONObject

/**
 * TEF Bridge - Interface JavaScript para comunicação Web <-> Android
 * 
 * Esta classe expõe métodos que podem ser chamados do JavaScript web
 * através do objeto global `window.TEF`
 * 
 * IMPORTANTE: O PayGo Integrado gerencia o pinpad internamente.
 * Quando window.TEF existe e PayGo está instalado, está pronto para uso.
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
     * NOTA: Retorna status do PayGo, que gerencia o pinpad internamente
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
            put("info", "Pinpad gerenciado pelo PayGo Integrado")
        }
        
        Log.i(TAG, "verificarPinpad resultado: conectado=${status.conectado}, modelo=${status.modelo}")
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

    /**
     * Retorna o status completo do serviço TEF
     * Chamado do JS: TEF.getStatus()
     * @return JSON string com status completo
     */
    @JavascriptInterface
    fun getStatus(): String {
        Log.d(TAG, "getStatus chamado")
        
        val status = payGoService.getFullStatus()
        Log.d(TAG, "getStatus resultado: $status")
        return status.toString()
    }

    /**
     * Verifica informações do PayGo instalado
     * Chamado do JS: TEF.verificarPayGo()
     * @return JSON string com informações do PayGo
     */
    @JavascriptInterface
    fun verificarPayGo(): String {
        Log.d(TAG, "verificarPayGo chamado")
        
        val info = payGoService.getPayGoInfo()
        Log.d(TAG, "verificarPayGo resultado: $info")
        return info.toString()
    }
    
    /**
     * Verifica se o sistema está pronto para pagamentos
     * Chamado do JS: TEF.isReady()
     * @return boolean indicando se está pronto
     */
    @JavascriptInterface
    fun isReady(): Boolean {
        val status = payGoService.getPinpadStatus()
        Log.d(TAG, "isReady chamado - resultado: ${status.conectado}")
        return status.conectado
    }
    
    /**
     * Lista todos os apps instalados que podem ser relacionados a TEF/pagamentos
     * APENAS PARA DEBUG - Ajuda a identificar o package name correto do PayGo
     * Chamado do JS: TEF.listarAppsInstalados()
     * @return JSON string com lista de apps
     */
    @JavascriptInterface
    fun listarAppsInstalados(): String {
        Log.d(TAG, "listarAppsInstalados chamado")
        
        val pm = activity.packageManager
        val result = JSONObject()
        
        try {
            // Listar apps que respondem ao Intent de transação PayGo
            val transactionIntent = Intent("br.com.setis.payment.TRANSACTION")
            val transactionApps = pm.queryIntentActivities(transactionIntent, 0)
            
            val paymentAppsArray = JSONArray()
            for (info in transactionApps) {
                paymentAppsArray.put(JSONObject().apply {
                    put("packageName", info.activityInfo.packageName)
                    put("appName", info.activityInfo.applicationInfo.loadLabel(pm).toString())
                    put("activityName", info.activityInfo.name)
                })
            }
            result.put("paymentApps", paymentAppsArray)
            
            // Buscar apps com palavras-chave relacionadas
            val keywords = listOf("paygo", "setis", "pgintegrado", "tef", "payment", "pag")
            val installedApps = pm.getInstalledApplications(0)
            
            val relatedAppsArray = JSONArray()
            for (appInfo in installedApps) {
                val pkgName = appInfo.packageName.lowercase()
                val appName = appInfo.loadLabel(pm).toString().lowercase()
                
                if (keywords.any { pkgName.contains(it) || appName.contains(it) }) {
                    val version = try {
                        pm.getPackageInfo(appInfo.packageName, 0).versionName
                    } catch (e: Exception) { "desconhecida" }
                    
                    relatedAppsArray.put(JSONObject().apply {
                        put("packageName", appInfo.packageName)
                        put("appName", appInfo.loadLabel(pm).toString())
                        put("version", version)
                    })
                }
            }
            result.put("relatedApps", relatedAppsArray)
            
            // Contar total de apps
            result.put("totalInstalledApps", installedApps.size)
            result.put("timestamp", System.currentTimeMillis())
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao listar apps", e)
            result.put("error", e.message)
        }
        
        Log.d(TAG, "listarAppsInstalados resultado: $result")
        return result.toString()
    }
    
    /**
     * Força uma nova verificação do PayGo
     * Chamado do JS: TEF.revalidarPayGo()
     * @return JSON string com resultado da validação
     */
    @JavascriptInterface
    fun revalidarPayGo(): String {
        Log.d(TAG, "revalidarPayGo chamado")
        
        val found = payGoService.checkPayGoInstallation()
        val info = payGoService.getPayGoInfo()
        
        Log.d(TAG, "revalidarPayGo resultado: encontrado=$found, info=$info")
        return info.toString()
    }
}
