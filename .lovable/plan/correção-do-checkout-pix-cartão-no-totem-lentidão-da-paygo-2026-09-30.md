# Correção do checkout PIX/Cartão no Totem + lentidão da PayGo

## Diagnóstico (caso 29/09 15h — R$ 128,00)

- A venda está correta: Corte e Barba R$ 110 + Energético R$ 18 = R$ 128, forma PIX, status "pendente".
- Nenhum resultado da maquininha chegou ao sistema: não existe registro de pagamento para essa venda. O PIX foi aprovado na PayGo (confirmado pelo comprovante Sicoob às 16:03:33), mas o totem não recebeu a aprovação ou a descartou.

### Causas encontradas no código

1. **A finalização depende da tela de comprovante.** Os lançamentos (venda paga, comissão, financeiro, agendamento concluído) só são feitos depois que alguém escolhe "imprimir / e-mail / sem comprovante". Se essa tela fica parada ou é fechada, nada é salvo.
2. **Aprovação descartada se demorar.** O totem ignora aprovações com mais de 60 segundos e para de esperar depois de 3 minutos. No PIX o cliente costuma demorar para ler o QR Code, então a aprovação chega depois do limite e é perdida.
3. **Aprovação perdida quando a tela recarrega.** Quando o app da PayGo abre por cima, o Android pode recarregar a tela do totem. Ao voltar, o totem "esquece" que havia um pagamento em andamento e ignora a aprovação.
4. **Nenhum registro no servidor no momento da aprovação.** Por isso não há rastro para recuperar ou conferir depois.

### Por que demora para chamar a PayGo

Antes de toda cobrança o totem espera, somando:
- 7 s de "pausa" após a última transação;
- 1,5 s de aquecimento fixo;
- 8 s extras sempre que detecta "pendência anterior". Esse caso acontece com frequência, porque o próprio totem envia uma confirmação preventiva a cada cobrança.

Na prática, o cliente pode esperar de 9 a 17 segundos antes de a maquininha aparecer.

## O que será corrigido

1. **Salvar a aprovação imediatamente.** Assim que a PayGo aprovar (PIX, cartão, produto avulso), o totem grava o pagamento (NSU, autorização, valor) e finaliza o checkout na hora. A tela de comprovante passa a ser apenas opcional, depois.
2. **Pagamento em andamento guardado no aparelho.** Se a tela recarregar, o totem retoma o pagamento e processa a aprovação que chegar.
3. **Remover os limites curtos.** Aprovações válidas por até 10 minutos; espera máxima de 10 minutos para o PIX.
4. **Rede de segurança.** Se o totem estiver finalizando e perder a conexão, a finalização fica guardada e é refeita automaticamente (já existe a base; será ligada a esse novo fluxo).
5. **Chamada mais rápida da PayGo:**
   - pausa pós-transação de 7 s para 2 s;
   - aquecimento de 1,5 s para 0,3 s;
   - espera de 8 s só quando o terminal realmente informar pendência, e reduzida para 3 s;
   - remover a "confirmação preventiva" que provocava falsas pendências.
6. **Regularizar o caso de 29/09.** Finalizar a venda de R$ 128,00 como PIX, com o ID da transação do comprovante: lança o serviço, o energético, a comissão do barbeiro, o financeiro e baixa o estoque.

## Detalhes técnicos

- `TotemPaymentPix.tsx`, `TotemPaymentCard.tsx`, `TotemProductPaymentPix.tsx`, `TotemProductPaymentCard.tsx`: em `handleTEFResult` status `aprovado`, inserir em `totem_payments` e chamar `finalizeServiceCheckout` / `totem-direct-sale finish` antes de abrir o modal de comprovante; `handleReceiptComplete` só navega e envia o e-mail.
- `useTEFPaymentResult.ts`: janela de validade do resultado de 60 s para 600 s; persistir `tef_active_payment` (venda_id, tipo, início) em localStorage e habilitar o processamento no mount quando existir.
- `useTEFAndroid.ts`: `CONFIRMATION_COOLDOWN_MS` 7000 para 2000; warm-up 1500 para 300; cooldown de pendência 8000 para 3000, somente quando `canStartTransaction()`/`hasPendingTransaction()` indicar; remover o método 4 (`confirmarTransacao('')` preventivo).
- A regularização de 29/09 é feita via `totem-checkout` action `finish` com `transaction_data.nsu = E88894548202609291903 22EkT6zG9Br`.
