# 📊 ANÁLISE COMPLETA DO FLUXO DO TOTEM
**Data**: 09/11/2025
**Status**: ⚠️ PROBLEMAS CRÍTICOS ENCONTRADOS

---

## 🚨 PROBLEMAS CRÍTICOS

### 1. VENDAS FICANDO ABERTAS (CRÍTICO)
- **Severidade**: ALTA 🔴
- **Impacto**: Financeiro incorreto
- **Status Atual**: 3 vendas abertas no banco
```sql
-- Vendas com problemas:
venda_id: 7b8163d9-5d10-44cc-984b-db103c657b01 | status: ABERTA | session: checkout
venda_id: 4c818093-a663-457f-9f1b-a1bba81c6ad0 | status: ABERTA | session: checkout  
venda_id: 21f74a7d-6c6f-492b-b6b0-42813b72c007 | status: ABERTA | session: checkout
```

**Causa Raiz**: 
- Função `totem-checkout/finish` não é chamada corretamente
- Pagamentos diretos de produtos não atualizam vendas principais

**Solução**:
1. Garantir que TODOS os fluxos de pagamento chamem `totem-checkout/finish`
2. Adicionar webhook de confirmação de pagamento
3. Sistema de reconciliação automática

---

### 2. PRODUTOS SÓ SALVOS APÓS PAGAMENTO (ALTO RISCO)
- **Severidade**: ALTA 🔴
- **Impacto**: Perda de dados se pagamento falhar

**Arquivos Afetados**:
- `src/pages/Totem/TotemPaymentCard.tsx` (linhas 90-134)
- `src/pages/Totem/TotemPaymentPix.tsx` (linhas 90-134)

**Problema**:
```typescript
// ERRADO: Produtos só salvos DEPOIS do pagamento
const finalizePayment = async () => {
  // 1. Aprova pagamento
  // 2. DEPOIS salva produtos <- SE FALHAR AQUI?
}
```

**Solução**:
```typescript
// CORRETO: Salvar produtos ANTES do pagamento
const handlePaymentMethod = async () => {
  // 1. PRIMEIRO salva produtos na venda
  // 2. DEPOIS processa pagamento
  // 3. Se pagamento falhar, rollback
}
```

---

### 3. FALTA VALIDAÇÃO DE ESTOQUE
- **Severidade**: MÉDIA 🟡
- **Impacto**: Experiência do usuário ruim

**Localização**: `src/pages/Totem/TotemCheckout.tsx`

**Problema**:
- Cliente pode adicionar produto sem estoque
- Erro só aparece no pagamento

**Solução**:
```typescript
const handleAddProduct = async (productId: string) => {
  const product = availableProducts.find(p => p.id === productId);
  
  // ADICIONAR VALIDAÇÃO:
  if (existingProduct && existingProduct.quantidade >= product.estoque) {
    toast.error('Estoque insuficiente');
    return;
  }
}
```

---

### 4. SESSÕES ÓRFÃS SEM FINALIZAÇÃO
- **Severidade**: MÉDIA 🟡
- **Impacto**: Dados sujos no banco

**Problema**:
- Sessões ficam em `checkout` indefinidamente
- Não há sistema de timeout/limpeza

**Solução**:
1. Adicionar timeout nas telas de pagamento
2. Job de limpeza de sessões antigas:
```sql
-- Executar diariamente
UPDATE totem_sessions 
SET status = 'abandoned' 
WHERE status = 'checkout' 
AND updated_at < NOW() - INTERVAL '2 hours';
```

---

### 5. DOIS SISTEMAS DE VENDAS PARALELOS
- **Severidade**: ALTA 🔴
- **Impacto**: Dados fragmentados

**Problema**:
```
Sistema 1: vendas + vendas_itens (serviços + produtos)
Sistema 2: totem_product_sales + totem_product_sale_items (só produtos)
```

**Impacto**:
- Relatórios incompletos
- Comissões incorretas
- Estoque duplicado

**Solução**:
- **ELIMINAR** `totem_product_sales` 
- **USAR APENAS** `vendas` para TUDO
- Migrar dados existentes

---

### 6. COMISSÕES PODEM DUPLICAR
- **Severidade**: MÉDIA 🟡
- **Impacto**: Financeiro incorreto

**Problema em**: `supabase/functions/totem-checkout/index.ts` (linha 374-383)

```typescript
// FALTA VALIDAÇÃO:
await supabase
  .from('barber_commissions')
  .insert({ ... }) // <- Pode inserir duplicado!
```

**Solução**:
```typescript
// Verificar antes de inserir:
const { data: existing } = await supabase
  .from('barber_commissions')
  .select('id')
  .eq('appointment_id', session.appointment_id)
  .maybeSingle();

if (!existing) {
  await supabase
    .from('barber_commissions')
    .insert({ ... });
}
```

---

## ✅ FUNCIONALIDADES QUE FUNCIONAM BEM

1. ✅ Check-in por WhatsApp
2. ✅ Check-in por QR Code
3. ✅ Criação de sessões totem
4. ✅ Seleção de barbeiro e serviço
5. ✅ Adição de serviços extras
6. ✅ Simulação de pagamento (15s)
7. ✅ Atualização de estoque após pagamento
8. ✅ Interface responsiva e touch-optimized
9. ✅ Notificações realtime para barbeiros

---

## 📊 ESTATÍSTICAS DO BANCO

### Sessões Totem (últimas 5):
- **3 sessões** em estado `checkout` (órfãs)
- **1 sessão** finalizada corretamente (`completed`)

### Vendas:
- **3 vendas ABERTAS** com sessões em checkout
- **1 venda PAGA** corretamente
- **Taxa de sucesso**: 25% (1 de 4)

---

## 🎯 PRIORIDADES DE CORREÇÃO

### URGENTE (Fazer AGORA):
1. 🔴 Corrigir salvamento de produtos ANTES do pagamento
2. 🔴 Unificar sistemas de venda (eliminar totem_product_sales)
3. 🔴 Adicionar validação de comissão duplicada

### IMPORTANTE (Esta Semana):
4. 🟡 Adicionar validação de estoque em tempo real
5. 🟡 Sistema de limpeza de sessões órfãs
6. 🟡 Reconciliação de vendas abertas

### MELHORIAS (Próximo Sprint):
7. 🟢 Dashboard de monitoramento do totem
8. 🟢 Logs detalhados de transações
9. 🟢 Testes automatizados do fluxo completo

---

## 🔧 ARQUIVOS QUE PRECISAM CORREÇÃO

### Frontend:
- `src/pages/Totem/TotemCheckout.tsx` - Validação estoque
- `src/pages/Totem/TotemPaymentCard.tsx` - Salvar produtos antes
- `src/pages/Totem/TotemPaymentPix.tsx` - Salvar produtos antes
- `src/pages/Totem/TotemProductCheckout.tsx` - Unificar com vendas

### Backend:
- `supabase/functions/totem-checkout/index.ts` - Validação duplicatas
- Nova função: `clean-abandoned-sessions.ts`
- Nova função: `reconcile-open-sales.ts`

### Database:
- Migração: Unificar tabelas de vendas
- Trigger: Prevenir comissões duplicadas
- Job: Limpeza automática de sessões

---

## 📝 NOTAS TÉCNICAS

### Fluxo Ideal (Como DEVERIA Ser):
```
1. Check-in → Cria sessão
2. Checkout → Inicia venda (status: ABERTA)
3. Adiciona itens → Salva em vendas_itens IMEDIATAMENTE
4. Escolhe pagamento → Cria totem_payment
5. Aprova pagamento → Finaliza tudo de uma vez:
   - venda.status = PAGA
   - session.status = completed  
   - agendamento.status = FINALIZADO
   - Gera comissão (se não existir)
   - Atualiza estoque
```

### Fluxo Atual (Com Problemas):
```
1. Check-in → Cria sessão ✅
2. Checkout → Inicia venda ✅
3. Adiciona itens → Apenas em memória ⚠️
4. Escolhe pagamento → OK ✅
5. Aprova pagamento → Tenta salvar tudo ⚠️
   - Se falhar em qualquer passo = VENDA ABERTA 🔴
   - Pode duplicar comissões ⚠️
   - Estoque pode ficar inconsistente ⚠️
```

---

## 🎬 PRÓXIMOS PASSOS

1. **Revisar esta análise** com a equipe
2. **Priorizar** correções críticas
3. **Implementar** soluções propostas
4. **Testar** fluxo completo
5. **Monitorar** vendas e sessões
6. **Documentar** fluxo correto

---

**Analista**: AI Assistant  
**Ferramentas**: Supabase Query + Code Analysis  
**Método**: Análise estática + Dados em produção
