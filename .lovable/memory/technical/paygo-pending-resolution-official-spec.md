# Memory: technical/paygo-pending-resolution-official-spec
Updated: now

## Documentação Oficial PayGo (GitHub mobile-integracao-uri)

### Implementação v1.5.0 - Uso de URI Original

A partir desta versão, o APK **salva e usa a URI original** do `TransacaoPendenteDados` conforme documentação oficial.

### Fluxo Correto de Resolução de Pendência

1. **Captura**: O PayGo retorna `TransacaoPendenteDados` como extra no Intent de resposta
2. **Salvamento**: A URI é salva **exatamente como recebida** em `original_pending_uri`
3. **Resolução**: No broadcast, usa-se a **URI original diretamente** (prioridade 1) ou reconstruída (fallback)

### Código Oficial (MainActivity.java - GitHub PayGo)
```java
transacaoPendente = intent.getStringExtra("TransacaoPendenteDados");
if (transacaoPendente != null) {
    Intent transacao = startConfirmacao(transacaoPendente); // USA URI DIRETAMENTE!
    transacao.putExtra("Confirmacao", "app://resolve/confirmation?transactionStatus=CONFIRMADO_AUTOMATICO");
    this.sendBroadcast(transacao);
}
```

### Implementação Atual no APK (PayGoService.kt)

#### savePendingDataFromUri()
```kotlin
fun savePendingDataFromUri(pendingDataUri: String) {
    // CRÍTICO: Salvar URI original primeiro
    originalPendingUri = pendingDataUri
    
    // Persistir em SharedPreferences
    prefs.edit()
        .putString("original_pending_uri", pendingDataUri)  // ← URI original
        .putString("pending_data", lastPendingData.toString())
        .apply()
}
```

#### resolvePendingWithFullData()
```kotlin
private fun resolvePendingWithFullData(...) {
    // PRIORIDADE 1: Usar URI ORIGINAL
    val savedOriginalUri = prefs.getString("original_pending_uri", null)
    
    val pendingUriToUse = if (!savedOriginalUri.isNullOrEmpty()) {
        savedOriginalUri  // ← Usa URI original!
    } else {
        // Fallback: Reconstruir
        Uri.Builder().scheme("app")...build().toString()
    }
    
    val intent = Intent().apply {
        action = ACTION_CONFIRMATION
        putExtra("uri", pendingUriToUse)
        putExtra("Confirmacao", confirmationUri)
    }
    context.sendBroadcast(intent)
}
```

### Resposta do Callback

A resposta agora inclui informação sobre qual método foi usado:
```json
{
  "status": "resolvido",
  "metodo": "URI_ORIGINAL_TransacaoPendenteDados",  // ou "URI_RECONSTRUIDA_fallback"
  "usouUriOriginal": true,
  "uriEnviada": "app://resolve/pendingTransaction?..."
}
```

### Parâmetros Obrigatórios (seção 3.3.4)
| Parâmetro | Presença | Descrição |
|-----------|----------|-----------|
| providerName | M | Provedor da transação pendente |
| merchantId | M | ID do estabelecimento |
| localNsu | M | NSU local da transação pendente |
| transactionNsu | M | NSU do servidor TEF |
| hostNsu | M | NSU do provedor |

### Versão do APK
Esta implementação requer **APK v1.5.0 ou superior**.
