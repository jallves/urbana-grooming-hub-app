# Memory: technical/paygo-pending-resolution-official-spec
Updated: now

## Documentação Oficial PayGo (GitHub mobile-integracao-uri)

### Fluxo Correto de Resolução de Pendência

1. **Captura**: O PayGo retorna `TransacaoPendenteDados` como extra no Intent de resposta
2. **Formato**: Essa string JÁ É uma URI completa: `app://resolve/pendingTransaction?merchantId=xxx&providerName=xxx&hostNsu=xxx&localNsu=xxx&transactionNsu=xxx`
3. **Uso direto**: A documentação oficial mostra que essa URI deve ser usada **diretamente** no broadcast, sem reconstrução

### Código Oficial (MainActivity.java - GitHub PayGo)
```java
transacaoPendente = intent.getStringExtra("TransacaoPendenteDados");
if (transacaoPendente != null) {
    Intent transacao = startConfirmacao(transacaoPendente); // USA URI DIRETAMENTE!
    transacao.putExtra("Confirmacao", "app://resolve/confirmation?transactionStatus=CONFIRMADO_AUTOMATICO");
    this.sendBroadcast(transacao);
}
```

### Problema Potencial na Implementação Atual
O APK atual **reconstrói** a URI via Uri.Builder() em vez de usar a string original. Isso pode causar:
- Diferenças na ordem dos parâmetros
- Diferenças na codificação de caracteres
- SDK não reconhecendo a URI reconstruída

### Solução Recomendada
Modificar `PayGoService.kt` para:
1. **Salvar a URI original completa** do `TransacaoPendenteDados`
2. No broadcast de resolução, usar a **URI original** diretamente no extra "uri"
3. Manter fallback para reconstrução apenas quando a URI original não estiver disponível

### Parâmetros Obrigatórios (seção 3.3.4)
| Parâmetro | Presença | Descrição |
|-----------|----------|-----------|
| providerName | M | Provedor da transação pendente |
| merchantId | M | ID do estabelecimento |
| localNsu | M | NSU local da transação pendente |
| transactionNsu | M | NSU do servidor TEF |
| hostNsu | M | NSU do provedor |
