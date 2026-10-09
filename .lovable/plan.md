# Planos e Assinaturas: nova regra + checkout online (Stripe)

## Novas regras do plano
- Validade de **365 dias** a partir da contratação, sem cobrança mensal.
- **Créditos:** Corte = 1, Barba = 1, Corte e Barba = 2 (1 crédito por serviço).
- **Renovação:** só depois de usar todos os créditos. Enquanto houver saldo, o botão de compra fica bloqueado.
- **Vencimento:** após 365 dias, o saldo não usado expira e o cliente pode comprar de novo.
- **Pessoal e intransferível:** os créditos só valem em agendamentos do próprio titular, no painel do cliente, no totem e no painel administrativo.

## O que o cliente vai ver (painel do cliente)
- Nova aba **"Planos"** com cards dos planos ativos: preço, créditos, serviços incluídos e validade de 1 ano.
- Botão **"Assinar"**, que abre o pagamento seguro da Stripe (cartão e Pix), dentro do próprio painel.
- Depois do pagamento aprovado, o plano é ativado automaticamente e aparece o saldo: "X de Y créditos, válido até dd/mm/aaaa".
- No agendamento, a opção **"Usar créditos do plano"** mostra quantos créditos serão consumidos (ex.: Corte e Barba = 2).

## O que o administrador vai ver
- Os planos passam a ser anuais. O campo de período vira "Anual (365 dias)".
- A lista de assinantes mostra o saldo de créditos, a data de vencimento e a origem da venda (online ou balcão).
- As vendas online entram sozinhas no financeiro (contas a receber, categoria Assinatura, forma de pagamento), sem lançamento manual.
- As assinaturas mensais atuais são convertidas: validade de 365 dias a partir da data de início, mantendo os créditos restantes.

## Segurança
- O preço e os créditos são definidos só no servidor. O cliente nunca envia o valor.
- A ativação do plano acontece só pela confirmação assinada da Stripe, nunca pela tela de "sucesso".
- O mesmo pagamento nunca ativa dois planos.
- O consumo de créditos é feito no servidor, numa operação travada, e confere:
  - se a assinatura pertence ao cliente do agendamento;
  - se há saldo e se o plano está dentro da validade;
  - se o serviço está coberto pelo plano.
- O cliente só lê as próprias assinaturas e não consegue alterar créditos, status ou datas diretamente.
- Cada compra, ativação, uso e estorno fica registrado na auditoria.
- Reembolso ou contestação na Stripe suspende o plano automaticamente.

## Detalhes técnicos
- **Pagamentos:** integração de pagamentos da Stripe embutida no Lovable (sem chave própria; primeiro checar elegibilidade com a recomendação de provedor). Os produtos Stripe são criados a partir de `subscription_plans`, com pagamento único (não recorrente).
- **Banco de dados (migration):**
  - `client_subscriptions`: novas colunas `expires_at`, `source` (online/balcao), `stripe_session_id` (único), `stripe_payment_intent`.
  - `subscription_plans`: nova coluna `stripe_price_id`; `billing_period` passa a 'annual'.
  - Trigger que bloqueia nova assinatura ativa enquanto houver créditos restantes e o plano estiver válido.
  - RPC `consume_subscription_credits(p_appointment_id, p_service_ids)` SECURITY DEFINER, com `FOR UPDATE`, validação de titular (`cliente_id` do agendamento = `client_id` da assinatura), validade e cobertura; insere em `subscription_usage`.
  - Remover os UPDATEs diretos de `credits_used` pelo cliente/anon; RLS somente de leitura para o titular.
  - Cron diário que marca `expired` quando `expires_at < now()`.
- **Edge functions:**
  - `create-plan-checkout`: valida o JWT, resolve o `painel_clientes` do usuário, checa a elegibilidade e cria a sessão de checkout com metadata (client_id, plan_id).
  - Webhook da Stripe: verifica a assinatura e trata `checkout.session.completed` (ativa o plano, grava `subscription_payments` e `contas_receber`) e `charge.refunded`/`charge.dispute.created` (suspende o plano), de forma idempotente por `stripe_session_id`.
- **Front-end:**
  - `useClientSubscriptionCredits` passa a usar o RPC.
  - `check-subscription-renewals` deixa de usar o ciclo mensal e passa a avisar 30 e 7 dias antes do vencimento.
  - Página de planos no painel do cliente.
  - Ajustes em `useClientSubscriptions`/`useSubscriptionPlans` e no módulo admin.
- **Testes:** um teste por regra:
  - Corte = 1, Barba = 1, Corte e Barba = 2;
  - renovação bloqueada com saldo maior que 0;
  - validade de 365 dias;
  - uso por outro cliente rejeitado.
