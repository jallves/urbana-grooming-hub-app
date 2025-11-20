# Sistema de Comissões de Produtos

## Visão Geral

O sistema de comissões de produtos no Costa Urbana permite que cada produto tenha sua própria configuração de comissão, diferente das comissões de serviços que são baseadas no barbeiro.

## Como Funciona

### 1. Configuração de Comissões no Cadastro de Produtos

Cada produto pode ter dois tipos de comissão configurados:

- **Comissão por Percentual (`commission_percentage`)**: Percentual sobre o valor total do produto
  - Exemplo: 15% de comissão sobre um produto de R$ 100,00 = R$ 15,00
  
- **Comissão por Valor Fixo (`commission_value`)**: Valor fixo por unidade vendida
  - Exemplo: R$ 5,00 de comissão por unidade vendida
  - Se vender 3 unidades = R$ 15,00 de comissão total

**Prioridade**: Se ambos estiverem configurados, o sistema usa **valor fixo** primeiro.

### 2. Fluxo de Vendas

As comissões de produtos são aplicadas em três cenários:

1. **Venda Direta no Totem** - Somente produtos
2. **Venda Casada no Checkout** - Serviços + Produtos
3. **Checkout de Agendamento** - Serviços com produtos adicionais

### 3. Migração Automática para ERP Financeiro

Quando uma venda é finalizada, o sistema automaticamente:

1. **Cria Conta a Receber** (receita)
   - Tipo: `revenue`
   - Categoria: `products`
   - Valor: Total do produto vendido

2. **Cria Conta a Pagar** (comissão do barbeiro)
   - Tipo: `commission`
   - Categoria: `products`
   - Subcategoria: `product_commission`
   - Valor: Calculado conforme configuração do produto
   - Status: `pending` (a pagar)

### 4. Regras de Comissão

#### Produto COM Comissão Configurada

```typescript
// Exemplo 1: Percentual
produto.commission_percentage = 15
produto.preco = 100
produto.quantidade = 2
// Comissão = (100 * 2) * 0.15 = R$ 30,00

// Exemplo 2: Valor Fixo
produto.commission_value = 5
produto.quantidade = 3
// Comissão = 5 * 3 = R$ 15,00
```

#### Produto SEM Comissão Configurada

```typescript
produto.commission_percentage = null
produto.commission_value = null
// Comissão = R$ 0,00
// ✅ Registro é criado mesmo assim
```

**IMPORTANTE**: Mesmo que o produto não tenha comissão configurada, o sistema SEMPRE cria o registro financeiro com valor R$ 0,00. Isso garante:
- Rastreabilidade completa
- Relatórios consistentes
- Auditoria financeira

### 5. Estrutura dos Registros Financeiros

#### Registro de Receita (Conta a Receber)
```json
{
  "transaction_type": "revenue",
  "category": "products",
  "description": "Venda de produto: Pomada Modeladora",
  "gross_amount": 100.00,
  "net_amount": 100.00,
  "status": "paid",
  "barber_id": "uuid-do-barbeiro",
  "client_id": "uuid-do-cliente",
  "metadata": {
    "product_id": "uuid-do-produto",
    "quantity": 2
  }
}
```

#### Registro de Comissão (Conta a Pagar)
```json
{
  "transaction_type": "commission",
  "category": "products",
  "subcategory": "product_commission",
  "description": "Comissão produto: Pomada Modeladora",
  "gross_amount": 15.00,
  "net_amount": 15.00,
  "status": "pending",
  "barber_id": "uuid-do-barbeiro",
  "notes": "15% sobre produto",
  "metadata": {
    "product_id": "uuid-do-produto",
    "product_name": "Pomada Modeladora",
    "commission_type": "percentage",
    "commission_percentage": 15,
    "base_amount": 100.00
  }
}
```

## Testando o Sistema

### 1. Configurar Comissão no Produto

No Painel Admin > Produtos:
1. Edite um produto
2. Configure `Comissão (%)` ou `Comissão (R$)`
3. Salve as alterações

### 2. Realizar Venda no Totem

1. Acesse o Totem
2. Faça check-in
3. Selecione um barbeiro
4. Adicione produtos ao carrinho
5. Finalize o pagamento

### 3. Verificar no ERP Financeiro

No Painel Admin > ERP Financeiro:

**Contas a Receber:**
- Deve aparecer a receita do produto
- Tipo: "Receita"
- Categoria: "Produtos"
- Status: "Pago"

**Contas a Pagar:**
- Deve aparecer a comissão do barbeiro
- Tipo: "Comissão"
- Categoria: "Produtos"
- Status: "Pendente"
- Valor: Conforme configuração do produto

### 4. Verificar Logs

Abra o console do navegador ou verifique os logs da edge function:

```
💰 Criando comissão de produto: {
  barber_id: "...",
  product: "Pomada Modeladora",
  type: "percentage",
  amount: 15
}
✅ Comissão de produto registrada: {
  id: "...",
  amount: 15,
  type: "percentage"
}
```

## Casos Especiais

### Produto sem Barbeiro

Se uma venda for feita sem barbeiro associado:
- ✅ Cria conta a receber normalmente
- ❌ NÃO cria conta a pagar (sem comissão)

### Produto com Desconto

```typescript
produto.preco = 100
produto.quantidade = 2
desconto = 20
// Base para comissão = (100 * 2) - 20 = R$ 180,00
```

### Múltiplos Produtos

Cada produto gera seus próprios registros:
- 1 conta a receber por produto
- 1 conta a pagar (comissão) por produto

## Perguntas Frequentes

**P: E se eu mudar a comissão do produto depois da venda?**
R: As vendas já finalizadas não são afetadas. A comissão registrada é a que estava configurada no momento da venda.

**P: Posso ter produtos sem comissão?**
R: Sim! Deixe ambos os campos zerados ou null. O sistema criará o registro com valor R$ 0,00.

**P: A comissão é paga automaticamente?**
R: Não. O registro fica com status "Pendente" no Contas a Pagar até ser manualmente marcado como pago.

**P: Como relatórios e dashboards tratam comissões zeradas?**
R: Incluem nos totais normalmente. Útil para rastreabilidade e análise de quais produtos geram mais comissão.

## Troubleshooting

### Comissão não aparece no ERP

Verifique:
1. ✅ Venda tem barbeiro associado?
2. ✅ Edge function `create-financial-transaction` foi executada?
3. ✅ Logs mostram criação da comissão?
4. ✅ Status da venda é "PAGA"?

### Valor da comissão está errado

Verifique:
1. Configuração atual do produto
2. Logs da edge function (mostra cálculo detalhado)
3. Se há descontos aplicados
4. Quantidade vendida

### Registro duplicado

- Pode ocorrer se houver retry da transaction
- Verifique logs de erro em `integration_error_logs`
- Sistema tem proteção contra duplicação

## Edge Functions Envolvidas

- `create-financial-transaction`: Cria todos os registros financeiros
- `totem-checkout`: Processa checkout de serviços + produtos
- `totem-direct-sale`: Processa venda direta de produtos
- `monitor-failed-transactions`: Reprocessa transações com erro

## Tabelas do Banco de Dados

- `painel_produtos`: Configuração de comissões
- `financial_records`: Receitas e comissões
- `transaction_items`: Detalhamento de itens
- `payment_records`: Registros de pagamento
- `barber_commissions`: Comissões dos barbeiros
- `vendas` / `vendas_itens`: Vendas do totem
