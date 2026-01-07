package com.costaurbana.totem

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.util.Log
import org.json.JSONObject

/**
 * PayGo Pending Resolver
 * 
 * Implementação dos Passos 33 e 34 conforme documentação oficial PayGo:
 * 
 * FLUXO OBRIGATÓRIO:
 * 1. ANTES de qualquer venda: verificar pendência com checkPendingTransaction()
 * 2. SE pendência existir: resolver com resolvePendingTransaction() ANTES de nova venda
 * 3. APÓS venda aprovada: confirmar com confirmTransaction() APÓS impressão/email OK
 * 4. SE falha na impressão: desfazer com undoTransaction()
 * 
 * REGRA DE DECISÃO (documentação PayGo):
 * - CONFIRMAR: venda registrada no PDV/ERP com sucesso
 * - DESFAZER: falha ao registrar, falha na impressão, timeout, etc.
 * 
 * PERSISTÊNCIA OBRIGATÓRIA:
 * - Transação aprovada -> salvar dados em Room/SQLite
 * - Se app crashar entre aprovação e confirmação, resolver no próximo boot
 */
class PayGoPendingResolver(private val context: Context) {
    
    companion object {
        private const val TAG = "PayGoPendingResolver"
        private const val PREFS_NAME = "paygo_pending_resolver"
        
        // Status de transação PayGo
        const val STATUS_CONFIRMADO_AUTOMATICO = "CONFIRMADO_AUTOMATICO"
        const val STATUS_CONFIRMADO_MANUAL = "CONFIRMADO_MANUAL"
        const val STATUS_DESFEITO_MANUAL = "DESFEITO_MANUAL"
        const val STATUS_DESFEITO_ERRO_IMPRESSAO = "DESFEITO_ERRO_IMPRESSAO_AUTOMATICO"
        
        // Actions PayGo
        const val ACTION_TRANSACTION = "br.com.setis.payment.TRANSACTION"
        const val ACTION_CONFIRMATION = "br.com.setis.confirmation.TRANSACTION"
    }
    
    // Estados de venda
    enum class VendaStatus {
        NENHUMA,           // Sem venda em andamento
        INICIADA,          // Venda chamada
        APROVADA,          // Aprovada pelo PayGo, aguardando impressão
        IMPRESSA_OK,       // Impressão ok, pronto para confirmar
        IMPRESSA_FALHA,    // Falha na impressão, deve desfazer
        CONFIRMADA,        // Confirmada no PayGo
        DESFEITA           // Desfeita no PayGo
    }
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    // Dados da transação atual/pendente
    data class TransacaoPendente(
        val confirmationId: String,
        val nsu: String,
        val autorizacao: String,
        val valor: Long,
        val providerName: String,
        val merchantId: String,
        val localNsu: String,
        val transactionNsu: String,
        val hostNsu: String,
        val status: VendaStatus,
        val timestamp: Long
    ) {
        fun toJson(): JSONObject = JSONObject().apply {
            put("confirmationId", confirmationId)
            put("nsu", nsu)
            put("autorizacao", autorizacao)
            put("valor", valor)
            put("providerName", providerName)
            put("merchantId", merchantId)
            put("localNsu", localNsu)
            put("transactionNsu", transactionNsu)
            put("hostNsu", hostNsu)
            put("status", status.name)
            put("timestamp", timestamp)
        }
        
        companion object {
            fun fromJson(json: JSONObject): TransacaoPendente? {
                return try {
                    TransacaoPendente(
                        confirmationId = json.optString("confirmationId", ""),
                        nsu = json.optString("nsu", ""),
                        autorizacao = json.optString("autorizacao", ""),
                        valor = json.optLong("valor", 0),
                        providerName = json.optString("providerName", ""),
                        merchantId = json.optString("merchantId", ""),
                        localNsu = json.optString("localNsu", ""),
                        transactionNsu = json.optString("transactionNsu", ""),
                        hostNsu = json.optString("hostNsu", ""),
                        status = try { VendaStatus.valueOf(json.optString("status", "NENHUMA")) } catch (e: Exception) { VendaStatus.NENHUMA },
                        timestamp = json.optLong("timestamp", 0)
                    )
                } catch (e: Exception) {
                    Log.e(TAG, "Erro ao parsear TransacaoPendente: ${e.message}")
                    null
                }
            }
        }
    }
    
    // ========================================================================
    // GATE OBRIGATÓRIO - Verificar pendência ANTES de qualquer venda
    // ========================================================================
    
    /**
     * OBRIGATÓRIO: Chamar ANTES de qualquer nova venda
     * 
     * Verifica se existe transação pendente no sistema.
     * Se existir, a nova venda deve ser BLOQUEADA até resolver.
     * 
     * @return true se pode prosseguir com nova venda, false se há pendência
     */
    fun canStartNewTransaction(): Boolean {
        val pendente = getStoredPending()
        if (pendente != null) {
            Log.w(TAG, "[GATE] ⚠️ BLOQUEADO: Transação pendente encontrada")
            Log.w(TAG, "[GATE] ConfirmationId: ${pendente.confirmationId}")
            Log.w(TAG, "[GATE] Status: ${pendente.status}")
            return false
        }
        
        Log.i(TAG, "[GATE] ✅ Sem pendências - pode iniciar nova venda")
        return true
    }
    
    /**
     * Verifica se existe pendência persistida
     */
    fun hasPendingTransaction(): Boolean {
        return getStoredPending() != null
    }
    
    /**
     * Obtém dados da transação pendente (se existir)
     */
    fun getPendingTransaction(): TransacaoPendente? {
        return getStoredPending()
    }
    
    /**
     * Obtém informações de pendência como JSON para JavaScript
     */
    fun getPendingInfoJson(): JSONObject {
        val pendente = getStoredPending()
        return JSONObject().apply {
            put("hasPending", pendente != null)
            put("pending", pendente?.toJson() ?: JSONObject.NULL)
            put("canStartTransaction", canStartNewTransaction())
        }
    }
    
    // ========================================================================
    // PASSO 33: Salvar transação APROVADA (aguardando impressão)
    // ========================================================================
    
    /**
     * Salvar dados de transação APROVADA para confirmação posterior
     * Chamado APÓS receber resposta aprovada do PayGo
     * 
     * A transação só será CONFIRMADA após:
     * 1. Comprovante impresso/enviado com sucesso
     * 2. Venda registrada no PDV/ERP
     */
    fun saveApprovedTransaction(
        confirmationId: String,
        nsu: String,
        autorizacao: String,
        valor: Long,
        providerName: String = "",
        merchantId: String = "",
        localNsu: String = "",
        transactionNsu: String = "",
        hostNsu: String = ""
    ) {
        Log.i(TAG, "[PASSO33] ════════════════════════════════════════")
        Log.i(TAG, "[PASSO33] SALVANDO TRANSAÇÃO APROVADA")
        Log.i(TAG, "[PASSO33] ConfirmationId: $confirmationId")
        Log.i(TAG, "[PASSO33] NSU: $nsu")
        Log.i(TAG, "[PASSO33] Valor: R$ ${String.format("%.2f", valor / 100.0)}")
        Log.i(TAG, "[PASSO33] ════════════════════════════════════════")
        
        // Aplicar fallbacks para NSUs
        val finalLocalNsu = localNsu.ifEmpty { nsu }
        val finalTransactionNsu = transactionNsu.ifEmpty { finalLocalNsu }
        val finalHostNsu = hostNsu.ifEmpty { finalTransactionNsu }
        
        val pendente = TransacaoPendente(
            confirmationId = confirmationId,
            nsu = nsu,
            autorizacao = autorizacao,
            valor = valor,
            providerName = providerName,
            merchantId = merchantId,
            localNsu = finalLocalNsu,
            transactionNsu = finalTransactionNsu,
            hostNsu = finalHostNsu,
            status = VendaStatus.APROVADA,
            timestamp = System.currentTimeMillis()
        )
        
        storePending(pendente)
        Log.i(TAG, "[PASSO33] ✅ Transação salva para confirmação posterior")
    }
    
    /**
     * Marcar que comprovante foi impresso com sucesso
     */
    fun markPrintSuccess() {
        val pendente = getStoredPending() ?: return
        val updated = pendente.copy(status = VendaStatus.IMPRESSA_OK)
        storePending(updated)
        Log.i(TAG, "[PRINT] ✅ Impressão OK - pronto para confirmar")
    }
    
    /**
     * Marcar que comprovante FALHOU na impressão
     */
    fun markPrintFailure() {
        val pendente = getStoredPending() ?: return
        val updated = pendente.copy(status = VendaStatus.IMPRESSA_FALHA)
        storePending(updated)
        Log.w(TAG, "[PRINT] ❌ Impressão FALHOU - será necessário DESFAZER")
    }
    
    // ========================================================================
    // CONFIRMAÇÃO / DESFAZIMENTO (envio via Broadcast)
    // ========================================================================
    
    /**
     * CONFIRMA a transação aprovada
     * Usar APÓS impressão OK e venda registrada no PDV
     */
    fun confirmTransaction(): Boolean {
        val pendente = getStoredPending()
        if (pendente == null) {
            Log.w(TAG, "[CONFIRM] Nenhuma transação para confirmar")
            return false
        }
        
        Log.i(TAG, "[CONFIRM] ════════════════════════════════════════")
        Log.i(TAG, "[CONFIRM] CONFIRMANDO TRANSAÇÃO")
        Log.i(TAG, "[CONFIRM] ConfirmationId: ${pendente.confirmationId}")
        Log.i(TAG, "[CONFIRM] ════════════════════════════════════════")
        
        // Enviar confirmação via Broadcast
        val success = sendConfirmationBroadcast(pendente.confirmationId, STATUS_CONFIRMADO_AUTOMATICO)
        
        if (success) {
            // Atualizar status e limpar
            val updated = pendente.copy(status = VendaStatus.CONFIRMADA)
            storePending(updated)
            clearPending() // Limpar após sucesso
            Log.i(TAG, "[CONFIRM] ✅ Transação CONFIRMADA")
        } else {
            Log.e(TAG, "[CONFIRM] ❌ Erro ao confirmar")
        }
        
        return success
    }
    
    /**
     * DESFAZ a transação aprovada
     * Usar quando: falha na impressão, falha no PDV, usuário cancelou, etc.
     */
    fun undoTransaction(reason: String = "DESFEITO_MANUAL"): Boolean {
        val pendente = getStoredPending()
        if (pendente == null) {
            Log.w(TAG, "[UNDO] Nenhuma transação para desfazer")
            return false
        }
        
        Log.i(TAG, "[UNDO] ════════════════════════════════════════")
        Log.i(TAG, "[UNDO] DESFAZENDO TRANSAÇÃO")
        Log.i(TAG, "[UNDO] ConfirmationId: ${pendente.confirmationId}")
        Log.i(TAG, "[UNDO] Motivo: $reason")
        Log.i(TAG, "[UNDO] ════════════════════════════════════════")
        
        // Determinar status baseado no motivo
        val status = when {
            reason.contains("IMPRESSAO", ignoreCase = true) -> STATUS_DESFEITO_ERRO_IMPRESSAO
            else -> STATUS_DESFEITO_MANUAL
        }
        
        // Enviar desfazimento via Broadcast
        val success = sendConfirmationBroadcast(pendente.confirmationId, status)
        
        if (success) {
            val updated = pendente.copy(status = VendaStatus.DESFEITA)
            storePending(updated)
            clearPending() // Limpar após sucesso
            Log.i(TAG, "[UNDO] ✅ Transação DESFEITA")
        } else {
            Log.e(TAG, "[UNDO] ❌ Erro ao desfazer")
        }
        
        return success
    }
    
    // ========================================================================
    // PASSO 34: Resolução de Pendência (ANTES de nova venda)
    // ========================================================================
    
    /**
     * RESOLVE a pendência existente
     * 
     * IMPORTANTE: Este método deve ser chamado ANTES de iniciar nova venda
     * quando hasPendingTransaction() retornar true.
     * 
     * @param action "CONFIRMAR" ou "DESFAZER"
     * @return true se a pendência foi resolvida com sucesso
     */
    fun resolvePending(action: String = "DESFAZER"): Boolean {
        val pendente = getStoredPending()
        if (pendente == null) {
            Log.i(TAG, "[RESOLVE] Nenhuma pendência para resolver")
            return true // Retorna true porque não há pendência (pode prosseguir)
        }
        
        Log.i(TAG, "[PASSO34] ════════════════════════════════════════")
        Log.i(TAG, "[PASSO34] RESOLVENDO PENDÊNCIA")
        Log.i(TAG, "[PASSO34] Ação: $action")
        Log.i(TAG, "[PASSO34] ConfirmationId: ${pendente.confirmationId}")
        Log.i(TAG, "[PASSO34] Status atual: ${pendente.status}")
        Log.i(TAG, "[PASSO34] ════════════════════════════════════════")
        
        return when (action.uppercase()) {
            "CONFIRMAR" -> {
                // Regra: CONFIRMAR apenas se venda foi registrada no PDV
                confirmTransaction()
            }
            "DESFAZER" -> {
                // Regra: DESFAZER em caso de falha, timeout, etc.
                undoTransaction("PASSO34_DESFAZER")
            }
            else -> {
                Log.e(TAG, "[RESOLVE] Ação desconhecida: $action")
                false
            }
        }
    }
    
    /**
     * Resolve pendência automaticamente baseado no status
     * 
     * Lógica automática:
     * - IMPRESSA_OK -> CONFIRMAR
     * - IMPRESSA_FALHA -> DESFAZER
     * - APROVADA (sem impressão) -> DESFAZER (timeout/crash entre aprovação e impressão)
     */
    fun autoResolvePending(): Boolean {
        val pendente = getStoredPending() ?: return true
        
        Log.i(TAG, "[AUTO-RESOLVE] Status: ${pendente.status}")
        
        return when (pendente.status) {
            VendaStatus.IMPRESSA_OK -> {
                Log.i(TAG, "[AUTO-RESOLVE] Impressão OK -> CONFIRMAR")
                confirmTransaction()
            }
            VendaStatus.IMPRESSA_FALHA -> {
                Log.i(TAG, "[AUTO-RESOLVE] Impressão FALHOU -> DESFAZER")
                undoTransaction("AUTO_ERRO_IMPRESSAO")
            }
            VendaStatus.APROVADA -> {
                // Transação aprovada mas sem confirmação de impressão
                // Isso indica crash ou timeout - DESFAZER por segurança
                Log.w(TAG, "[AUTO-RESOLVE] Transação órfã (sem impressão) -> DESFAZER")
                undoTransaction("AUTO_ORFAO")
            }
            else -> {
                Log.i(TAG, "[AUTO-RESOLVE] Status ${pendente.status} não requer ação")
                clearPending()
                true
            }
        }
    }
    
    // ========================================================================
    // ENVIO DE CONFIRMAÇÃO VIA BROADCAST
    // ========================================================================
    
    private fun sendConfirmationBroadcast(confirmationId: String, status: String): Boolean {
        return try {
            // URI de confirmação conforme documentação PayGo
            val confirmationUri = Uri.Builder()
                .scheme("app")
                .authority("confirmation")
                .appendPath("confirmation")
                .appendQueryParameter("confirmationTransactionId", confirmationId)
                .appendQueryParameter("transactionStatus", status)
                .build()
            
            Log.d(TAG, "[BROADCAST] URI: $confirmationUri")
            
            val intent = Intent().apply {
                action = ACTION_CONFIRMATION
                putExtra("uri", confirmationUri.toString())
                addFlags(Intent.FLAG_INCLUDE_STOPPED_PACKAGES)
            }
            
            context.sendBroadcast(intent)
            Log.i(TAG, "[BROADCAST] ✅ Enviado: $status")
            true
        } catch (e: Exception) {
            Log.e(TAG, "[BROADCAST] ❌ Erro: ${e.message}")
            false
        }
    }
    
    // ========================================================================
    // PERSISTÊNCIA (SharedPreferences)
    // ========================================================================
    
    private fun storePending(pendente: TransacaoPendente) {
        prefs.edit()
            .putString("pending_transaction", pendente.toJson().toString())
            .apply()
    }
    
    private fun getStoredPending(): TransacaoPendente? {
        val json = prefs.getString("pending_transaction", null) ?: return null
        return try {
            TransacaoPendente.fromJson(JSONObject(json))
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao recuperar pendência: ${e.message}")
            null
        }
    }
    
    /**
     * Limpa dados de pendência
     * IMPORTANTE: Chamar SOMENTE após confirmação/desfazimento bem-sucedido
     */
    fun clearPending() {
        prefs.edit()
            .remove("pending_transaction")
            .apply()
        Log.i(TAG, "[CLEAR] ✅ Pendência limpa")
    }
}
