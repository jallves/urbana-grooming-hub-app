package com.costaurbana.totem

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

/**
 * PayGo Service - Integração via URI com PayGo Integrado
 * 
 * Implementação 100% conforme documentação oficial:
 * https://github.com/adminti2/mobile-integracao-uri
 * 
 * Package da Automação: com.costaurbana.totem
 * 
 * Intent Actions:
 * - br.com.setis.payment.TRANSACTION (transações com UI)
 * - br.com.setis.confirmation.TRANSACTION (confirmação/resolução - broadcast)
 * 
 * Response Action:
 * - br.com.setis.interfaceautomacao.SERVICO
 * 
 * URI Scheme: app://
 * Authorities: payment, confirmation, resolve
 */
class PayGoService(private val context: Context) {

    companion object {
        private const val TAG = "PayGoService"
        private const val MAX_LOGS = 200
        
        // ========== PayGo Intent Actions (Documentação Oficial) ==========
        // Transação (venda, cancelamento, etc) - via startActivity
        const val ACTION_TRANSACTION = "br.com.setis.payment.TRANSACTION"
        // Confirmação e Resolução de pendência - via sendBroadcast
        const val ACTION_CONFIRMATION = "br.com.setis.confirmation.TRANSACTION"
        // Resposta do PayGo (tratada no Manifest)
        const val ACTION_RESPONSE = "br.com.setis.interfaceautomacao.SERVICO"
        
        // ========== Bundle Extras Keys (Documentação Oficial) ==========
        const val EXTRA_DADOS_AUTOMACAO = "DadosAutomacao"
        const val EXTRA_PERSONALIZACAO = "Personalizacao"
        const val EXTRA_PACKAGE = "package"
        const val EXTRA_URI = "uri"
        const val EXTRA_CONFIRMACAO = "Confirmacao"
        
        // ========== Package Names do PayGo Integrado ==========
        val PAYGO_PACKAGES = listOf(
            "br.com.setis.clientepaygoweb.cert",      // CERT/Homologação
            "br.com.setis.clientepaygoweb",           // Produção
            "br.com.setis.clientepaygoweb.hml",
            "br.com.setis.interfaceautomacao",
            "br.com.setis.interfaceautomacao.cert",
            "br.com.setis.pgintegrado",
            "br.com.setis.pgintegrado.cert",
            "br.com.paygo.integrado",
            "br.com.paygo.integrado.cert",
            "br.com.paygo",
            "br.com.paygo.cert"
        )
        
        // Currency code Brasil (ISO4217)
        const val CURRENCY_CODE_BRL = "986"
        
        // Dados da Automação Comercial
        const val POS_NAME = "TotemCostaUrbana"
        const val POS_VERSION = "1.0.0-CERT"
        const val POS_DEVELOPER = "CostaUrbana"
        
        // Flag de ambiente
        const val IS_HOMOLOGATION = true
    }

    // Estado
    private var payGoInstalled: Boolean = false
    private var payGoPackage: String? = null
    private var payGoVersion: String? = null
    
    // Transação pendente
    private var pendingTransactionId: String? = null
    private var pendingCallback: ((JSONObject) -> Unit)? = null
    
    // Dados de transação pendente (para resolução)
    private var lastPendingData: JSONObject? = null
    
    // SharedPreferences para persistir dados de pendência
    private val prefs: SharedPreferences = context.getSharedPreferences("paygo_pending", Context.MODE_PRIVATE)
    
    // Debug
    private var debugMode = true
    private val logs = mutableListOf<String>()

    init {
        addLog("════════════════════════════════════════")
        addLog("PayGoService v$POS_VERSION inicializado")
        addLog("Package: ${context.packageName}")
        addLog("Desenvolvedor: $POS_DEVELOPER")
        addLog("Modo: ${if (IS_HOMOLOGATION) "HOMOLOGAÇÃO" else "PRODUÇÃO"}")
        loadPersistedPendingData() // Carregar pendências salvas
        checkPayGoInstallation()
        addLog("════════════════════════════════════════")
    }

    // ========================================================================
    // VERIFICAÇÃO DE INSTALAÇÃO DO PAYGO
    // ========================================================================

    fun checkPayGoInstallation(): Boolean {
        addLog("[PAYGO] Verificando instalação...")
        
        val pm = context.packageManager
        
        // 1. Verificar pelos packages conhecidos
        for (pkg in PAYGO_PACKAGES) {
            try {
                val info = pm.getPackageInfo(pkg, 0)
                payGoInstalled = true
                payGoPackage = pkg
                payGoVersion = info.versionName
                
                val isCert = pkg.contains("cert", ignoreCase = true) || pkg.contains("hml", ignoreCase = true)
                addLog("[PAYGO] ✅ Encontrado: $pkg")
                addLog("[PAYGO]    Versão: ${info.versionName}")
                addLog("[PAYGO]    Ambiente: ${if (isCert) "CERTIFICAÇÃO" else "PRODUÇÃO"}")
                return true
            } catch (e: PackageManager.NameNotFoundException) {
                // Continuar verificando
            }
        }
        
        // 2. Verificar por Intent resolution
        val testIntent = Intent(ACTION_TRANSACTION)
        val resolveInfos = pm.queryIntentActivities(testIntent, 0)
        
        if (resolveInfos.isNotEmpty()) {
            val info = resolveInfos.first()
            payGoInstalled = true
            payGoPackage = info.activityInfo.packageName
            payGoVersion = try {
                pm.getPackageInfo(payGoPackage!!, 0).versionName
            } catch (e: Exception) { "desconhecida" }
            
            addLog("[PAYGO] ✅ Encontrado via Intent: ${info.activityInfo.applicationInfo.loadLabel(pm)}")
            addLog("[PAYGO]    Package: $payGoPackage")
            return true
        }
        
        // 3. Buscar por apps com palavras-chave
        val keywords = listOf("paygo", "setis", "pgintegrado", "tef")
        val installedApps = pm.getInstalledApplications(0)
        
        for (appInfo in installedApps) {
            val pkgName = appInfo.packageName.lowercase()
            val appName = appInfo.loadLabel(pm).toString().lowercase()
            
            if (keywords.any { pkgName.contains(it) || appName.contains(it) }) {
                addLog("[PAYGO] 📦 App relacionado: ${appInfo.loadLabel(pm)} ($pkgName)")
                
                // Verificar se responde ao Intent
                val checkIntent = Intent(ACTION_TRANSACTION)
                checkIntent.setPackage(appInfo.packageName)
                if (pm.queryIntentActivities(checkIntent, 0).isNotEmpty()) {
                    payGoInstalled = true
                    payGoPackage = appInfo.packageName
                    payGoVersion = try {
                        pm.getPackageInfo(appInfo.packageName, 0).versionName
                    } catch (e: Exception) { "desconhecida" }
                    
                    addLog("[PAYGO] ✅ Este app aceita transações!")
                    return true
                }
            }
        }
        
        payGoInstalled = false
        payGoPackage = null
        addLog("[PAYGO] ❌ PayGo NÃO encontrado!")
        return false
    }

    fun getPayGoInfo(): JSONObject {
        val isCert = payGoPackage?.let { 
            it.contains("cert", ignoreCase = true) || it.contains("hml", ignoreCase = true)
        } ?: false
        
        return JSONObject().apply {
            put("installed", payGoInstalled)
            put("version", payGoVersion ?: "desconhecido")
            put("packageName", payGoPackage ?: "não encontrado")
            put("ambiente", if (isCert) "CERTIFICAÇÃO" else if (payGoInstalled) "PRODUÇÃO" else "N/A")
            put("appModoHomologacao", IS_HOMOLOGATION)
        }
    }

    // ========================================================================
    // STATUS DO SISTEMA
    // ========================================================================

    data class PinpadStatus(
        val conectado: Boolean,
        val modelo: String?
    )

    fun getPinpadStatus(): PinpadStatus {
        if (!payGoInstalled) checkPayGoInstallation()
        
        return PinpadStatus(
            conectado = payGoInstalled,
            modelo = if (payGoInstalled) "PayGo Integrado" else null
        )
    }
    
    fun getFullStatus(): JSONObject {
        if (!payGoInstalled) checkPayGoInstallation()
        
        return JSONObject().apply {
            put("pinpad", JSONObject().apply {
                put("conectado", payGoInstalled)
                put("modelo", if (payGoInstalled) "PayGo Integrado" else "")
                put("info", "Pinpad gerenciado pelo PayGo")
            })
            put("paygo", getPayGoInfo())
            put("ready", payGoInstalled)
            put("pendingTransaction", pendingTransactionId)
            put("hasPendingData", lastPendingData != null)
            put("debugMode", debugMode)
            put("logsCount", logs.size)
        }
    }

    // ========================================================================
    // 3.4.1 TRANSAÇÃO (via startActivity)
    // ========================================================================

    /**
     * Inicia uma transação de pagamento via Intent URI
     * Conforme documentação: https://github.com/adminti2/mobile-integracao-uri#341-transação
     * 
     * @param ordemId Identificador único da ordem
     * @param valorCentavos Valor em centavos (ex: 100 = R$1,00)
     * @param metodo Tipo: "debito", "credito", "credito_parcelado", "pix"
     * @param parcelas Número de parcelas
     * @param callback Função chamada com o resultado
     */
    fun startTransaction(
        ordemId: String,
        valorCentavos: Long,
        metodo: String,
        parcelas: Int,
        callback: (JSONObject) -> Unit
    ) {
        addLog("════════════════════════════════════════")
        addLog("[TXN] INICIANDO TRANSAÇÃO")
        addLog("[TXN] OrdemId: $ordemId")
        addLog("[TXN] Valor: R$ ${String.format("%.2f", valorCentavos / 100.0)}")
        addLog("[TXN] Método: $metodo")
        addLog("[TXN] Parcelas: $parcelas")
        addLog("════════════════════════════════════════")

        // Verificar PayGo
        if (!payGoInstalled) checkPayGoInstallation()
        
        if (!payGoInstalled) {
            addLog("[TXN] ❌ PayGo não instalado!")
            callback(createError("PAYGO_NOT_INSTALLED", "PayGo Integrado não está instalado."))
            return
        }

        // Gerar transactionId único
        val transactionId = "${ordemId}_${System.currentTimeMillis()}"
        pendingTransactionId = transactionId
        pendingCallback = callback

        try {
            // ========== Construir URIs conforme documentação ==========
            
            // 1. URI de Transação (dados obrigatórios)
            val transactionUri = buildTransactionUri(transactionId, valorCentavos, metodo, parcelas)
            addLog("[TXN] Transaction URI: $transactionUri")
            
            // 2. URI de Dados Automação (obrigatório)
            val dadosAutomacaoUri = buildDadosAutomacaoUri()
            addLog("[TXN] DadosAutomacao URI: $dadosAutomacaoUri")
            
            // 3. URI de Personalização (opcional)
            val personalizacaoUri = buildPersonalizacaoUri()
            addLog("[TXN] Personalizacao URI: $personalizacaoUri")
            
            // ========== Criar Intent conforme documentação ==========
            // Ref: "A requisição deve ser feita através do método startActivity"
            val intent = Intent(ACTION_TRANSACTION, transactionUri).apply {
                // Bundle Extra dos Dados Automação (chave: "DadosAutomacao")
                putExtra(EXTRA_DADOS_AUTOMACAO, dadosAutomacaoUri.toString())

                // Bundle Extra da Personalização (chave: "Personalizacao")
                putExtra(EXTRA_PERSONALIZACAO, personalizacaoUri.toString())

                // Bundle Extra do nome do pacote (chave: "package")
                // "necessário para que o aplicativo PayGo Integrado consiga efetuar a devolutiva"
                putExtra(EXTRA_PACKAGE, context.packageName)

                // IMPORTANTE:
                // Evitar FLAG_ACTIVITY_CLEAR_TASK pois isso pode reiniciar a task da automação
                // ao retornar do PayGo (efeito observado: volta para a tela inicial do PDV).
                // Mantemos NEW_TASK para abrir o PayGo corretamente.
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            addLog("[TXN] Intent Action: $ACTION_TRANSACTION")
            addLog("[TXN] Package de retorno: ${context.packageName}")
            
            // Verificar se há app para resolver
            val resolveInfo = context.packageManager.resolveActivity(intent, 0)
            if (resolveInfo != null) {
                addLog("[TXN] ✅ Resolvido por: ${resolveInfo.activityInfo.packageName}")
            } else {
                addLog("[TXN] ⚠️ Nenhum app encontrado para resolver Intent")
            }
            
            // ========== Iniciar Activity ==========
            addLog("[TXN] >>> Chamando startActivity() <<<")
            context.startActivity(intent)
            
            addLog("[TXN] ✅ Intent enviado!")
            addLog("[TXN] Aguardando resposta do PayGo...")
            
        } catch (e: android.content.ActivityNotFoundException) {
            Log.e(TAG, "ActivityNotFoundException: ${e.message}", e)
            addLog("[TXN] ❌ Activity não encontrada!")
            addLog("[TXN] ${e.message}")
            
            pendingTransactionId = null
            pendingCallback = null
            
            callback(createError("ACTIVITY_NOT_FOUND", "PayGo não encontrado. Verifique a instalação."))
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao iniciar transação: ${e.message}", e)
            addLog("[TXN] ❌ ERRO: ${e.javaClass.simpleName}")
            addLog("[TXN] ${e.message}")
            
            pendingTransactionId = null
            pendingCallback = null
            
            callback(createError("INTENT_ERROR", "Erro ao chamar PayGo: ${e.message}"))
        }
    }

    /**
     * Constrói URI de transação conforme RFC2396
     * Formato: app://payment/input?operation=VENDA&transactionId=xxx&amount=xxx&currencyCode=986
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
        
        // Tipo de cartão e financiamento
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
                addLog("[URI] Tipo: CRÉDITO parcelado ${parcelas}x")
            }
            "pix" -> {
                builder.appendQueryParameter("paymentMode", "PAGAMENTO_CARTEIRA_VIRTUAL")
                addLog("[URI] Tipo: PIX/Carteira Virtual")
            }
            else -> {
                builder.appendQueryParameter("cardType", "CARTAO_CREDITO")
                builder.appendQueryParameter("finType", "A_VISTA")
                addLog("[URI] Tipo padrão: CRÉDITO à vista")
            }
        }
        
        return builder.build()
    }

    /**
     * Constrói URI de Dados Automação (obrigatório em toda transação)
     * Formato: app://payment/posData?posName=xxx&posVersion=xxx&...
     */
    private fun buildDadosAutomacaoUri(): Uri {
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
     * Constrói URI de Personalização (cores do tema Costa Urbana)
     * Formato: app://payment/posCustomization?screenBackgroundColor=%231a1a2e&...
     * NOTA: # deve ser substituído por %23 na URI
     */
    private fun buildPersonalizacaoUri(): Uri {
        return Uri.Builder()
            .scheme("app")
            .authority("payment")
            .appendPath("posCustomization")
            .appendQueryParameter("screenBackgroundColor", "#1a1a2e")
            .appendQueryParameter("toolbarBackgroundColor", "#c9a961")
            .appendQueryParameter("fontColor", "#ffffff")
            .appendQueryParameter("keyboardBackgroundColor", "#2d2d44")
            .appendQueryParameter("keyboardFontColor", "#ffffff")
            .appendQueryParameter("editboxBackgroundColor", "#ffffff")
            .appendQueryParameter("releasedKeyColor", "#3d3d5c")
            .appendQueryParameter("pressedKeyColor", "#c9a961")
            .appendQueryParameter("menuSeparatorColor", "#c9a961")
            .build()
    }

    // ========================================================================
    // 3.4.1 RESPOSTA DA TRANSAÇÃO
    // ========================================================================

    /**
     * Processa a resposta do PayGo Integrado
     * Chamado pela MainActivity quando recebe Intent com ACTION_RESPONSE
     */
    fun handlePayGoResponse(responseUri: Uri) {
        addLog("════════════════════════════════════════")
        addLog("[RESP] RESPOSTA DO PAYGO")
        addLog("[RESP] URI: $responseUri")
        addLog("════════════════════════════════════════")
        
        // Log de todos os parâmetros
        addLog("[RESP] Parâmetros:")
        responseUri.queryParameterNames.forEach { key ->
            addLog("[RESP]   $key = ${responseUri.getQueryParameter(key)}")
        }
        
        val callback = pendingCallback
        if (callback == null) {
            addLog("[RESP] ⚠️ Nenhum callback pendente")
            return
        }
        
        try {
            val result = parseResponseUri(responseUri)
            
            addLog("[RESP] Status: ${result.optString("status")}")
            addLog("[RESP] NSU: ${result.optString("nsu")}")
            addLog("[RESP] Autorização: ${result.optString("autorizacao")}")
            
            // Verificar pendência
            val pendingExists = responseUri.getQueryParameter("pendingTransactionExists")?.toBoolean() ?: false
            if (pendingExists) {
                addLog("[RESP] ⚠️ EXISTE TRANSAÇÃO PENDENTE!")
                savePendingData(responseUri)
            }
            
        // Verificar se requer confirmação
        // IMPORTANTE: NÃO confirmar automaticamente!
        // A confirmação deve ser feita pelo frontend APÓS processar comprovante (email/impressão)
        // Isso segue a documentação PayGo: aprovação → comprovante → confirmação
        val requiresConfirmation = responseUri.getQueryParameter("requiresConfirmation")?.toBoolean() ?: false
        val confirmationId = responseUri.getQueryParameter("confirmationTransactionId")
        
        if (requiresConfirmation && confirmationId != null) {
            addLog("[RESP] ⚠️ Transação REQUER confirmação manual pelo frontend")
            addLog("[RESP] confirmationTransactionId: $confirmationId")
            // NÃO chamar sendConfirmation aqui - o frontend é responsável
            // sendConfirmation(confirmationId, "CONFIRMADO_AUTOMATICO")
        }
            
            callback(result)
            addLog("[RESP] ✅ Callback executado")
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao processar resposta: ${e.message}", e)
            addLog("[RESP] ❌ ERRO: ${e.message}")
            callback(createError("PARSE_ERROR", "Erro ao processar resposta: ${e.message}"))
        } finally {
            pendingTransactionId = null
            pendingCallback = null
        }
    }

    /**
     * Parseia URI de resposta para JSONObject
     * Conforme tabela 3.3.2 da documentação
     */
    private fun parseResponseUri(uri: Uri): JSONObject {
        val result = JSONObject()
        
        val transactionResult = uri.getQueryParameter("transactionResult")?.toIntOrNull() ?: -1
        
        // Determinar status (transactionResult: 0 = aprovado, 1-99 = negado, -1 = cancelado)
        val status = when {
            transactionResult == 0 -> "aprovado"
            transactionResult in 1..99 -> "negado"
            transactionResult == -1 -> "cancelado"
            else -> "erro"
        }
        
        addLog("[PARSE] transactionResult: $transactionResult -> $status")
        
        result.put("status", status)
        result.put("transactionResult", transactionResult)
        result.put("requiresConfirmation", uri.getQueryParameter("requiresConfirmation")?.toBoolean() ?: false)
        
        // Dados da transação
        result.put("nsu", uri.getQueryParameter("transactionNsu") ?: "")
        result.put("terminalNsu", uri.getQueryParameter("terminalNsu") ?: "")
        result.put("autorizacao", uri.getQueryParameter("authorizationCode") ?: "")
        result.put("bandeira", uri.getQueryParameter("cardName") ?: "")
        result.put("cartaoMascarado", uri.getQueryParameter("maskedPan") ?: "")
        result.put("tipoCartao", uri.getQueryParameter("cardType") ?: "")
        result.put("valor", uri.getQueryParameter("amount")?.toLongOrNull() ?: 0)
        result.put("parcelas", uri.getQueryParameter("installments")?.toIntOrNull() ?: 1)
        
        // Comprovantes
        result.put("comprovanteCliente", uri.getQueryParameter("cardholderReceipt") ?: "")
        result.put("comprovanteLojista", uri.getQueryParameter("merchantReceipt") ?: "")
        result.put("comprovanteCompleto", uri.getQueryParameter("fullReceipt") ?: "")
        result.put("comprovanteReduzido", uri.getQueryParameter("shortReceipt") ?: "")
        
        // Confirmação
        uri.getQueryParameter("confirmationTransactionId")?.let {
            result.put("confirmationTransactionId", it)
        }
        
        // Mensagem
        result.put("mensagem", uri.getQueryParameter("resultMessage") ?: "")
        result.put("timestamp", System.currentTimeMillis())
        result.put("ordemId", pendingTransactionId?.substringBefore("_") ?: "")
        
        // Dados adicionais
        result.put("merchantId", uri.getQueryParameter("merchantId") ?: "")
        result.put("merchantName", uri.getQueryParameter("merchantName") ?: "")
        result.put("providerName", uri.getQueryParameter("providerName") ?: "")
        
        return result
    }

    /**
     * Salva dados de transação pendente para resolução posterior
     * PERSISTIDO em SharedPreferences para sobreviver ao reinício do app
     */
    private fun savePendingData(uri: Uri) {
        lastPendingData = JSONObject().apply {
            put("providerName", uri.getQueryParameter("providerName") ?: "")
            put("merchantId", uri.getQueryParameter("merchantId") ?: "")
            put("localNsu", uri.getQueryParameter("terminalNsu") ?: "")
            put("transactionNsu", uri.getQueryParameter("transactionNsu") ?: "")
            put("hostNsu", uri.getQueryParameter("transactionNsu") ?: "") // Usar mesmo NSU se hostNsu não vier
            put("confirmationTransactionId", uri.getQueryParameter("confirmationTransactionId") ?: "")
            put("timestamp", System.currentTimeMillis())
        }
        
        // Persistir em SharedPreferences
        prefs.edit()
            .putString("pending_data", lastPendingData.toString())
            .putLong("pending_timestamp", System.currentTimeMillis())
            .apply()
        
        addLog("[PENDING] Dados de pendência PERSISTIDOS: $lastPendingData")
    }
    
    /**
     * Salva o confirmationTransactionId da última transação aprovada
     * para uso em confirmação/desfazimento posterior
     */
    fun saveLastConfirmationId(confirmationId: String, nsu: String, autorizacao: String) {
        prefs.edit()
            .putString("last_confirmation_id", confirmationId)
            .putString("last_nsu", nsu)
            .putString("last_autorizacao", autorizacao)
            .putLong("last_transaction_timestamp", System.currentTimeMillis())
            .apply()
        
        addLog("[PERSIST] ConfirmationId salvo: $confirmationId")
        addLog("[PERSIST] NSU: $nsu, Autorização: $autorizacao")
    }
    
    /**
     * Obtém o confirmationTransactionId da última transação (se existir)
     */
    fun getLastConfirmationId(): String? {
        return prefs.getString("last_confirmation_id", null)
    }
    
    /**
     * Limpa o confirmationTransactionId após confirmação bem-sucedida
     */
    fun clearLastConfirmationId() {
        prefs.edit()
            .remove("last_confirmation_id")
            .remove("last_nsu")
            .remove("last_autorizacao")
            .remove("last_transaction_timestamp")
            .apply()
        addLog("[PERSIST] ConfirmationId limpo")
    }
    
    /**
     * Carrega dados de pendência persistidos (chamado no init)
     */
    private fun loadPersistedPendingData() {
        val pendingJson = prefs.getString("pending_data", null)
        if (pendingJson != null) {
            try {
                lastPendingData = JSONObject(pendingJson)
                addLog("[PERSIST] Pendência carregada: $lastPendingData")
            } catch (e: Exception) {
                addLog("[PERSIST] Erro ao carregar pendência: ${e.message}")
            }
        }
    }
    
    /**
     * Limpa dados de pendência após resolução
     */
    private fun clearPersistedPendingData() {
        lastPendingData = null
        prefs.edit()
            .remove("pending_data")
            .remove("pending_timestamp")
            .apply()
        addLog("[PERSIST] Dados de pendência limpos")
    }
    
    /**
     * Verifica se existe pendência persistida
     */
    fun hasPersistedPending(): Boolean {
        return prefs.getString("pending_data", null) != null || 
               prefs.getString("last_confirmation_id", null) != null
    }
    
    /**
     * Obtém informações sobre pendências (para JavaScript)
     */
    fun getPendingInfo(): JSONObject {
        return JSONObject().apply {
            put("hasPendingData", lastPendingData != null)
            put("pendingData", lastPendingData ?: JSONObject.NULL)
            put("lastConfirmationId", prefs.getString("last_confirmation_id", null) ?: JSONObject.NULL)
            put("lastNsu", prefs.getString("last_nsu", null) ?: JSONObject.NULL)
            put("lastAutorizacao", prefs.getString("last_autorizacao", null) ?: JSONObject.NULL)
            put("lastTransactionTimestamp", prefs.getLong("last_transaction_timestamp", 0))
        }
    }

    // ========================================================================
    // 3.4.2 CONFIRMAÇÃO (via sendBroadcast)
    // ========================================================================

    /**
     * Envia confirmação de transação
     * Conforme documentação: https://github.com/adminti2/mobile-integracao-uri#342-confirmação
     * 
     * @param confirmationTransactionId ID recebido na resposta
     * @param transactionStatus CONFIRMADO_AUTOMATICO, CONFIRMADO_MANUAL ou DESFEITO_MANUAL
     */
    fun sendConfirmation(confirmationTransactionId: String, transactionStatus: String = "CONFIRMADO_AUTOMATICO") {
        addLog("[CONFIRM] Enviando confirmação...")
        addLog("[CONFIRM] ID: $confirmationTransactionId")
        addLog("[CONFIRM] Status: $transactionStatus")
        
        // Construir URI de confirmação
        // Formato: app://confirmation/confirmation?confirmationTransactionId=xxx&transactionStatus=xxx
        val confirmationUri = Uri.Builder()
            .scheme("app")
            .authority("confirmation")
            .appendPath("confirmation")
            .appendQueryParameter("confirmationTransactionId", confirmationTransactionId)
            .appendQueryParameter("transactionStatus", transactionStatus)
            .build()
        
        addLog("[CONFIRM] URI: $confirmationUri")
        
        try {
            // "A requisição deve ser efetuada com o método sendBroadcast"
            val intent = Intent().apply {
                action = ACTION_CONFIRMATION
                // Bundle extra com a URI (chave: "uri")
                putExtra(EXTRA_URI, confirmationUri.toString())
                // "deve ser incluída a seguinte flag: FLAG_INCLUDE_STOPPED_PACKAGES"
                addFlags(Intent.FLAG_INCLUDE_STOPPED_PACKAGES)
            }
            
            context.sendBroadcast(intent)
            addLog("[CONFIRM] ✅ Broadcast enviado")
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro na confirmação: ${e.message}", e)
            addLog("[CONFIRM] ❌ ERRO: ${e.message}")
        }
    }

    // ========================================================================
    // 3.4.3 RESOLUÇÃO DE PENDÊNCIA (via sendBroadcast)
    // ========================================================================

    /**
     * Resolve transação pendente
     * Conforme documentação: https://github.com/adminti2/mobile-integracao-uri#343-resolução-de-pendência
     * 
     * ESTRATÉGIA:
     * 1. Se temos dados de pendência completos (via pendingTransactionExists), usar URI de resolução
     * 2. Se temos apenas confirmationTransactionId (ex: Passo 33/34), usar confirmação direta
     */
    fun resolvePendingTransaction(callback: (JSONObject) -> Unit, status: String = "DESFEITO_MANUAL") {
        addLog("[RESOLVE] Resolvendo pendência... (status: $status)")
        
        // ESTRATÉGIA 1: Usar dados de pendência completos (se existirem)
        val pendingData = lastPendingData
        if (pendingData != null && pendingData.optString("providerName").isNotEmpty()) {
            addLog("[RESOLVE] Usando dados de pendência completos")
            resolvePendingWithFullData(pendingData, status, callback)
            return
        }
        
        // ESTRATÉGIA 2: Usar confirmationTransactionId persistido (ex: Passo 33)
        val lastConfirmId = prefs.getString("last_confirmation_id", null)
        if (lastConfirmId != null && lastConfirmId.isNotEmpty()) {
            addLog("[RESOLVE] Usando confirmationTransactionId persistido: $lastConfirmId")
            sendConfirmation(lastConfirmId, status)
            
            // Limpar após envio
            if (status == "DESFEITO_MANUAL") {
                clearLastConfirmationId()
            }
            
            callback(JSONObject().apply {
                put("status", "enviado")
                put("mensagem", "Confirmação $status enviada")
                put("confirmationId", lastConfirmId)
                put("metodo", "confirmation_id_persistido")
            })
            return
        }
        
        // ESTRATÉGIA 3: Verificar se temos confirmationTransactionId nos dados de pendência
        val confirmIdFromPending = pendingData?.optString("confirmationTransactionId")
        if (!confirmIdFromPending.isNullOrEmpty()) {
            addLog("[RESOLVE] Usando confirmationTransactionId da pendência: $confirmIdFromPending")
            sendConfirmation(confirmIdFromPending, status)
            clearPersistedPendingData()
            
            callback(JSONObject().apply {
                put("status", "enviado")
                put("mensagem", "Confirmação $status enviada")
                put("confirmationId", confirmIdFromPending)
                put("metodo", "confirmation_id_from_pending")
            })
            return
        }
        
        addLog("[RESOLVE] ⚠️ Nenhuma pendência encontrada")
        addLog("[RESOLVE] Dica: O Passo 33 deve salvar o confirmationTransactionId")
        callback(createError("NO_PENDING", "Nenhuma transação pendente para resolver. Verifique se o Passo 33 foi executado com sucesso."))
    }
    
    /**
     * Resolve pendência usando dados completos (providerName, merchantId, etc)
     * Conforme documentação OFICIAL: https://github.com/adminti2/mobile-integracao-uri#343-resolução-de-pendência
     * 
     * IMPORTANTE: A documentação mostra que são necessários DOIS extras:
     * 1. "uri" = URI da pendência (app://resolve/pendingTransaction?providerName=xxx&...)
     * 2. "Confirmacao" = URI de confirmação (app://resolve/confirmation?transactionStatus=xxx)
     * 
     * Exemplo da doc:
     * transacao.putExtra("uri", uriPendencia);
     * transacao.putExtra("Confirmacao", "app://resolve/confirmation?transactionStatus=CONFIRMADO_AUTOMATICO");
     */
    private fun resolvePendingWithFullData(pendingData: JSONObject, status: String, callback: (JSONObject) -> Unit) {
        try {
            // 1. URI da pendência (DADOS da transação pendente)
            // Formato: app://resolve/pendingTransaction?merchantId=xxx&providerName=xxx&hostNsu=xxx&localNsu=xxx&transactionNsu=xxx
            val pendingUri = Uri.Builder()
                .scheme("app")
                .authority("resolve")
                .appendPath("pendingTransaction")
                .appendQueryParameter("merchantId", pendingData.optString("merchantId", ""))
                .appendQueryParameter("providerName", pendingData.optString("providerName", ""))
                .appendQueryParameter("hostNsu", pendingData.optString("hostNsu", ""))
                .appendQueryParameter("localNsu", pendingData.optString("localNsu", ""))
                .appendQueryParameter("transactionNsu", pendingData.optString("transactionNsu", ""))
                .build()
            
            // 2. URI de confirmação (STATUS desejado)
            // Formato: app://resolve/confirmation?transactionStatus=CONFIRMADO_MANUAL ou DESFEITO_MANUAL
            val confirmationUri = "app://resolve/confirmation?transactionStatus=$status"
            
            addLog("[RESOLVE] ════════════════════════════════════════")
            addLog("[RESOLVE] RESOLUÇÃO DE PENDÊNCIA (2 URIs)")
            addLog("[RESOLVE] URI Pendência: $pendingUri")
            addLog("[RESOLVE] URI Confirmação: $confirmationUri")
            addLog("[RESOLVE] Status desejado: $status")
            addLog("[RESOLVE] ════════════════════════════════════════")
            
            // Enviar broadcast conforme documentação oficial
            // Intent com ACTION_CONFIRMATION e DOIS extras separados
            val intent = Intent().apply {
                action = ACTION_CONFIRMATION
                putExtra(EXTRA_URI, pendingUri.toString())           // "uri" = dados da pendência
                putExtra(EXTRA_CONFIRMACAO, confirmationUri)          // "Confirmacao" = status
                addFlags(Intent.FLAG_INCLUDE_STOPPED_PACKAGES)
            }
            
            context.sendBroadcast(intent)
            addLog("[RESOLVE] ✅ Broadcast de resolução enviado com 2 URIs")
            
            // Limpar dados de pendência após envio
            clearPersistedPendingData()
            
            callback(JSONObject().apply {
                put("status", "resolvido")
                put("mensagem", "Resolução de pendência ($status) enviada com formato correto")
                put("metodo", "full_pending_data_2_uris")
                put("providerName", pendingData.optString("providerName"))
                put("localNsu", pendingData.optString("localNsu"))
                put("uriPendencia", pendingUri.toString())
                put("uriConfirmacao", confirmationUri)
            })
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro na resolução: ${e.message}", e)
            addLog("[RESOLVE] ❌ ERRO: ${e.message}")
            callback(createError("RESOLVE_ERROR", "Erro ao resolver pendência: ${e.message}"))
        }
    }
    
    /**
     * NOVO: Resolve pendência usando dados passados diretamente do JavaScript
     * Isso resolve o problema de perda de dados quando o APK reinicia
     */
    fun resolvePendingWithExternalData(pendingData: JSONObject, status: String, callback: (JSONObject) -> Unit) {
        addLog("[RESOLVE-EXT] Resolvendo com dados do JavaScript...")
        addLog("[RESOLVE-EXT] Status: $status")
        addLog("[RESOLVE-EXT] Dados: $pendingData")
        
        // Salvar os dados recebidos para uso imediato
        lastPendingData = pendingData
        
        // Persistir também
        prefs.edit()
            .putString("pending_data", pendingData.toString())
            .putLong("pending_timestamp", System.currentTimeMillis())
            .apply()
        
        // Agora resolver usando os dados recém-salvos
        resolvePendingWithFullData(pendingData, status, callback)
    }
    
    /**
     * NOVO: Salva dados de pendência recebidos do JavaScript
     */
    fun savePendingDataFromJS(pendingData: JSONObject) {
        lastPendingData = pendingData
        prefs.edit()
            .putString("pending_data", pendingData.toString())
            .putLong("pending_timestamp", System.currentTimeMillis())
            .apply()
        addLog("[PERSIST-JS] Dados de pendência salvos do JavaScript: $pendingData")
    }

    // ========================================================================
    // CANCELAMENTO (DESFAZER)
    // ========================================================================

    /**
     * Cancela/desfaz a transação atual
     */
    fun cancelTransaction(callback: (JSONObject) -> Unit) {
        addLog("[CANCEL] Solicitação de cancelamento")

        val confirmationId = pendingTransactionId
        if (confirmationId == null) {
            addLog("[CANCEL] ⚠️ Nenhuma transação pendente")
            callback(createError("NO_TRANSACTION", "Nenhuma transação pendente"))
            return
        }

        addLog("[CANCEL] Desfazendo: $confirmationId")

        try {
            sendConfirmation(confirmationId, "DESFEITO_MANUAL")
            
            pendingTransactionId = null
            pendingCallback = null
            
            callback(JSONObject().apply {
                put("status", "cancelado")
                put("mensagem", "Transação desfeita")
            })
            
            addLog("[CANCEL] ✅ Cancelamento enviado")
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao cancelar: ${e.message}", e)
            addLog("[CANCEL] ❌ ERRO: ${e.message}")
            callback(createError("CANCEL_ERROR", "Erro ao cancelar: ${e.message}"))
        }
    }

    // ========================================================================
    // OPERAÇÃO DE CANCELAMENTO DE VENDA
    // ========================================================================

    /**
     * Inicia operação de cancelamento de uma venda anterior
     * 
     * @param ordemId ID da ordem
     * @param valorCentavos Valor original da transação
     * @param nsuOriginal NSU da transação a ser cancelada
     * @param autorizacaoOriginal Código de autorização original
     * @param callback Callback com resultado
     */
    fun startCancelamento(
        ordemId: String,
        valorCentavos: Long,
        nsuOriginal: String,
        autorizacaoOriginal: String,
        callback: (JSONObject) -> Unit
    ) {
        addLog("════════════════════════════════════════")
        addLog("[CANCELAMENTO] INICIANDO")
        addLog("[CANCELAMENTO] Valor: R$ ${String.format("%.2f", valorCentavos / 100.0)}")
        addLog("[CANCELAMENTO] NSU Original: $nsuOriginal")
        addLog("[CANCELAMENTO] Autorização Original: $autorizacaoOriginal")
        addLog("════════════════════════════════════════")

        if (!payGoInstalled) checkPayGoInstallation()
        
        if (!payGoInstalled) {
            callback(createError("PAYGO_NOT_INSTALLED", "PayGo não instalado"))
            return
        }

        val transactionId = "${ordemId}_CANCEL_${System.currentTimeMillis()}"
        pendingTransactionId = transactionId
        pendingCallback = callback

        try {
            // URI de cancelamento
            val cancelUri = Uri.Builder()
                .scheme("app")
                .authority("payment")
                .appendPath("input")
                .appendQueryParameter("operation", "CANCELAMENTO")
                .appendQueryParameter("transactionId", transactionId)
                .appendQueryParameter("amount", valorCentavos.toString())
                .appendQueryParameter("currencyCode", CURRENCY_CODE_BRL)
                .appendQueryParameter("originalTransactionNsu", nsuOriginal)
                .appendQueryParameter("originalAuthorizationCode", autorizacaoOriginal)
                .build()
            
            addLog("[CANCELAMENTO] URI: $cancelUri")
            
            val dadosAutomacaoUri = buildDadosAutomacaoUri()
            val personalizacaoUri = buildPersonalizacaoUri()
            
            val intent = Intent(ACTION_TRANSACTION, cancelUri).apply {
                putExtra(EXTRA_DADOS_AUTOMACAO, dadosAutomacaoUri.toString())
                putExtra(EXTRA_PERSONALIZACAO, personalizacaoUri.toString())
                putExtra(EXTRA_PACKAGE, context.packageName)

                // Mesma regra da VENDA: não limpar a task da automação.
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            context.startActivity(intent)
            addLog("[CANCELAMENTO] ✅ Intent enviado")
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro no cancelamento: ${e.message}", e)
            addLog("[CANCELAMENTO] ❌ ERRO: ${e.message}")
            pendingTransactionId = null
            pendingCallback = null
            callback(createError("CANCEL_ERROR", "Erro ao iniciar cancelamento: ${e.message}"))
        }
    }

    // ========================================================================
    // REIMPRESSÃO (ÚLTIMA TRANSAÇÃO)
    // ========================================================================

    /**
     * Solicita reimpressão do último comprovante
     * Conforme documentação: operation=REIMPRESSAO
     * 
     * @param callback Callback com resultado (comprovantes disponíveis na resposta)
     */
    fun startReimpressao(callback: (JSONObject) -> Unit) {
        addLog("════════════════════════════════════════")
        addLog("[REIMPRESSAO] INICIANDO")
        addLog("════════════════════════════════════════")

        if (!payGoInstalled) checkPayGoInstallation()
        
        if (!payGoInstalled) {
            callback(createError("PAYGO_NOT_INSTALLED", "PayGo não instalado"))
            return
        }

        val transactionId = "REIMP_${System.currentTimeMillis()}"
        pendingTransactionId = transactionId
        pendingCallback = callback

        try {
            // URI de reimpressão
            // Formato: app://payment/input?operation=REIMPRESSAO&transactionId=xxx
            val reimpressaoUri = Uri.Builder()
                .scheme("app")
                .authority("payment")
                .appendPath("input")
                .appendQueryParameter("operation", "REIMPRESSAO")
                .appendQueryParameter("transactionId", transactionId)
                .build()
            
            addLog("[REIMPRESSAO] URI: $reimpressaoUri")
            
            val dadosAutomacaoUri = buildDadosAutomacaoUri()
            val personalizacaoUri = buildPersonalizacaoUri()
            
            val intent = Intent(ACTION_TRANSACTION, reimpressaoUri).apply {
                putExtra(EXTRA_DADOS_AUTOMACAO, dadosAutomacaoUri.toString())
                putExtra(EXTRA_PERSONALIZACAO, personalizacaoUri.toString())
                putExtra(EXTRA_PACKAGE, context.packageName)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            context.startActivity(intent)
            addLog("[REIMPRESSAO] ✅ Intent enviado")
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro na reimpressão: ${e.message}", e)
            addLog("[REIMPRESSAO] ❌ ERRO: ${e.message}")
            pendingTransactionId = null
            pendingCallback = null
            callback(createError("REPRINT_ERROR", "Erro ao solicitar reimpressão: ${e.message}"))
        }
    }

    // ========================================================================
    // DEBUG & LOGS
    // ========================================================================

    fun setDebugMode(enabled: Boolean) {
        debugMode = enabled
        addLog("[DEBUG] Modo: ${if (enabled) "ATIVADO" else "DESATIVADO"}")
    }

    fun getLogs(): JSONArray = JSONArray(logs)

    fun clearLogs() {
        logs.clear()
        addLog("[LOGS] Histórico limpo")
    }

    private fun addLog(message: String) {
        val timestamp = java.text.SimpleDateFormat("HH:mm:ss.SSS", java.util.Locale.getDefault())
            .format(java.util.Date())
        val logEntry = "[$timestamp] $message"
        
        synchronized(logs) {
            logs.add(logEntry)
            while (logs.size > MAX_LOGS) {
                logs.removeAt(0)
            }
        }
        
        if (debugMode) {
            Log.d(TAG, message)
        }
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    private fun createError(code: String, message: String): JSONObject {
        addLog("[ERROR] $code: $message")
        return JSONObject().apply {
            put("status", "erro")
            put("codigoErro", code)
            put("mensagem", message)
            put("timestamp", System.currentTimeMillis())
        }
    }
}
