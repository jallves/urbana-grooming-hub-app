# Análise Completa do Sistema Totem V3

## Data: 30/12/2024

## Resumo Executivo

Análise completa do sistema de Totem para verificar a migração correta de todos os itens para o módulo financeiro ERP.

---

## ✅ ITENS FUNCIONANDO CORRETAMENTE

### 1. Checkout de Serviços (`totem-checkout` → `create-financial-transaction`)

| Item | Tabela ERP | Categoria | Tipo | Status |
|------|------------|-----------|------|--------|
| Serviço Principal | `financial_records` | `services` | `revenue` | ✅ Completo |
| Serviços Extras | `financial_records` | `services` | `revenue` | ✅ Completo |
| Comissão Serviço | `financial_records` | `staff_payments` | `commission` | ✅ Pendente |
| Comissão Serviço | `barber_commissions` | `service` | - | ✅ Pendente |

### 2. Produtos no Checkout

| Item | Tabela ERP | Categoria | Tipo | Status |
|------|------------|-----------|------|--------|
| Receita Produto | `financial_records` | `products` | `revenue` | ✅ Completo |
| Comissão Produto | `financial_records` | `products` | `commission` | ✅ Pendente |
| Comissão Produto | `barber_commissions` | `product` | - | ✅ Pendente |

### 3. Gorjeta (CORRIGIDO em V3)

| Item | Tabela ERP | Categoria | Subcategoria | Tipo | Status |
|------|------------|-----------|--------------|------|--------|
| Receita Gorjeta | `financial_records` | `tips` | `tip_received` | `revenue` | ✅ Completo |
| **Contas a Pagar Gorjeta** | `financial_records` | `tips` | `tip_payable` | `commission` | ✅ Pendente |
| Comissão Gorjeta | `barber_commissions` | `tip` | - | - | ✅ Pendente |

### 4. Venda Direta de Produtos (`totem-direct-sale`)

| Item | Tabela ERP | Categoria | Tipo | Status |
|------|------------|-----------|------|--------|
| Receita Produto | `financial_records` | `products` | `revenue` | ✅ Completo |
| Comissão Produto | `financial_records` | `products` | `commission` | ✅ Pendente |
| Comissão Produto | `barber_commissions` | `product` | - | ✅ Pendente |

---

## 🔧 CORREÇÕES IMPLEMENTADAS (V3)

### 1. Gorjeta - Lançamento de Contas a Pagar

**Problema**: A gorjeta estava sendo registrada apenas como receita, sem criar o lançamento de contas a pagar para o barbeiro.

**Solução Implementada** (`create-financial-transaction/index.ts`):

```javascript
// Antes: Apenas 1 registro (receita)
// Depois: 2 registros (receita + contas a pagar)

// 1. Receita da gorjeta (entrada de dinheiro)
{
  transaction_type: 'revenue',
  category: 'tips',
  subcategory: 'tip_received',
  status: 'completed',
  description: 'Gorjeta recebida'
}

// 2. Contas a Pagar (100% para o barbeiro)
{
  transaction_type: 'commission',
  category: 'tips',
  subcategory: 'tip_payable',
  status: 'pending',
  description: 'Gorjeta a pagar ao barbeiro'
}
```

---

## 📊 FLUXO COMPLETO DE DADOS

### Checkout de Serviços com Extras, Produtos e Gorjeta

```
┌──────────────────────────────────────────────────────────────────┐
│                    TOTEM CHECKOUT                                  │
├──────────────────────────────────────────────────────────────────┤
│  1. Cliente faz check-in                                          │
│  2. Barbeiro adiciona serviços extras (opcional)                  │
│  3. Cliente adiciona produtos (opcional)                          │
│  4. Cliente adiciona gorjeta (opcional)                           │
│  5. Cliente escolhe forma de pagamento                            │
│  6. Pagamento aprovado                                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              totem-checkout (action: finish)                       │
├──────────────────────────────────────────────────────────────────┤
│  1. Atualiza totem_payments → 'completed'                         │
│  2. Atualiza totem_sessions → 'completed'                         │
│  3. Atualiza vendas → 'PAGA'                                      │
│  4. Busca vendas_itens (serviços + produtos)                      │
│  5. Chama create-financial-transaction                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              create-financial-transaction                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  PARA CADA SERVIÇO:                                                │
│  ├── financial_records (revenue, services)                         │
│  ├── transaction_items                                             │
│  ├── payment_records                                               │
│  ├── financial_records (commission, staff_payments)                │
│  └── barber_commissions (type: service)                            │
│                                                                    │
│  PARA CADA PRODUTO:                                                │
│  ├── financial_records (revenue, products)                         │
│  ├── transaction_items                                             │
│  ├── payment_records                                               │
│  ├── financial_records (commission, products)                      │
│  ├── barber_commissions (type: product)                            │
│  └── decrease_product_stock (estoque)                              │
│                                                                    │
│  PARA GORJETA (se > 0):                                            │
│  ├── barber_commissions (type: tip, 100%)                          │
│  ├── financial_records (revenue, tips/tip_received)      ← RECEITA │
│  ├── payment_records                                               │
│  └── financial_records (commission, tips/tip_payable)  ← A PAGAR   │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📋 TABELAS FINANCEIRAS UTILIZADAS

### 1. `financial_records` - Transações Financeiras Principais

| Campo | Descrição |
|-------|-----------|
| `transaction_type` | `revenue`, `commission`, `expense` |
| `category` | `services`, `products`, `tips`, `staff_payments` |
| `subcategory` | `service`, `product`, `tip_received`, `tip_payable` |
| `status` | `completed`, `pending` |
| `barber_id` | ID do barbeiro relacionado |
| `appointment_id` | ID do agendamento (se aplicável) |

### 2. `barber_commissions` - Comissões dos Barbeiros

| Campo | Descrição |
|-------|-----------|
| `commission_type` | `service`, `product`, `tip` |
| `item_name` | Nome do serviço/produto/Gorjeta |
| `amount` | Valor da comissão |
| `commission_rate` | Taxa (%) da comissão |
| `status` | `pending`, `paid` |

### 3. `transaction_items` - Itens das Transações

| Campo | Descrição |
|-------|-----------|
| `item_type` | `service`, `product` |
| `source_table` | `painel_servicos`, `painel_produtos` |

### 4. `payment_records` - Registros de Pagamento

| Campo | Descrição |
|-------|-----------|
| `payment_method` | `pix`, `credit_card`, `debit_card`, `cash` |
| `status` | `paid`, `pending` |

---

## ✅ CHECKLIST FINAL

- [x] Serviço principal → financial_records (receita)
- [x] Serviço principal → comissão em financial_records (pendente)
- [x] Serviço principal → barber_commissions (pendente)
- [x] Serviços extras → financial_records (receita) com isExtra
- [x] Serviços extras → comissão em financial_records (pendente)
- [x] Serviços extras → barber_commissions (pendente)
- [x] Produtos → financial_records (receita)
- [x] Produtos → comissão baseada no produto (% ou fixo)
- [x] Produtos → barber_commissions (pendente)
- [x] Produtos → atualização de estoque
- [x] Gorjeta → barber_commissions (100%, pendente)
- [x] Gorjeta → financial_records RECEITA (tip_received, completed)
- [x] Gorjeta → financial_records CONTAS A PAGAR (tip_payable, pending)
- [x] Todos os pagamentos registrados em payment_records
- [x] Venda direta de produtos com barbeiro_id

---

## 📌 OBSERVAÇÕES IMPORTANTES

1. **Idempotência**: O sistema verifica registros existentes antes de criar novos para evitar duplicatas.

2. **Comissões de Produtos**: São calculadas baseadas na configuração individual de cada produto:
   - `commission_value`: Valor fixo por unidade
   - `commission_percentage`: Percentual sobre o valor

3. **Comissões de Serviços**: Baseadas na taxa do barbeiro (padrão 40%).

4. **Gorjetas**: 100% vai para o barbeiro, com lançamento duplo:
   - Receita (entrada de dinheiro)
   - Contas a Pagar (saída para o barbeiro)

5. **Estoque**: Atualizado automaticamente apenas no backend para evitar duplicação.
