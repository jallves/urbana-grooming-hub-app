## Objetivo

Adicionar **pagamento múltiplo (split)** nos dois checkouts do totem (serviços e produtos) e ajustar o fluxo de produtos para **só pedir barbeiro quando houver produto de cosmético** (produto que gera comissão). Integração completa e correta com o ERP financeiro.

---

## 1. Multi-pagamento (checkout de serviço e de produto)

### UX (didática, mobile-first)
Na tela de seleção de forma de pagamento, além dos botões atuais (Dinheiro, Débito, Crédito, PIX), adicionar um card **"Pagamento Múltiplo"**. Ao selecionar:

1. Tela mostra o **Total** grande no topo e o **Saldo restante** em destaque (atualiza em tempo real).
2. Lista de "parcelas" adicionadas (ex.: `R$ 50,00 — Dinheiro ✕`).
3. Botão **"+ Adicionar forma de pagamento"** abre um seletor: método (Dinheiro/Débito/Crédito/PIX) + valor (teclado numérico grande, com atalhos "50%", "Restante").
4. Validações: soma nunca ultrapassa o total; só permite finalizar quando `saldo restante = 0`; mínimo R$ 0,01 por parcela; permite remover parcela.
5. Botão **"Finalizar pagamento"** executa cada parcela em sequência:
   - Dinheiro → registra direto.
   - Débito/Crédito → chama PayGo TEF com o valor da parcela.
   - PIX → gera QR do valor da parcela (fluxo atual PayGo PIX).
   - Se qualquer parcela falhar, mostra erro claro ("Parcela 2 de 3 recusada"), permite tentar de novo ou remover, sem perder as parcelas já aprovadas.

Toda a UI segue o padrão urbana-black/urbana-gold, botões ≥ 56px de altura, texto ≥ 18px, layout `100dvh` no mobile.

### Dados / migração ERP

Novo shape de payment enviado ao backend:

```ts
payments: [
  { method: 'cash' | 'debit' | 'credit' | 'pix', amount: number, transaction_data?: {...} }
]
```

- **Compatibilidade**: se `payments.length === 1`, backend continua se comportando como hoje (um único `payment_method`).
- **Split**: para cada parcela, o backend cria **1 linha em `financial_records`** (transaction_type = `service_payment` ou `product_sale`) com `payment_method` e `amount` corretos, todas vinculadas ao mesmo `venda_id`. Isso garante que o ERP financeiro e os relatórios por forma de pagamento continuem exatos.
- `vendas.payment_method` recebe `"split"` quando houver mais de uma forma, e um campo novo `vendas.payment_breakdown` (JSONB) guarda o detalhamento. Migração cria a coluna (nullable, default null) — mudança aditiva, não quebra nada.
- Comissão do barbeiro (serviço/cosmético) segue calculada pelo **total da venda**, não pelas parcelas — a divisão é só financeira.

Edge functions afetadas:
- `totem-checkout` (finish) — aceita `payments[]`, itera e grava múltiplos `financial_records`.
- `totem-direct-sale` — mesma coisa.
- `create-financial-transaction` — aceita `payments[]` opcional; se vier, cria N registros.

---

## 2. Checkout de produto: barbeiro só p/ cosméticos

### Regra
- Categoria do produto (`painel_produtos.categoria`) define se é cosmético.
- Cosmético = qualquer categoria que **não** esteja em `['bebida','bebidas','refrigerante','cerveja','agua','água','consumo','snack','lanche']` (lista configurável no código, `CONSUMABLE_CATEGORIES`).
- Regra prática pedida pelo usuário: **cosmético → precisa barbeiro (gera comissão); consumo → não precisa barbeiro (não gera comissão)**.

### Fluxo ajustado (`TotemProductSale` → `TotemProductBarberSelect` → `TotemProductCheckout`)
- Após montar o carrinho, calcular `requiresBarber = cartItems.some(item => isCosmetic(item.product))`.
- Se `requiresBarber === false` → **pula** a tela `TotemProductBarberSelect` e vai direto para pagamento, com `barber_id = null`.
- Se `requiresBarber === true` → mantém a tela atual de seleção de barbeiro. A comissão é aplicada só nos itens cosméticos do carrinho (itens de consumo entram como `commission = 0`).
- No `totem-direct-sale`: por item, se produto é consumo → `barber_commissions` **não** é criado; se cosmético e há `barber_id` → cria comissão de 10% (regra atual). Se um pedido misto for feito, ainda pede barbeiro (pelos cosméticos) e os itens de consumo simplesmente não geram comissão.

### UI
Mensagem clara na tela de carrinho quando não precisa barbeiro: *"Produtos de consumo — não é necessário selecionar barbeiro."*

---

## 3. Detalhes técnicos

- Novo componente compartilhado `src/components/totem/MultiPaymentPanel.tsx` usado pelos dois checkouts.
- Novo hook `src/hooks/totem/useSplitPayment.ts` centraliza estado das parcelas, validações de soma, e a execução sequencial (com integração PayGo já existente em `tefDriver`).
- Helper `src/lib/products/isConsumableProduct.ts` com a lista `CONSUMABLE_CATEGORIES` e função `isCosmetic(product)`.
- Migração Supabase:
  - `ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS payment_breakdown JSONB;`
  - Sem novas policies — a coluna herda RLS existente da tabela.
- Zero mudança em: layout dos totens fora dessas telas, cronjobs, comissões de serviço, PayGo driver, relatórios (eles leem `financial_records` que já será populado corretamente por parcela).

---

## 4. Testes manuais que vou rodar depois

1. Serviço R$ 100 → 60 dinheiro + 40 débito → verifica que ERP mostra 2 lançamentos, venda total R$ 100, comissão do barbeiro correta sobre 100.
2. Produto cosmético (Pomada) R$ 40 → pede barbeiro → paga 20 PIX + 20 crédito → comissão 10% de 40 gerada.
3. Produto consumo (Coca) R$ 8 → **não** pede barbeiro → paga tudo dinheiro → sem comissão.
4. Carrinho misto (Pomada + Coca) → pede barbeiro → comissão só sobre a pomada.
5. Falha simulada em uma parcela do split → estado preservado, permite retentar.

---

## Arquivos que serão criados / editados

**Novos**
- `src/components/totem/MultiPaymentPanel.tsx`
- `src/hooks/totem/useSplitPayment.ts`
- `src/lib/products/isConsumableProduct.ts`
- 1 migração Supabase (coluna `payment_breakdown`)

**Editados**
- `src/pages/Totem/TotemCheckout.tsx` (serviço — adiciona opção "Múltiplo")
- `src/pages/Totem/TotemProductCheckout.tsx` (produto — adiciona opção "Múltiplo")
- `src/pages/Totem/TotemProductSale.tsx` (skip barbeiro se não cosmético)
- `src/pages/Totem/TotemProductBarberSelect.tsx` (idem, redirect)
- `supabase/functions/totem-checkout/index.ts`
- `supabase/functions/totem-direct-sale/index.ts`
- `supabase/functions/create-financial-transaction/index.ts`

Aprovando isso, executo tudo em uma sequência, com migração primeiro e código depois.