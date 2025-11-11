# 📊 Sistema de Fluxo de Caixa Integrado

## 🎯 Conceito

O **Fluxo de Caixa** agora é o **controlador central** de todas as movimentações financeiras da barbearia. Ele funciona como um espelho automático de todas as transações confirmadas, proporcionando visão completa e em tempo real do dinheiro que entra e sai do negócio.

## 🔄 Como Funciona

### 1. **Integração Automática**
- Quando uma **Conta a Receber** é marcada como "Recebida" → Registra automaticamente no Fluxo de Caixa como RECEITA
- Quando uma **Conta a Pagar** é marcada como "Paga" → Registra automaticamente no Fluxo de Caixa como DESPESA
- Quando uma **Comissão** é marcada como "Paga" → Registra automaticamente no Fluxo de Caixa como DESPESA

### 2. **Rastreabilidade Total**
Cada transação no Fluxo de Caixa possui:
- **reference_type**: Identifica a origem (`financial_record`)
- **reference_id**: ID do registro original em Contas a Receber/Pagar
- **Ícone visual**: Badge "📋 Origem: Contas a Receber/Pagar"

### 3. **Sem Duplicação**
O sistema verifica automaticamente se uma transação já foi sincronizada antes de criar nova entrada, evitando duplicatas.

## 📁 Estrutura do Sistema

```
ERP Financeiro (/admin/erp-financeiro)
├── Contas a Receber
│   ├── Nova Receita → Marca como "Recebida" → Sincroniza com Fluxo de Caixa
│   ├── Coluna "Fluxo Caixa" mostra status de sincronização
│   └── Dashboard com totais e pendências
│
├── Contas a Pagar
│   ├── Nova Despesa/Comissão → Marca como "Paga" → Sincroniza com Fluxo de Caixa
│   ├── Coluna "Fluxo Caixa" mostra status de sincronização
│   └── Dashboard com totais e pendências
│
└── Fluxo de Caixa (VISUALIZAÇÃO APENAS)
    ├── Dashboard: Métricas e resumos
    ├── Transações: Lista completa com filtros
    └── Relatórios: Performance mensal e anual
```

## 🚀 Funcionalidades

### ✅ No Fluxo de Caixa

#### Dashboard
- Resumo do mês atual (Receitas, Despesas, Saldo)
- Comparação com mês anterior
- Gráficos de evolução dos últimos 6 meses

#### Transações
- **Filtros avançados**:
  - Busca por descrição
  - Filtro por tipo (Receita/Despesa)
  - Filtro por categoria
  - Botão "Limpar Filtros"
- **Visualização detalhada**:
  - Ícones visuais (verde=receita, vermelho=despesa)
  - Tags de categoria e forma de pagamento
  - Badge de origem (mostra de onde veio a transação)
  - Observações quando disponíveis

#### Relatórios
- **Resumo Anual**: Receita, Despesa, Lucro total
- **Performance Mensal**: Últimos 12 meses com gráfico
- **Por Categoria**: Breakdown detalhado por tipo

### ✅ Nas Contas a Receber/Pagar

#### Nova Coluna "Fluxo Caixa"
- ✅ **Registrado**: Badge verde quando já sincronizado
- ➖ **Pendente**: Hífen quando ainda não pago/recebido

#### Sincronização Automática
- Ao marcar como "Pago" ou "Recebido"
- Toast de confirmação: "✅ Sincronizado com Fluxo de Caixa"
- Atualização automática de todas as métricas

## 🔧 Migração de Dados Existentes

### Botão "Migrar Dados Existentes"
Localizado no topo do ERP Financeiro, este botão:

1. **Busca** todos os registros já pagos/recebidos
2. **Verifica** quais ainda não estão no Fluxo de Caixa
3. **Cria** entradas automaticamente no Fluxo de Caixa
4. **Exibe** estatísticas:
   - Total de registros processados
   - Quantidade migrada
   - Quantidade que já existia (pulados)

**Quando usar:**
- Na primeira vez após implementação
- Se houver inconsistências nos dados
- Após correções manuais no banco

## 📊 Fluxo de Dados

```mermaid
graph LR
    A[Conta a Receber/Pagar] -->|Marca como Pago| B[Hook: useCashFlowSync]
    B -->|Verifica duplicação| C{Já existe?}
    C -->|Não| D[Cria no Fluxo de Caixa]
    C -->|Sim| E[Pula criação]
    D -->|Registra| F[cash_flow table]
    F -->|Atualiza| G[Dashboard & Relatórios]
```

## 🗂️ Estrutura do Banco de Dados

### Tabela: `cash_flow`
```sql
- id (uuid)
- transaction_type (income/expense)
- amount (numeric)
- description (text)
- category (text)
- payment_method (text)
- transaction_date (date)
- reference_type (text) → 'financial_record'
- reference_id (uuid) → ID do registro original
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### Tabela: `financial_records`
```sql
- id (uuid)
- transaction_type (revenue/expense/commission)
- status (pending/completed/canceled)
- gross_amount (numeric)
- net_amount (numeric)
- description (text)
- category (text)
- transaction_date (date)
- metadata (jsonb) → {payment_method, notes, etc}
```

## 🎨 Interface

### Cores do Sistema
- 🟢 **Verde**: Receitas, Entradas, Positivo
- 🔴 **Vermelho**: Despesas, Saídas, Negativo
- 🟡 **Amarelo**: Saldos, Totais, Destaque
- 🔵 **Azul**: Informações complementares
- 🟣 **Roxo**: Origem/Referências

### Responsividade
- **Mobile First**: Interface otimizada para telas pequenas
- **Scroll Horizontal**: Gráficos deslizam em mobile
- **Cards Empilhados**: Grid adapta-se ao tamanho
- **Filtros Colapsáveis**: Grid de filtros responsivo

## 📝 Arquivos Principais

### Hooks
- `src/hooks/financial/useCashFlowSync.ts` - Sincronização automática
- `src/hooks/financial/useMigrateFinancialRecords.ts` - Migração de dados

### Componentes
- `src/components/erp/ContasAReceber.tsx` - Contas a Receber
- `src/components/erp/ContasAPagar.tsx` - Contas a Pagar
- `src/components/erp/FinancialDashboard.tsx` - Dashboard principal
- `src/components/admin/cashflow/CashFlowManagement.tsx` - Container
- `src/components/admin/cashflow/CashFlowTransactions.tsx` - Lista de transações
- `src/components/admin/cashflow/CashFlowReports.tsx` - Relatórios

## 🔐 Regras de Negócio

1. **Fluxo de Caixa é SOMENTE LEITURA**
   - Não há botão "Nova Transação" no Fluxo de Caixa
   - Todas as entradas vêm de Contas a Receber/Pagar

2. **Sincronização Só Ocorre em Status "Completed"**
   - Pendentes não aparecem no Fluxo de Caixa
   - Apenas transações confirmadas são registradas

3. **Não Há Edição Direta no Fluxo de Caixa**
   - Para corrigir: editar na origem (Contas a Receber/Pagar)
   - Exclusão na origem remove do Fluxo de Caixa

4. **Categorias Consistentes**
   - Mesmas categorias em todos os módulos
   - Facilita análise e relatórios

## ✨ Melhorias Futuras Sugeridas

1. **Relatórios Avançados**
   - Comparativo previsto vs realizado
   - Projeção de fluxo futuro
   - Análise de tendências

2. **Alertas Inteligentes**
   - Aviso de contas próximas do vencimento
   - Alertas de fluxo negativo
   - Notificações de metas atingidas

3. **Exportação**
   - Excel com formatação
   - PDF de relatórios
   - Integração contábil

4. **Conciliação Bancária**
   - Importar extratos
   - Matching automático
   - Reconciliação assistida

## 🎓 Glossário

- **Contas a Receber**: Valores que a barbearia tem para receber de clientes
- **Contas a Pagar**: Valores que a barbearia tem para pagar (despesas, comissões)
- **Fluxo de Caixa**: Registro de todo dinheiro que realmente entrou/saiu
- **Sincronização**: Processo de copiar dados de um módulo para outro
- **Referência Cruzada**: Link entre registro original e registro no Fluxo de Caixa
