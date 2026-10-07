package com.costaurbana.totem

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Handler
import android.os.Looper
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

    // Vigia do PIX: se a PayGo não devolver resposta (QR Code expirado/travado),
    // traz o totem de volta para frente e informa o JS que o Pix não foi realizado.
    private val watchdogHandler = Handler(Looper.getMainLooper())
    private var pixWatchdog: Runnable? = null
    private val PIX_WATCHDOG_MS = 150_000L

    private fun cancelPixWatchdog() {
        pixWatchdog?.let { watchdogHandler.removeCallbacks(it) }
        pixWatchdog = null
    }

    private fun startPixWatchdog(transactionId: String) {
        cancelPixWatchdog()
        val r = Runnable {
            if (pendingTransactionId != transactionId) return@Runnable
            addLog("[WATCHDOG] ⏱️ PIX sem resposta da PayGo em ${PIX_WATCHDOG_MS / 1000}s - voltando ao totem")
            try {
                val back = Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP
                }
                context.startActivity(back)
            } catch (e: Exception) {
                addLog("[WATCHDOG] ❌ Falha ao trazer totem para frente: ${e.message}")
            }
            // Mantém pendingCallback: se a PayGo aprovar depois, o resultado ainda chega.
            pendingCallback?.invoke(JSONObject().apply {
                put("status", "cancelado")
                put("codigoErro", "PIX_TIMEOUT")
                put("mensagem", "Pix não confirmado - QR Code expirado")
            })
        }
        pixWatchdog = r
        watchdogHandler.postDelayed(r, PIX_WATCHDOG_MS)
    }
    
    // Dados de transação pendente (para resolução)
    private var lastPendingData: JSONObject? = null
    
    // ════════════════════════════════════════════════════════════════════════════
    // CRÍTICO: URI ORIGINAL do TransacaoPendenteDados
    // Conforme documentação oficial PayGo (GitHub mobile-integracao-uri):
    // A string retornada em TransacaoPendenteDados JÁ É uma URI completa
    // que deve ser usada DIRETAMENTE no broadcast, sem reconstrução!
    // ════════════════════════════════════════════════════════════════════════════
    private var originalPendingUri: String? = null
    
    // SharedPreferences para persistir dados de pendência
    private val prefs: SharedPreferences = context.getSharedPreferences("paygo_pending", Context.MODE_PRIVATE)
    
    // ════════════════════════════════════════════════════════════════════════════
    // CRÍTICO: Timestamp do último desfazimento para bloqueio de timing
    // O PayGo precisa de ~3-5 segundos para processar o broadcast e limpar
    // seu banco de dados local antes de aceitar nova transação
    // ════════════════════════════════════════════════════════════════════════════
    private var lastUndoTimestamp: Long = 0
    // Requisito PayGo (Passo 34): dar tempo para o app PayGo limpar o DB interno
    private val UNDO_COOLDOWN_MS: Long = 5000 // 5 segundos de cooldown
    
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
        
        // Calcular status do cooldown
        val timeSinceUndo = System.currentTimeMillis() - lastUndoTimestamp
        val cooldownActive = lastUndoTimestamp > 0 && timeSinceUndo < UNDO_COOLDOWN_MS
        val cooldownRemainingMs = if (cooldownActive) UNDO_COOLDOWN_MS - timeSinceUndo else 0L
        
        return JSONObject().apply {
            put("pinpad", JSONObject().apply {
                put("conectado", payGoInstalled)
                put("modelo", if (payGoInstalled) "PayGo Integrado" else "")
                put("info", "Pinpad gerenciado pelo PayGo")
            })
            put("paygo", getPayGoInfo())
            put("ready", payGoInstalled && !cooldownActive) // Só está pronto se não estiver em cooldown
            put("pendingTransaction", pendingTransactionId)
            put("hasPendingData", lastPendingData != null)
            put("debugMode", debugMode)
            put("logsCount", logs.size)
            // NOVO: Status do cooldown para o frontend
            put("cooldown", JSONObject().apply {
                put("active", cooldownActive)
                put("remainingMs", cooldownRemainingMs)
                put("totalMs", UNDO_COOLDOWN_MS)
                put("mensagem", if (cooldownActive) "Aguarde ${(cooldownRemainingMs / 1000) + 1}s - Processando desfazimento..." else null)
            })
        }
    }
    
    /**
     * NOVO: Verifica se o sistema pode iniciar nova transação
     * Retorna informações sobre cooldown após desfazimento
     */
    fun canStartTransaction(): JSONObject {
        val timeSinceUndo = System.currentTimeMillis() - lastUndoTimestamp
        val cooldownActive = lastUndoTimestamp > 0 && timeSinceUndo < UNDO_COOLDOWN_MS
        val cooldownRemainingMs = if (cooldownActive) UNDO_COOLDOWN_MS - timeSinceUndo else 0L
        
        return JSONObject().apply {
            put("canStart", !cooldownActive && payGoInstalled)
            put("payGoInstalled", payGoInstalled)
            put("cooldownActive", cooldownActive)
            put("cooldownRemainingMs", cooldownRemainingMs)
            put("cooldownTotalMs", UNDO_COOLDOWN_MS)
            if (cooldownActive) {
                put("mensagem", "Aguarde ${(cooldownRemainingMs / 1000) + 1} segundos antes de nova venda")
                put("motivo", "Processando desfazimento anterior")
            }
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

        // ════════════════════════════════════════════════════════════════
        // CRÍTICO: Verificar cooldown após desfazimento (Passo 34)
        // O PayGo precisa de tempo para processar o broadcast de DESFEITO_MANUAL
        // antes de aceitar nova transação. Sem isso, cria "loop de pendência".
        // ════════════════════════════════════════════════════════════════
        val timeSinceUndo = System.currentTimeMillis() - lastUndoTimestamp
        if (lastUndoTimestamp > 0 && timeSinceUndo < UNDO_COOLDOWN_MS) {
            val remainingMs = UNDO_COOLDOWN_MS - timeSinceUndo
            addLog("[TXN] ⏱️ COOLDOWN ATIVO! Aguarde ${remainingMs}ms")
            addLog("[TXN] ⚠️ Pendência foi desfeita há ${timeSinceUndo}ms")
            addLog("[TXN] ⚠️ Tempo mínimo: ${UNDO_COOLDOWN_MS}ms")
            
            callback(JSONObject().apply {
                put("status", "cooldown")
                put("codigoErro", "COOLDOWN_ACTIVE")
                put("mensagem", "Aguarde ${(remainingMs / 1000) + 1} segundos. Processando desfazimento anterior...")
                put("remainingMs", remainingMs)
                put("cooldownMs", UNDO_COOLDOWN_MS)
                put("aguardar", true)
            })
            return
        }
        
        // Reset cooldown se já passou
        if (timeSinceUndo >= UNDO_COOLDOWN_MS && lastUndoTimestamp > 0) {
            addLog("[TXN] ✅ Cooldown expirado - OK para nova transação")
            lastUndoTimestamp = 0 // Reset
        }

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
            if (metodo == "pix") startPixWatchdog(transactionId)
            
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
        
        cancelPixWatchdog()
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
            
        // ════════════════════════════════════════════════════════════════════
        // REGRA DE OURO: VERIFICAR transactionResult ANTES DE QUALQUER CONFIRMAÇÃO!
        // ════════════════════════════════════════════════════════════════════
        // Conforme logs de homologação, o sistema estava enviando confirmação
        // mesmo quando transactionResult = -2494 (cancelado pelo usuário).
        // 
        // CORREÇÃO DEFINITIVA (Passo 52):
        // - transactionResult == 0 → APROVADO → pode confirmar
        // - transactionResult != 0 → CANCELADO/NEGADO → NÃO CONFIRMAR!
        // ════════════════════════════════════════════════════════════════════
        
        val requiresConfirmation = responseUri.getQueryParameter("requiresConfirmation")?.toBoolean() ?: false
        val confirmationId = responseUri.getQueryParameter("confirmationTransactionId")
        val transactionResult = responseUri.getQueryParameter("transactionResult")?.toIntOrNull() ?: -99
        
        addLog("[RESP] ────────────────────────────────────────")
        addLog("[RESP] 🚦 SEMÁFORO DE CONFIRMAÇÃO:")
        addLog("[RESP]    transactionResult = $transactionResult")
        addLog("[RESP]    requiresConfirmation = $requiresConfirmation")
        addLog("[RESP]    confirmationId = $confirmationId")
        addLog("[RESP]    pendingExists = $pendingExists")
        addLog("[RESP] ────────────────────────────────────────")
        
        // ══════════════════════════════════════════════════════════════════════
        // REGRAS DE DECISÃO IMEDIATA (Passo 52, 33, 34):
        // 
        // transactionResult == 0     → APROVADO    → CONFIRMAR AUTOMÁTICO
        // transactionResult == -2599 → PENDÊNCIA   → DESFAZER IMEDIATAMENTE (Passo 34)
        // transactionResult != 0     → CANCELADO   → NÃO FAZER NADA (Passo 52 OK)
        // ══════════════════════════════════════════════════════════════════════
        
            // ═════════════════════════════════════════════════════════════════════=
            // PASSO 34 (CRÍTICO): quando houver pendência, o broadcast TEM que seguir
            // o padrão oficial (extras "uri" + "Confirmacao").
            // Enviar apenas "uri" com resolveUri (como antes) pode ser ignorado pela PayGo.
            // ═════════════════════════════════════════════════════════════════════=
            if (pendingExists) {
                addLog("[RESP] ⚠️ ════════════════════════════════════════")
                addLog("[RESP] ⚠️ PENDÊNCIA DETECTADA (pendingExists=true)")
                addLog("[RESP] ⚠️ PASSO 34: Resolvendo via resolvePendingTransaction(DESFEITO_MANUAL)")
                addLog("[RESP] ⚠️ ════════════════════════════════════════")

                // Garante fallbacks mínimos caso a pendência tenha vindo incompleta.
                // (PayGo ignora campos vazios; aqui garantimos pelo menos "0".)
                val pMerchantId = (responseUri.getQueryParameter("merchantId")
                    ?: responseUri.getQueryParameter("pendingMerchantId")
                    ?: lastPendingData?.optString("merchantId", "")
                    ?: "").takeIf { it.isNotEmpty() } ?: "0"
                val pProviderName = (responseUri.getQueryParameter("providerName")
                    ?: responseUri.getQueryParameter("pendingProviderName")
                    ?: lastPendingData?.optString("providerName", "")
                    ?: "").takeIf { it.isNotEmpty() } ?: "UNKNOWN"
                val pLocalNsu = (responseUri.getQueryParameter("localNsu")
                    ?: responseUri.getQueryParameter("terminalNsu")
                    ?: lastPendingData?.optString("localNsu", "")
                    ?: "").takeIf { it.isNotEmpty() } ?: "0"
                val pTransactionNsu = (responseUri.getQueryParameter("transactionNsu")
                    ?: responseUri.getQueryParameter("pendingTransactionNsu")
                    ?: lastPendingData?.optString("transactionNsu", "")
                    ?: "").takeIf { it.isNotEmpty() } ?: pLocalNsu
                val pHostNsu = (responseUri.getQueryParameter("hostNsu")
                    ?: responseUri.getQueryParameter("pendingHostNsu")
                    ?: lastPendingData?.optString("hostNsu", "")
                    ?: "").takeIf { it.isNotEmpty() } ?: pTransactionNsu

                // Atualiza lastPendingData para garantir que resolvePendingTransaction tenha dados mínimos,
                // mesmo quando o TransacaoPendenteDados não veio/foi perdido.
                lastPendingData = JSONObject().apply {
                    put("merchantId", pMerchantId)
                    put("providerName", pProviderName)
                    put("localNsu", pLocalNsu)
                    put("transactionNsu", pTransactionNsu)
                    put("hostNsu", pHostNsu)
                    put("timestamp", System.currentTimeMillis())
                }

                resolvePendingTransaction(
                    callback = { r -> addLog("[RESP] resolvePendingTransaction result: $r") },
                    status = "DESFEITO_MANUAL"
                )
                // Não continuar o fluxo de confirmação automática quando há pendência.
            }
        
        // Agora processar o resultado da transação ATUAL (apenas se não havia pendência)
        when (transactionResult) {
            0 -> {
                // 🟢 SINAL VERDE: Transação APROVADA
                addLog("[RESP] 🟢 SINAL VERDE: Transação APROVADA (result=0)")
                if (requiresConfirmation && confirmationId != null && !pendingExists) {
                    addLog("[RESP] ✅ Enviando confirmação AUTOMÁTICA...")
                    sendConfirmation(confirmationId, "CONFIRMADO_AUTOMATICO")
                    addLog("[RESP] ✅ Confirmação enviada com sucesso!")
                }
            }
            
            -2599 -> {
                // 🟡 Código -2599 = Transação Pendente (fallback se pendingExists não veio)
                if (!pendingExists) {
                    addLog("[RESP] 🟡 PENDÊNCIA via código -2599")
                    addLog("[RESP] ⚡ PASSO 34: Resolvendo DESFEITO_MANUAL via resolvePendingTransaction()")

                    // Melhor caminho: reutilizar a implementação oficial (uri + Confirmacao),
                    // que também aplica cooldown e fallbacks de campos vazios.
                    resolvePendingTransaction(
                        callback = { r -> addLog("[RESP] resolvePendingTransaction(-2599) result: $r") },
                        status = "DESFEITO_MANUAL"
                    )
                }
            }
            
            else -> {
                // 🔴 SINAL VERMELHO: Transação NÃO aprovada (cancelada, negada, erro)
                addLog("[RESP] 🔴 SINAL VERMELHO: Transação NÃO aprovada (result=$transactionResult)")
                addLog("[RESP] ❌ CONFIRMAÇÃO BLOQUEADA - não enviar nada ao PayGo")
                // NÃO fazer NADA - PayGo trata automaticamente
            }
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
     * 
     * IMPORTANTE: Os campos transactionNsu e hostNsu são OBRIGATÓRIOS para resolução.
     * Se não vierem na resposta, usamos localNsu como fallback (é melhor tentar com dados
     * possivelmente duplicados do que não tentar resolver).
     */
    private fun savePendingData(uri: Uri) {
        val localNsu = uri.getQueryParameter("terminalNsu") ?: ""
        val transactionNsu = uri.getQueryParameter("transactionNsu")?.takeIf { it.isNotEmpty() } ?: localNsu
        val hostNsu = uri.getQueryParameter("hostNsu")?.takeIf { it.isNotEmpty() } ?: transactionNsu
        
        lastPendingData = JSONObject().apply {
            put("providerName", uri.getQueryParameter("providerName") ?: "")
            put("merchantId", uri.getQueryParameter("merchantId") ?: "")
            put("localNsu", localNsu)
            put("transactionNsu", transactionNsu)  // Fallback para localNsu se vazio
            put("hostNsu", hostNsu)                // Fallback para transactionNsu se vazio
            put("confirmationTransactionId", uri.getQueryParameter("confirmationTransactionId") ?: "")
            put("timestamp", System.currentTimeMillis())
        }
        
        addLog("[PENDING] ════════════════════════════════════════")
        addLog("[PENDING] DADOS DE PENDÊNCIA SALVOS:")
        addLog("[PENDING] providerName: ${lastPendingData?.optString("providerName")}")
        addLog("[PENDING] merchantId: ${lastPendingData?.optString("merchantId")}")
        addLog("[PENDING] localNsu: $localNsu")
        addLog("[PENDING] transactionNsu: $transactionNsu (fallback: ${transactionNsu == localNsu})")
        addLog("[PENDING] hostNsu: $hostNsu (fallback: ${hostNsu == transactionNsu})")
        addLog("[PENDING] confirmationTransactionId: ${lastPendingData?.optString("confirmationTransactionId")}")
        addLog("[PENDING] ════════════════════════════════════════")
        
        // Persistir em SharedPreferences
        prefs.edit()
            .putString("pending_data", lastPendingData.toString())
            .putLong("pending_timestamp", System.currentTimeMillis())
            .apply()
        
        addLog("[PENDING] ✅ Dados PERSISTIDOS em SharedPreferences")
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
        
        // CRÍTICO: Carregar URI original do TransacaoPendenteDados
        originalPendingUri = prefs.getString("original_pending_uri", null)
        if (originalPendingUri != null) {
            addLog("[PERSIST] URI original carregada: $originalPendingUri")
        }
    }
    
    /**
     * Limpa dados de pendência após resolução VALIDADA
     * IMPORTANTE: Chamar SOMENTE após confirmar que o PayGo processou a resolução
     */
    fun clearPersistedPendingData() {
        lastPendingData = null
        originalPendingUri = null  // CRÍTICO: Limpar também a URI original
        prefs.edit()
            .remove("pending_data")
            .remove("pending_timestamp")
            .remove("original_pending_uri")  // CRÍTICO: Limpar URI original
            .remove("pending_source")
            .apply()
        addLog("[PERSIST] ✅ Dados de pendência limpos (validação confirmada)")
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
     * 
     * ════════════════════════════════════════════════════════════════════════════
     * IMPLEMENTAÇÃO CONFORME DOCUMENTAÇÃO OFICIAL PAYGO (GitHub mobile-integracao-uri)
     * ════════════════════════════════════════════════════════════════════════════
     * 
     * A documentação mostra que o TransacaoPendenteDados JÁ É uma URI completa
     * que deve ser usada DIRETAMENTE no broadcast, sem reconstrução!
     * 
     * Código oficial do exemplo (MainActivity.java):
     * ```java
     * transacaoPendente = intent.getStringExtra("TransacaoPendenteDados");
     * Intent transacao = startConfirmacao(transacaoPendente); // USA DIRETAMENTE!
     * transacao.putExtra("Confirmacao", "app://resolve/confirmation?transactionStatus=...");
     * this.sendBroadcast(transacao);
     * ```
     * 
     * PRIORIDADE:
     * 1. Usar URI ORIGINAL do TransacaoPendenteDados (se disponível)
     * 2. Fallback: Reconstruir URI a partir dos dados parseados
     */
    private fun resolvePendingWithFullData(pendingData: JSONObject, status: String, callback: (JSONObject) -> Unit) {
        try {
            addLog("[RESOLVE] ════════════════════════════════════════")
            addLog("[RESOLVE] RESOLUÇÃO DE PENDÊNCIA")
            addLog("[RESOLVE] Status desejado: $status")
            addLog("[RESOLVE] ════════════════════════════════════════")
            
            // ════════════════════════════════════════════════════════════════
            // PRIORIDADE 1: Usar URI ORIGINAL do TransacaoPendenteDados
            // Conforme documentação oficial, usar a string EXATA recebida do PayGo
            // ════════════════════════════════════════════════════════════════
            val savedOriginalUri = prefs.getString("original_pending_uri", null)
            val pendingUriToUse: String
            
            if (!savedOriginalUri.isNullOrEmpty()) {
                addLog("[RESOLVE] ✅ USANDO URI ORIGINAL do TransacaoPendenteDados")
                addLog("[RESOLVE] URI Original: $savedOriginalUri")
                pendingUriToUse = savedOriginalUri
            } else {
                // ════════════════════════════════════════════════════════════════
                // FALLBACK: Reconstruir URI com app://resolve/pendingTransaction
                // CRÍTICO: Campos vazios devem ser "0" (PayGo rejeita string vazia!)
                // ════════════════════════════════════════════════════════════════
                addLog("[RESOLVE] ⚠️ URI original não disponível, reconstruindo...")
                
                // Extrair com fallback para "0" quando vazio (NUNCA string vazia!)
                val pMerchantId = pendingData.optString("merchantId", "").takeIf { it.isNotEmpty() } ?: "0"
                val pProviderName = pendingData.optString("providerName", "").takeIf { it.isNotEmpty() } ?: "UNKNOWN"
                val pLocalNsu = pendingData.optString("localNsu", "").takeIf { it.isNotEmpty() } ?: "0"
                val pTransactionNsu = pendingData.optString("transactionNsu", "").takeIf { it.isNotEmpty() } ?: pLocalNsu
                val pHostNsu = pendingData.optString("hostNsu", "").takeIf { it.isNotEmpty() } ?: pTransactionNsu
                val pConfirmationId = pendingData.optString("confirmationTransactionId", "").takeIf { it.isNotEmpty() }
                
                addLog("[RESOLVE] Dados robustos (vazios→0):")
                addLog("[RESOLVE]   merchantId: $pMerchantId")
                addLog("[RESOLVE]   providerName: $pProviderName")
                addLog("[RESOLVE]   localNsu: $pLocalNsu")
                addLog("[RESOLVE]   transactionNsu: $pTransactionNsu")
                addLog("[RESOLVE]   hostNsu: $pHostNsu")
                addLog("[RESOLVE]   confirmationId: $pConfirmationId")
                
                val uriBuilder = Uri.Builder()
                    .scheme("app")
                    .authority("resolve")
                    .appendPath("pendingTransaction")
                    .appendQueryParameter("transactionStatus", status)
                    .appendQueryParameter("merchantId", pMerchantId)
                    .appendQueryParameter("providerName", pProviderName)
                    .appendQueryParameter("localNsu", pLocalNsu)
                    .appendQueryParameter("transactionNsu", pTransactionNsu)
                    .appendQueryParameter("hostNsu", pHostNsu)
                
                // Adicionar confirmationTransactionId se disponível
                if (pConfirmationId != null) {
                    uriBuilder.appendQueryParameter("confirmationTransactionId", pConfirmationId)
                }
                
                val reconstructedUri = uriBuilder.build()
                pendingUriToUse = reconstructedUri.toString()
                addLog("[RESOLVE] URI Reconstruída (Passo 34 compliant): $pendingUriToUse")
            }
            
            // URI de confirmação (STATUS desejado)
            // Formato: app://resolve/confirmation?transactionStatus=CONFIRMADO_MANUAL ou DESFEITO_MANUAL
            val confirmationUri = "app://resolve/confirmation?transactionStatus=$status"
            
            addLog("[RESOLVE] ────────────────────────────────────────")
            addLog("[RESOLVE] BROADCAST PAYGO (seção 3.4.3)")
            addLog("[RESOLVE] Action: $ACTION_CONFIRMATION")
            addLog("[RESOLVE] Extra 'uri': $pendingUriToUse")
            addLog("[RESOLVE] Extra 'Confirmacao': $confirmationUri")
            addLog("[RESOLVE] ────────────────────────────────────────")
            
            // ════════════════════════════════════════════════════════════════
            // ENVIAR BROADCAST CONFORME DOCUMENTAÇÃO OFICIAL (seção 3.4.3)
            // Intent Action: br.com.setis.confirmation.TRANSACTION
            // Extras: "uri" (dados pendência) + "Confirmacao" (status)
            // ════════════════════════════════════════════════════════════════
            
            val intent = Intent().apply {
                action = ACTION_CONFIRMATION
                putExtra(EXTRA_URI, pendingUriToUse)                  // "uri" = URI original ou reconstruída
                putExtra(EXTRA_CONFIRMACAO, confirmationUri)          // "Confirmacao" = status
                addFlags(Intent.FLAG_INCLUDE_STOPPED_PACKAGES)
            }
            
            addLog("[RESOLVE] 📡 Enviando broadcast...")
            context.sendBroadcast(intent)
            addLog("[RESOLVE] ✅ sendBroadcast() executado!")
            
            // ════════════════════════════════════════════════════════════════
            // CRÍTICO: Registrar timestamp do desfazimento para cooldown
            // O PayGo precisa de tempo para processar antes de aceitar nova venda
            // ════════════════════════════════════════════════════════════════
            if (status == "DESFEITO_MANUAL") {
                lastUndoTimestamp = System.currentTimeMillis()
                addLog("[RESOLVE] ⏱️ Cooldown iniciado - Aguarde ${UNDO_COOLDOWN_MS/1000}s antes de nova venda")
            }
            
            // ════════════════════════════════════════════════════════════════
            // LIMPAR DADOS LOCAIS APÓS ENVIAR BROADCAST
            // ════════════════════════════════════════════════════════════════
            addLog("[RESOLVE] 🧹 Limpando dados locais após envio...")
            clearPersistedPendingData()
            addLog("[RESOLVE] ✅ Dados locais limpos")
            
            // Calcular tempo de espera recomendado
            val cooldownRemainingMs = if (status == "DESFEITO_MANUAL") UNDO_COOLDOWN_MS else 0L
            
            callback(JSONObject().apply {
                put("status", "resolvido")
                put("mensagem", "Resolução de pendência ($status) enviada ao PayGo")
                put("metodo", if (!savedOriginalUri.isNullOrEmpty()) "URI_ORIGINAL_TransacaoPendenteDados" else "URI_RECONSTRUIDA_fallback")
                put("usouUriOriginal", !savedOriginalUri.isNullOrEmpty())
                put("providerName", pendingData.optString("providerName"))
                put("merchantId", pendingData.optString("merchantId"))
                put("localNsu", pendingData.optString("localNsu"))
                put("transactionNsu", pendingData.optString("transactionNsu"))
                put("hostNsu", pendingData.optString("hostNsu"))
                put("uriEnviada", pendingUriToUse)
                put("uriConfirmacao", confirmationUri)
                put("pendingDataCleared", true)
                // NOVO: Informações de timing para o frontend
                put("cooldownMs", cooldownRemainingMs)
                put("aguardarAntesDaProximaVenda", cooldownRemainingMs > 0)
                put("mensagemCooldown", if (cooldownRemainingMs > 0) "Aguarde ${cooldownRemainingMs/1000} segundos antes de nova venda" else null)
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
     * 
     * IMPORTANTE: Aplica fallbacks para campos NSU obrigatórios que podem vir vazios
     */
    fun resolvePendingWithExternalData(pendingDataRaw: JSONObject, status: String, callback: (JSONObject) -> Unit) {
        addLog("[RESOLVE-EXT] ════════════════════════════════════════")
        addLog("[RESOLVE-EXT] Resolvendo com dados do JavaScript...")
        addLog("[RESOLVE-EXT] Status: $status")
        addLog("[RESOLVE-EXT] Dados recebidos: $pendingDataRaw")
        
        // Aplicar fallbacks para campos NSU obrigatórios
        val localNsu = pendingDataRaw.optString("localNsu", "")
        val transactionNsu = pendingDataRaw.optString("transactionNsu", "").takeIf { it.isNotEmpty() } ?: localNsu
        val hostNsu = pendingDataRaw.optString("hostNsu", "").takeIf { it.isNotEmpty() } ?: transactionNsu
        
        // Criar objeto com fallbacks aplicados
        val pendingData = JSONObject().apply {
            put("providerName", pendingDataRaw.optString("providerName", ""))
            put("merchantId", pendingDataRaw.optString("merchantId", ""))
            put("localNsu", localNsu)
            put("transactionNsu", transactionNsu)
            put("hostNsu", hostNsu)
            put("confirmationTransactionId", pendingDataRaw.optString("confirmationTransactionId", ""))
            put("timestamp", System.currentTimeMillis())
        }
        
        addLog("[RESOLVE-EXT] Dados com fallbacks:")
        addLog("[RESOLVE-EXT]   localNsu: $localNsu")
        addLog("[RESOLVE-EXT]   transactionNsu: $transactionNsu (fallback: ${transactionNsu == localNsu})")
        addLog("[RESOLVE-EXT]   hostNsu: $hostNsu (fallback: ${hostNsu == transactionNsu})")
        addLog("[RESOLVE-EXT] ════════════════════════════════════════")
        
        // Salvar os dados recebidos para uso imediato
        lastPendingData = pendingData
        
        // Persistir também
        prefs.edit()
            .putString("pending_data", pendingData.toString())
            .putLong("pending_timestamp", System.currentTimeMillis())
            .apply()
        
        // Agora resolver usando os dados com fallbacks
        resolvePendingWithFullData(pendingData, status, callback)
    }
    
    /**
     * NOVO: Salva dados de pendência recebidos do JavaScript
     */
    fun savePendingDataFromJS(pendingDataRaw: JSONObject) {
        // Aplicar fallbacks
        val localNsu = pendingDataRaw.optString("localNsu", "")
        val transactionNsu = pendingDataRaw.optString("transactionNsu", "").takeIf { it.isNotEmpty() } ?: localNsu
        val hostNsu = pendingDataRaw.optString("hostNsu", "").takeIf { it.isNotEmpty() } ?: transactionNsu
        
        lastPendingData = JSONObject().apply {
            put("providerName", pendingDataRaw.optString("providerName", ""))
            put("merchantId", pendingDataRaw.optString("merchantId", ""))
            put("localNsu", localNsu)
            put("transactionNsu", transactionNsu)
            put("hostNsu", hostNsu)
            put("confirmationTransactionId", pendingDataRaw.optString("confirmationTransactionId", ""))
            put("timestamp", System.currentTimeMillis())
        }
        
        prefs.edit()
            .putString("pending_data", lastPendingData.toString())
            .putLong("pending_timestamp", System.currentTimeMillis())
            .apply()
            
        addLog("[PERSIST-JS] Dados de pendência salvos do JavaScript (com fallbacks):")
        addLog("[PERSIST-JS]   transactionNsu: $transactionNsu")
        addLog("[PERSIST-JS]   hostNsu: $hostNsu")
    }
    
    /**
     * CRÍTICO: Salva dados de pendência a partir da URI "TransacaoPendenteDados"
     * 
     * ════════════════════════════════════════════════════════════════════════════
     * IMPLEMENTAÇÃO CONFORME DOCUMENTAÇÃO OFICIAL PAYGO (GitHub mobile-integracao-uri)
     * ════════════════════════════════════════════════════════════════════════════
     * 
     * O TransacaoPendenteDados retornado pelo PayGo JÁ É uma URI completa que
     * deve ser usada DIRETAMENTE no broadcast de resolução, sem reconstrução!
     * 
     * Código oficial do exemplo (MainActivity.java):
     * ```java
     * transacaoPendente = intent.getStringExtra("TransacaoPendenteDados");
     * Intent transacao = startConfirmacao(transacaoPendente); // USA DIRETAMENTE!
     * ```
     * 
     * Esta função:
     * 1. SALVA A URI ORIGINAL (para uso direto no broadcast)
     * 2. Também parseia os dados para exibição no frontend
     * 
     * Conforme documentação PayGo (seção 3.3.4):
     * - providerName: Provedor com o qual a transação está pendente
     * - merchantId: Identificador do estabelecimento
     * - localNsu: NSU local da transação pendente
     * - transactionNsu: NSU do servidor TEF da transação pendente
     * - hostNsu: NSU do provedor da transação pendente
     * 
     * @param pendingDataUri URI completa no formato app://resolve/pendingTransaction?...
     */
    fun savePendingDataFromUri(pendingDataUri: String) {
        addLog("[PENDING-URI] ════════════════════════════════════════")
        addLog("[PENDING-URI] RECEBIDO TransacaoPendenteDados do PayGo!")
        addLog("[PENDING-URI] ════════════════════════════════════════")
        addLog("[PENDING-URI] URI ORIGINAL (será usada diretamente):")
        addLog("[PENDING-URI] $pendingDataUri")
        addLog("[PENDING-URI] ────────────────────────────────────────")
        
        try {
            // ════════════════════════════════════════════════════════════════
            // CRÍTICO: SALVAR URI ORIGINAL PRIMEIRO!
            // Conforme documentação oficial, esta URI deve ser usada DIRETAMENTE
            // no broadcast de resolução, sem reconstrução.
            // ════════════════════════════════════════════════════════════════
            originalPendingUri = pendingDataUri
            addLog("[PENDING-URI] ✅ URI ORIGINAL salva em memória")
            
            // Parsear para extrair dados (apenas para exibição/debug)
            val uri = Uri.parse(pendingDataUri)
            
            val providerName = uri.getQueryParameter("providerName") ?: ""
            val merchantId = uri.getQueryParameter("merchantId") ?: ""
            val localNsu = uri.getQueryParameter("localNsu") ?: ""
            val transactionNsu = uri.getQueryParameter("transactionNsu")?.takeIf { it.isNotEmpty() } ?: localNsu
            val hostNsu = uri.getQueryParameter("hostNsu")?.takeIf { it.isNotEmpty() } ?: transactionNsu
            
            addLog("[PENDING-URI] Dados parseados (para exibição):")
            addLog("[PENDING-URI]   providerName: $providerName")
            addLog("[PENDING-URI]   merchantId: $merchantId")
            addLog("[PENDING-URI]   localNsu: $localNsu")
            addLog("[PENDING-URI]   transactionNsu: $transactionNsu")
            addLog("[PENDING-URI]   hostNsu: $hostNsu")
            
            // Validar campos obrigatórios
            if (providerName.isEmpty() || merchantId.isEmpty()) {
                addLog("[PENDING-URI] ⚠️ ALERTA: providerName ou merchantId vazios na URI!")
            }
            
            // Criar objeto de pendência com os dados (para frontend)
            lastPendingData = JSONObject().apply {
                put("providerName", providerName)
                put("merchantId", merchantId)
                put("localNsu", localNsu)
                put("transactionNsu", transactionNsu)
                put("hostNsu", hostNsu)
                put("source", "TransacaoPendenteDados")
                put("originalUri", pendingDataUri)  // Incluir URI original no objeto também
                put("timestamp", System.currentTimeMillis())
            }
            
            // ════════════════════════════════════════════════════════════════
            // PERSISTIR TUDO EM SHAREDPREFERENCES
            // CRÍTICO: Salvar original_pending_uri para sobreviver reinícios
            // ════════════════════════════════════════════════════════════════
            prefs.edit()
                .putString("pending_data", lastPendingData.toString())
                .putString("original_pending_uri", pendingDataUri)  // ← CRÍTICO!
                .putString("pending_source", "TransacaoPendenteDados")
                .putLong("pending_timestamp", System.currentTimeMillis())
                .apply()
            
            addLog("[PENDING-URI] ✅ URI ORIGINAL persistida em SharedPreferences")
            addLog("[PENDING-URI] ✅ Dados da transação PENDENTE REAL salvos!")
            addLog("[PENDING-URI] ════════════════════════════════════════")
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao processar TransacaoPendenteDados: ${e.message}", e)
            addLog("[PENDING-URI] ❌ ERRO: ${e.message}")
            
            // Mesmo em caso de erro no parse, tentar salvar a URI original
            if (pendingDataUri.isNotEmpty()) {
                originalPendingUri = pendingDataUri
                prefs.edit()
                    .putString("original_pending_uri", pendingDataUri)
                    .apply()
                addLog("[PENDING-URI] ⚠️ URI original salva mesmo com erro de parse")
            }
        }
    }
    
    // ========================================================================
    // CONFIRMAÇÃO AUTOMÁTICA DE PENDÊNCIA (NOVO - Conforme exemplo PayGo oficial)
    // ========================================================================
    
    /**
     * Envia resolução automática de pendência quando TransacaoPendenteDados é recebido
     * 
     * CONFORME EXEMPLO OFICIAL PAYGO (MainActivity.java):
     * ```java
     * transacaoPendente = intent.getStringExtra("TransacaoPendenteDados");
     * if (transacaoPendente != null) {
     *     Intent transacao = startConfirmacao(transacaoPendente);
     *     transacao.putExtra("Confirmacao", "app://resolve/confirmation?transactionStatus=CONFIRMADO_AUTOMATICO");
     *     this.sendBroadcast(transacao);
     * }
     * ```
     * 
     * @param pendingDataUri URI TransacaoPendenteDados recebida do PayGo (ex: app://resolve/pendingTransaction?...)
     * @param transactionStatus CONFIRMADO_AUTOMATICO ou DESFEITO_MANUAL
     */
    fun sendPendingResolution(pendingDataUri: String, transactionStatus: String = "CONFIRMADO_AUTOMATICO") {
        addLog("[PENDING-RESOLVE] ════════════════════════════════════════")
        addLog("[PENDING-RESOLVE] RESOLUÇÃO AUTOMÁTICA DE PENDÊNCIA")
        addLog("[PENDING-RESOLVE] (Conforme exemplo oficial PayGo)")
        addLog("[PENDING-RESOLVE] ════════════════════════════════════════")
        addLog("[PENDING-RESOLVE] URI da pendência: $pendingDataUri")
        addLog("[PENDING-RESOLVE] Status: $transactionStatus")
        
        try {
            // URI de confirmação (status desejado)
            // Formato: app://resolve/confirmation?transactionStatus=CONFIRMADO_AUTOMATICO
            val confirmationUri = "app://resolve/confirmation?transactionStatus=$transactionStatus"
            
            addLog("[PENDING-RESOLVE] ────────────────────────────────────────")
            addLog("[PENDING-RESOLVE] Broadcast PayGo:")
            addLog("[PENDING-RESOLVE]   Action: $ACTION_CONFIRMATION")
            addLog("[PENDING-RESOLVE]   Extra 'uri': $pendingDataUri")
            addLog("[PENDING-RESOLVE]   Extra 'Confirmacao': $confirmationUri")
            addLog("[PENDING-RESOLVE] ────────────────────────────────────────")
            
            // EXATAMENTE conforme exemplo oficial startConfirmacao():
            // Intent.action = "br.com.setis.confirmation.TRANSACTION"
            // Intent.putExtra("uri", pendingDataUri)
            // Intent.putExtra("Confirmacao", confirmationUri)
            // addFlags(FLAG_INCLUDE_STOPPED_PACKAGES)
            val intent = Intent().apply {
                action = ACTION_CONFIRMATION
                putExtra(EXTRA_URI, pendingDataUri)           // "uri" = TransacaoPendenteDados
                putExtra(EXTRA_CONFIRMACAO, confirmationUri)  // "Confirmacao" = status
                addFlags(Intent.FLAG_INCLUDE_STOPPED_PACKAGES)
            }
            
            addLog("[PENDING-RESOLVE] 📡 Enviando broadcast...")
            context.sendBroadcast(intent)
            addLog("[PENDING-RESOLVE] ✅ sendBroadcast() executado!")
            addLog("[PENDING-RESOLVE] ════════════════════════════════════════")
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao enviar resolução de pendência: ${e.message}", e)
            addLog("[PENDING-RESOLVE] ❌ ERRO: ${e.message}")
        }
    }

    /**
     * Valida os dados de uma transação pendente
     * Conforme documentação PayGo seção 3.3.4, os campos obrigatórios são:
     * - providerName: Provedor da transação pendente
     * - merchantId: ID do estabelecimento
     * - localNsu: NSU local da transação pendente
     * - transactionNsu: NSU do servidor TEF
     * - hostNsu: NSU do provedor
     * 
     * @param pendingUri URI TransacaoPendenteDados recebida do PayGo
     * @return true se os dados são válidos e devem ser confirmados, false para desfazer
     */
    fun validatePendingData(pendingUri: String): Boolean {
        addLog("[VALIDATE] ════════════════════════════════════════")
        addLog("[VALIDATE] Validando dados da pendência...")
        addLog("[VALIDATE] URI: $pendingUri")
        
        return try {
            val uri = android.net.Uri.parse(pendingUri)
            
            // Campos obrigatórios conforme documentação PayGo 3.3.4
            val merchantId = uri.getQueryParameter("merchantId")
            val providerName = uri.getQueryParameter("providerName")
            val localNsu = uri.getQueryParameter("localNsu")
            val transactionNsu = uri.getQueryParameter("transactionNsu")
            val hostNsu = uri.getQueryParameter("hostNsu")
            
            addLog("[VALIDATE] merchantId: $merchantId")
            addLog("[VALIDATE] providerName: $providerName")
            addLog("[VALIDATE] localNsu: $localNsu")
            addLog("[VALIDATE] transactionNsu: $transactionNsu")
            addLog("[VALIDATE] hostNsu: $hostNsu")
            
            // Pendência é válida se tiver os campos obrigatórios preenchidos
            val isValid = !merchantId.isNullOrEmpty() && 
                          !providerName.isNullOrEmpty() && 
                          !localNsu.isNullOrEmpty() &&
                          !transactionNsu.isNullOrEmpty() &&
                          !hostNsu.isNullOrEmpty()
            
            if (isValid) {
                addLog("[VALIDATE] ✅ Dados VÁLIDOS - será CONFIRMADO")
            } else {
                addLog("[VALIDATE] ⚠️ Dados INVÁLIDOS/INCOMPLETOS - será DESFEITO")
            }
            
            addLog("[VALIDATE] ════════════════════════════════════════")
            isValid
            
        } catch (e: Exception) {
            addLog("[VALIDATE] ❌ ERRO ao validar: ${e.message}")
            addLog("[VALIDATE] ⚠️ Retornando false (DESFEITO_MANUAL)")
            addLog("[VALIDATE] ════════════════════════════════════════")
            false
        }
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
    // OPERAÇÃO ADMINISTRATIVA - PODE RESOLVER PENDÊNCIAS
    // ========================================================================

    /**
     * Inicia operação ADMINISTRATIVA
     * Conforme documentação PayGo: operation=ADMINISTRATIVA
     * 
     * Esta operação abre o menu administrativo do PayGo onde é possível:
     * - Resolver transações pendentes manualmente
     * - Verificar status do terminal
     * - Outras funções administrativas
     * 
     * @param callback Callback com resultado
     */
    fun startAdministrativa(callback: (JSONObject) -> Unit) {
        addLog("════════════════════════════════════════")
        addLog("[ADMINISTRATIVA] INICIANDO")
        addLog("[ADMINISTRATIVA] Esta operação pode resolver pendências!")
        addLog("════════════════════════════════════════")

        if (!payGoInstalled) checkPayGoInstallation()
        
        if (!payGoInstalled) {
            callback(createError("PAYGO_NOT_INSTALLED", "PayGo não instalado"))
            return
        }

        val transactionId = "ADMIN_${System.currentTimeMillis()}"
        pendingTransactionId = transactionId
        pendingCallback = callback

        try {
            // URI de operação administrativa
            // Formato: app://payment/input?operation=ADMINISTRATIVA&transactionId=xxx
            val adminUri = Uri.Builder()
                .scheme("app")
                .authority("payment")
                .appendPath("input")
                .appendQueryParameter("operation", "ADMINISTRATIVA")
                .appendQueryParameter("transactionId", transactionId)
                .build()
            
            addLog("[ADMINISTRATIVA] URI: $adminUri")
            
            val dadosAutomacaoUri = buildDadosAutomacaoUri()
            val personalizacaoUri = buildPersonalizacaoUri()
            
            val intent = Intent(ACTION_TRANSACTION, adminUri).apply {
                putExtra(EXTRA_DADOS_AUTOMACAO, dadosAutomacaoUri.toString())
                putExtra(EXTRA_PERSONALIZACAO, personalizacaoUri.toString())
                putExtra(EXTRA_PACKAGE, context.packageName)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            context.startActivity(intent)
            addLog("[ADMINISTRATIVA] ✅ Intent enviado - Aguardando resposta do PayGo")
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro na administrativa: ${e.message}", e)
            addLog("[ADMINISTRATIVA] ❌ ERRO: ${e.message}")
            pendingTransactionId = null
            pendingCallback = null
            callback(createError("ADMIN_ERROR", "Erro ao iniciar administrativa: ${e.message}"))
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
