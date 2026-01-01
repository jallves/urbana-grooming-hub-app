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
 * Implementado conforme documentação PayGo Integrado:
 * https://github.com/adminti2/mobile-integracao-uri
 * 
 * Operações suportadas:
 * - Venda (débito, crédito, parcelado, PIX)
 * - Cancelamento de venda
 * - Confirmação automática/manual
 * - Resolução de pendências
 */
class TEFBridge(
    private val activity: MainActivity,
    private val webView: WebView,
    private val payGoService: PayGoService
) {
    companion object {
        private const val TAG = "TEFBridge"
    }

    // ========================================================================
    // PAGAMENTO (VENDA)
    // ========================================================================

    /**
     * Inicia um pagamento TEF
     * Chamado do JS: TEF.iniciarPagamento(jsonParams)
     * 
     * @param params JSON string com:
     *   - ordemId: ID único da ordem
     *   - valorCentavos: valor em centavos (100 = R$1,00)
     *   - metodo: "debito", "credito", "credito_parcelado", "pix"
     *   - parcelas: número de parcelas (para crédito parcelado)
     */
    @JavascriptInterface
    fun iniciarPagamento(params: String) {
        Log.i(TAG, "iniciarPagamento: $params")
        
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

            Log.d(TAG, "Pagamento: ordem=$ordemId, valor=$valorCentavos, metodo=$metodo, parcelas=$parcelas")

            payGoService.startTransaction(ordemId, valorCentavos, metodo, parcelas) { result ->
                returnResult(result)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro em iniciarPagamento", e)
            returnError("PARSE_ERROR", "Erro ao processar parâmetros: ${e.message}")
        }
    }

    // ========================================================================
    // CANCELAMENTO DE VENDA
    // ========================================================================

    /**
     * Inicia cancelamento de uma venda anterior
     * Chamado do JS: TEF.cancelarVenda(jsonParams)
     * 
     * @param params JSON string com:
     *   - ordemId: ID da ordem
     *   - valorCentavos: valor original
     *   - nsuOriginal: NSU da transação original
     *   - autorizacaoOriginal: código de autorização original
     */
    @JavascriptInterface
    fun cancelarVenda(params: String) {
        Log.i(TAG, "cancelarVenda: $params")
        
        try {
            val obj = JSONObject(params)
            val ordemId = obj.optString("ordemId", "")
            val valorCentavos = obj.optLong("valorCentavos", 0)
            val nsuOriginal = obj.optString("nsuOriginal", "")
            val autorizacaoOriginal = obj.optString("autorizacaoOriginal", "")

            if (ordemId.isEmpty() || valorCentavos <= 0 || nsuOriginal.isEmpty()) {
                returnError("PARAMS_INVALIDOS", "ordemId, valorCentavos e nsuOriginal são obrigatórios")
                return
            }

            payGoService.startCancelamento(ordemId, valorCentavos, nsuOriginal, autorizacaoOriginal) { result ->
                returnResult(result)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro em cancelarVenda", e)
            returnError("PARSE_ERROR", "Erro ao processar parâmetros: ${e.message}")
        }
    }

    // ========================================================================
    // CANCELAMENTO DE TRANSAÇÃO ATUAL
    // ========================================================================

    /**
     * Cancela/desfaz o pagamento atual em andamento
     * Chamado do JS: TEF.cancelarPagamento()
     */
    @JavascriptInterface
    fun cancelarPagamento() {
        Log.i(TAG, "cancelarPagamento")
        
        payGoService.cancelTransaction { result ->
            returnResult(result)
        }
    }

    // ========================================================================
    // CONFIRMAÇÃO MANUAL
    // ========================================================================

    /**
     * Envia confirmação manual de uma transação
     * Chamado do JS: TEF.confirmarTransacao(confirmationId, status)
     * 
     * @param confirmationId ID de confirmação recebido na resposta
     * @param status "CONFIRMADO_MANUAL" ou "DESFEITO_MANUAL"
     */
    @JavascriptInterface
    fun confirmarTransacao(confirmationId: String, status: String) {
        Log.i(TAG, "confirmarTransacao: id=$confirmationId, status=$status")
        
        if (confirmationId.isEmpty()) {
            returnError("PARAMS_INVALIDOS", "confirmationId é obrigatório")
            return
        }
        
        val validStatus = when (status) {
            "CONFIRMADO_MANUAL", "DESFEITO_MANUAL", "CONFIRMADO_AUTOMATICO" -> status
            else -> "CONFIRMADO_MANUAL"
        }
        
        payGoService.sendConfirmation(confirmationId, validStatus)
        
        returnResult(JSONObject().apply {
            put("status", "enviado")
            put("mensagem", "Confirmação enviada")
            put("confirmationId", confirmationId)
            put("transactionStatus", validStatus)
        })
    }

    // ========================================================================
    // RESOLUÇÃO DE PENDÊNCIA
    // ========================================================================

    /**
     * Resolve transação pendente
     * Chamado do JS: TEF.resolverPendencia(status)
     * 
     * @param status "CONFIRMADO_MANUAL" ou "DESFEITO_MANUAL" (default)
     */
    @JavascriptInterface
    fun resolverPendencia(status: String = "DESFEITO_MANUAL") {
        val validStatus = when (status) {
            "CONFIRMADO_MANUAL", "DESFEITO_MANUAL", "CONFIRMADO_AUTOMATICO" -> status
            else -> "DESFEITO_MANUAL"
        }
        
        Log.i(TAG, "resolverPendencia: status=$validStatus")
        
        payGoService.resolvePendingTransaction({ result ->
            returnResult(result)
        }, validStatus)
    }
    
    /**
     * NOVO: Resolve transação pendente COM dados passados do JavaScript
     * Isso resolve o problema de perda de dados quando o APK reinicia
     * 
     * Chamado do JS: TEF.resolverPendenciaComDados(pendingDataJson, status)
     * 
     * @param pendingDataJson JSON string com dados da pendência (providerName, merchantId, localNsu, etc.)
     * @param status "CONFIRMADO_MANUAL" ou "DESFEITO_MANUAL"
     */
    @JavascriptInterface
    fun resolverPendenciaComDados(pendingDataJson: String, status: String) {
        Log.i(TAG, "resolverPendenciaComDados: dados=$pendingDataJson, status=$status")
        
        val validStatus = when (status) {
            "CONFIRMADO_MANUAL", "DESFEITO_MANUAL", "CONFIRMADO_AUTOMATICO" -> status
            else -> "DESFEITO_MANUAL"
        }
        
        try {
            val pendingData = JSONObject(pendingDataJson)
            Log.i(TAG, "resolverPendenciaComDados: pendingData parseado com sucesso")
            
            // Usar os dados passados diretamente
            payGoService.resolvePendingWithExternalData(pendingData, validStatus) { result ->
                returnResult(result)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao parsear pendingDataJson", e)
            // Fallback: tentar sem dados
            payGoService.resolvePendingTransaction({ result ->
                returnResult(result)
            }, validStatus)
        }
    }
    
    /**
     * NOVO: Salva dados de pendência recebidos do JavaScript
     * Chamado do JS: TEF.salvarPendingData(pendingDataJson)
     * 
     * @param pendingDataJson JSON string com dados da pendência
     */
    @JavascriptInterface
    fun salvarPendingData(pendingDataJson: String) {
        Log.i(TAG, "salvarPendingData: $pendingDataJson")
        
        try {
            val pendingData = JSONObject(pendingDataJson)
            payGoService.savePendingDataFromJS(pendingData)
            
            returnResult(JSONObject().apply {
                put("status", "salvo")
                put("mensagem", "Dados de pendência salvos com sucesso")
            })
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao salvar pendingData", e)
            returnResult(JSONObject().apply {
                put("status", "erro")
                put("mensagem", "Erro ao salvar dados: ${e.message}")
            })
        }
    }
    
    /**
     * Obtém informações sobre pendências
     * Chamado do JS: TEF.getPendingInfo()
     * @return JSON string com informações de pendência
     */
    @JavascriptInterface
    fun getPendingInfo(): String {
        Log.d(TAG, "getPendingInfo")
        return payGoService.getPendingInfo().toString()
    }
    
    /**
     * Salva confirmationId da última transação aprovada
     * Chamado do JS: TEF.salvarConfirmationId(id, nsu, autorizacao)
     */
    @JavascriptInterface
    fun salvarConfirmationId(confirmationId: String, nsu: String, autorizacao: String) {
        Log.i(TAG, "salvarConfirmationId: id=$confirmationId, nsu=$nsu")
        payGoService.saveLastConfirmationId(confirmationId, nsu, autorizacao)
        
        returnResult(JSONObject().apply {
            put("status", "salvo")
            put("confirmationId", confirmationId)
            put("mensagem", "ConfirmationId salvo para uso posterior")
        })
    }
    
    /**
     * Limpa confirmationId após confirmação bem-sucedida
     * Chamado do JS: TEF.limparConfirmationId()
     */
    @JavascriptInterface
    fun limparConfirmationId() {
        Log.i(TAG, "limparConfirmationId")
        payGoService.clearLastConfirmationId()
    }

    // ========================================================================
    // STATUS E VERIFICAÇÃO
    // ========================================================================

    /**
     * Verifica o status do pinpad
     * Chamado do JS: TEF.verificarPinpad()
     * @return JSON string com status
     */
    @JavascriptInterface
    fun verificarPinpad(): String {
        Log.d(TAG, "verificarPinpad")
        
        val status = payGoService.getPinpadStatus()
        val result = JSONObject().apply {
            put("conectado", status.conectado)
            put("modelo", status.modelo ?: JSONObject.NULL)
            put("timestamp", System.currentTimeMillis())
            put("info", "Pinpad gerenciado pelo PayGo Integrado")
        }
        
        Log.i(TAG, "verificarPinpad: conectado=${status.conectado}")
        return result.toString()
    }

    /**
     * Retorna o status completo do serviço TEF
     * Chamado do JS: TEF.getStatus()
     * @return JSON string com status completo
     */
    @JavascriptInterface
    fun getStatus(): String {
        Log.d(TAG, "getStatus")
        return payGoService.getFullStatus().toString()
    }

    /**
     * Verifica informações do PayGo instalado
     * Chamado do JS: TEF.verificarPayGo()
     * @return JSON string com informações do PayGo
     */
    @JavascriptInterface
    fun verificarPayGo(): String {
        Log.d(TAG, "verificarPayGo")
        return payGoService.getPayGoInfo().toString()
    }
    
    /**
     * Verifica se o sistema está pronto para pagamentos
     * Chamado do JS: TEF.isReady()
     * @return boolean
     */
    @JavascriptInterface
    fun isReady(): Boolean {
        val status = payGoService.getPinpadStatus()
        Log.d(TAG, "isReady: ${status.conectado}")
        return status.conectado
    }

    /**
     * Força uma nova verificação do PayGo
     * Chamado do JS: TEF.revalidarPayGo()
     * @return JSON string com resultado
     */
    @JavascriptInterface
    fun revalidarPayGo(): String {
        Log.d(TAG, "revalidarPayGo")
        payGoService.checkPayGoInstallation()
        return payGoService.getPayGoInfo().toString()
    }

    // ========================================================================
    // DEBUG E LOGS
    // ========================================================================

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
        return JSONObject().apply {
            put("logs", payGoService.getLogs())
        }.toString()
    }

    /**
     * Limpa logs de debug
     * Chamado do JS: TEF.limparLogs()
     */
    @JavascriptInterface
    fun limparLogs() {
        Log.d(TAG, "limparLogs")
        payGoService.clearLogs()
    }

    // ========================================================================
    // REIMPRESSÃO ÚLTIMA TRANSAÇÃO
    // ========================================================================

    /**
     * Solicita reimpressão do último comprovante
     * Chamado do JS: TEF.reimprimirUltimaTransacao()
     */
    @JavascriptInterface
    fun reimprimirUltimaTransacao() {
        Log.i(TAG, "reimprimirUltimaTransacao")
        
        payGoService.startReimpressao { result ->
            returnResult(result)
        }
    }

    // ========================================================================
    // DEBUG - LISTAR APPS
    // ========================================================================

    /**
     * Lista apps instalados relacionados a TEF/pagamentos
     * APENAS PARA DEBUG
     * Chamado do JS: TEF.listarAppsInstalados()
     * @return JSON string com lista de apps
     */
    @JavascriptInterface
    fun listarAppsInstalados(): String {
        Log.d(TAG, "listarAppsInstalados")
        
        val pm = activity.packageManager
        val result = JSONObject()
        
        try {
            // Apps que respondem ao Intent de transação
            val transactionIntent = Intent(PayGoService.ACTION_TRANSACTION)
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
            
            // Apps com palavras-chave
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
            result.put("totalInstalledApps", installedApps.size)
            result.put("timestamp", System.currentTimeMillis())
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao listar apps", e)
            result.put("error", e.message)
        }
        
        return result.toString()
    }

    // ========================================================================
    // COMUNICAÇÃO COM JAVASCRIPT
    // ========================================================================

    /**
     * Retorna resultado para o JavaScript
     */
    private fun returnResult(result: JSONObject) {
        val js = "window.onTefResultado && window.onTefResultado($result);"
        Log.d(TAG, "Enviando para JS: $result")
        
        activity.runOnUiThread {
            webView.evaluateJavascript(js) { response ->
                Log.d(TAG, "JS response: $response")
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
