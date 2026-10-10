# Auditoria (somente leitura) — PIX Sicoob/PayGo intermitente no totem

Nenhum arquivo foi alterado. Base: estado atual + commits de 30/09 (8476a277, e162d590, 5a5f4b3a, e4659e9e), 01/10 (3aaf9c0d) e 07/10 (13988c8e, 4ebeea09, bcbd5cda, 0a9798a5).

## 1. O que mudou (comprovado pelos diffs)

| Data | Arquivo | Mudança |
|---|---|---|
| 30/09 | useTEFAndroid.ts | cooldown pós-confirmação 7000 para 2000 ms; warm-up 1500 para 300 ms; espera após pendência 8000 para 3000 ms; removido "Método 4" (`TEF.confirmarTransacao('', 'CONFIRMADO_AUTOMATICO')` preventivo) |
| 30/09 | useTEFPaymentResult.ts | janela de aceitação do resultado no storage 60 s para 600 s; nova chave `tef_active_payment` (TTL 10 min) para retomar após recarga |
| 30/09 | TotemPaymentPix.tsx | finalização (`runFinalize`) dispara ao aprovar, sem depender da tela de comprovante |
| 01/10 | TotemReceiptOptionsModal | contagem de 10 s (só a tela de comprovante) |
| 07/10 | TotemPaymentPix.tsx | `enabled: paymentStarted` (antes `paymentStarted && processing`); vigia JS: 20 s após voltar à tela sem resultado, ou 5 min, mostra "Pix não realizado"; "cancelado" não zera mais `paymentStarted` |
| 07/10 | useTEFPaymentResult.ts | `processedRef` só trava em "aprovado" (aceitar aprovação depois de cancelado) |
| 07/10 | PayGoService.kt | vigia nativo de 150 s: traz o totem para frente e envia `status=cancelado, codigoErro=PIX_TIMEOUT`, mantendo o callback para uma aprovação tardia |

## 2. Achados comprovados pelo código

**A. Duas confirmações para cada aprovação.**
- Nativo: `PayGoService.kt` (cerca da linha 694) envia `sendConfirmation(confirmationId, "CONFIRMADO_AUTOMATICO")` quando `transactionResult=0`, `requiresConfirmation` e `!pendingExists`.
- Frontend: `useTEFAndroid.ts` (cerca da linha 248) chama de novo `confirmarTransacaoTEF(confId, 'CONFIRMADO_AUTOMATICO')`. Isso vai para `TEFBridge.confirmarTransacao`, que chama o mesmo `sendConfirmation`.
- Resultado: pelo menos 2 broadcasts por aprovação. O comentário do código diz que a confirmação é "idempotente", mas nada no repositório documenta isso. Não está verificado.

**B. A deduplicação de resultados no frontend dura só 3 s.**
- `globalLastProcessedResult` (chave NSU + autorização) é apagada após 3000 ms.
- O resultado chega ao JS por mais de um caminho nativo: `MainActivity.kt` faz várias tentativas de `window.onTefResultado` (por volta da linha 427) e `TEFBridge.kt` também chama (linha 728).
- Se uma entrega repetida chegar depois de 3 s, o frontend processa de novo: dispara uma confirmação extra e grava outro CustomEvent/storage.
- `useTEFPaymentResult` bloqueia a segunda aprovação, porque `processedRef` trava em "aprovado". A confirmação extra, porém, já foi enviada.
- Que entregas repetidas realmente aconteçam após 3 s é hipótese (depende dos logs do tablet). A falta de proteção está comprovada.

**C. Aprovação tardia descartada depois do vigia nativo (falha real e comprovada).**
Sequência:
1. Após 150 s, o vigia nativo envia "cancelado".
2. `useTEFAndroid` processa, chama `setIsProcessing(false)` e `globalResultCallback = null`.
3. Se a PayGo aprovar depois, o nativo confirma o pagamento (o callback foi mantido de propósito) e entrega a aprovação ao JS.
4. Mas `useTEFAndroid.ts` linha 160 (`if (!processingRef.current && !globalResultCallback) return;`) descarta o resultado. Não há CustomEvent nem storage, então `useTEFPaymentResult` nunca vê a aprovação.

Efeito: o Pix fica cobrado e confirmado na PayGo, o totem mostra "Pix não realizado" e a venda não é finalizada. A promessa de 07/10 ("aprovações atrasadas ainda são aceitas") vale para o vigia JS de 20 s e 5 min, que não mexe em `isProcessing`. Não vale para o vigia nativo.

**D. `tef_active_payment` sobra no aparelho.**
- É gravado quando o hook é ativado e só é removido quando um resultado é processado.
- Cancelar pela tela (`handleCancelPayment`), sair após "Pix não realizado" ou falhar ao iniciar não remove a chave.
- Por até 10 min, qualquer tela que monte `useTEFPaymentResult` (Pix ou cartão de serviço, Pix de produto) entra como `resumed=true`, o que força `enabled` verdadeiro durante toda a vida da tela, ignorando o estado real.
- A chave não guarda qual venda estava em andamento.
- O risco é atenuado porque `iniciarPagamento` limpa `lastTefResult` no início de cada cobrança. Fica o risco de um resultado de outra cobrança ser atribuído à tela errada dentro dessa janela.

**E. O Pix de produto ficou para trás.**
- `TotemProductPaymentPix.tsx` usa `enabled: paymentStarted && isProcessing` e não tem o vigia de 07/10.
- Se a PayGo devolver "cancelado" e depois aprovar, ou não responder, essa tela continua com o comportamento antigo (tela parada, aprovação tardia ignorada).
- Ela também chama `TEF.resolverPendencia('CONFIRMADO_MANUAL')` num caminho próprio (cerca da linha 391).

**F. As mudanças de 30/09 nos tempos têm pouco efeito no fluxo normal.**
- O cooldown de 2 s só conta a partir de uma aprovação.
- Entre duas cobranças existe a tela de comprovante (10 s) mais a navegação, então os 7 s antigos já seriam cumpridos de qualquer jeito.
- O warm-up de 0,3 s e a espera de 3 s após pendência só valem na abertura da cobrança.
- Nada no código liga esses valores ao travamento do QR Code, que acontece dentro do app da PayGo.

## 3. Hipóteses (não comprovadas)

- H1: as confirmações duplicadas (A e B) atrapalham a PayGo ou o Sicoob. Sem documentação da PayGo, não dá para afirmar.
- H2: a retirada da confirmação vazia preventiva mudou o comportamento do terminal. Não sabemos o que a PayGo faz com um id vazio.
- H3: o warm-up de 0,3 s é curto para o terminal. Não há evidência nos registros de 07/10 (dois Pix aprovados e um sem resposta).
- H4: o APK instalado no tablet já tem o vigia de 07/10. Pelo código não dá para saber, porque depende de recompilar e instalar o APK.
- Os códigos -2573, -2599 e 90 tratados em `isPendingTransactionError` não têm documentação no repositório. Não interpretei o significado deles.

## 4. Impossível corrigir sem APK

- O próprio travamento do QR Code e o estorno automático (dentro do app da PayGo e no Sicoob).
- A confirmação automática nativa e a regra `!pendingExists`.
- O tempo de 150 s e o conteúdo do aviso do vigia nativo.
- As entregas repetidas de `onTefResultado` pela `MainActivity` e pelo `TEFBridge`.
- Trazer o totem para frente quando a PayGo trava sem o vigia nativo instalado.

## 5. Plano mínimo, só no site publicado (sem APK)

Ordem do menor para o maior risco. Cada passo pode ser publicado e testado separadamente.

1. **Não descartar aprovação tardia (corrige C).** Em `useTEFAndroid`, guardar em memória e no aparelho o momento em que a última cobrança começou. Na linha 160, se o resultado for "aprovado" e essa cobrança tiver começado há menos de 10 min, propagar normalmente (CustomEvent + storage) mesmo com `isProcessing` falso. Os outros status continuam sendo ignorados como hoje.
2. **Uma confirmação por id no frontend (reduz A e B sem remover a rede de segurança).** Guardar os `confirmationTransactionId` já confirmados (últimos 20, por 30 min) e não reenviar o mesmo id. A primeira confirmação do frontend continua existindo, porque não há documentação para dizer que podemos tirá-la. Também estender a deduplicação de resultados aprovados para usar a mesma lista (NSU + autorização), em vez de só 3 s.
3. **Higiene do `tef_active_payment` (corrige D).** Gravar `{ts, vendaId, tela}` e só retomar na mesma venda. Remover a chave no cancelamento pela tela, ao sair por "Escolher outra forma de pagamento" e quando `iniciarPagamento` falhar. Não remover ao desmontar a tela, porque esse é justamente o caso da recarga.
4. **Igualar o Pix de produto ao de serviço (corrige E).** Usar `enabled: paymentStarted`, adicionar o mesmo vigia (20 s após voltar à tela e 5 min) com a mensagem "Pix não realizado" e manter `paymentStarted` após "cancelado".
5. **Registro de diagnóstico.** Gravar cada resultado recebido (fonte, status, NSU, se foi propagado ou descartado e por quê, se a confirmação foi enviada ou pulada) no log TEF já existente, para confirmar ou descartar H1 a H4 com dados reais do tablet.

Fora do plano, de propósito: alterar os tempos de cooldown ou warm-up, reintroduzir a confirmação vazia e remover a confirmação do frontend. Nada disso tem evidência.

## 6. Riscos

- Passo 1: uma aprovação que chegue sem a tela de Pix aberta seria ignorada pela tela atual, porque `useTEFPaymentResult` exige `enabled`. Não há cobrança dupla, porque nada é confirmado de novo além da rede de segurança do passo 2.
- Passo 2: se a PayGo exigir de fato uma segunda confirmação (sem documentação), haveria regressão. Mitigação: só pulamos o reenvio do mesmo id. A primeira confirmação do frontend continua.
- Passo 3: se a chave for limpa no momento errado, a retomada após recarga é perdida. Os testes do item 7 cobrem isso.
- Passo 4: mudança de tela de pagamento de produtos. Precisa de teste no tablet.

## 7. Testes

- Unitários (jest, já configurado): deduplicação por id de confirmação; aprovação tardia propagada até 10 min depois do início e ignorada depois; chave `tef_active_payment` retomada só na mesma venda e removida no cancelamento.
- No tablet, com valores de R$ 0,01:
  - (a) Pix aprovado normal: confirma uma vez pelo frontend e finaliza.
  - (b) Deixar o QR Code expirar (vigia nativo, se instalado) e depois não pagar: aparece "Pix não realizado".
  - (c) Pix aprovado depois do aviso de tempo esgotado: a venda deve finalizar.
  - (d) Cancelar e abrir o cartão em seguida: não pode retomar o Pix.
  - (e) O mesmo roteiro no Pix de produto.
  - (f) Cartão de débito e crédito sem regressão.
- Conferir no log de diagnóstico (passo 5) quantas entregas e confirmações acontecem por transação.
