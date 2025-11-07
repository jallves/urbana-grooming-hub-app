# 📋 Fluxo Completo de Agendamento - Sistema Barbearia

## 🎯 Visão Geral

Este documento descreve o fluxo completo desde o agendamento do cliente até a finalização do serviço, incluindo geração de comissões e lançamentos financeiros.

---

## 📱 Fontes de Agendamento

### 1. **Painel do Cliente** (`/painel-cliente/agendar`)
- Cliente precisa estar logado
- Seleciona: Serviço → Barbeiro → Data → Hora
- Validação de horários disponíveis
- Confirmação com popup
- **Notificação Realtime** enviada ao barbeiro

### 2. **Totem de Atendimento** (`/totem`)
- Cliente busca por telefone
- Sistema localiza agendamentos confirmados
- Cliente visualiza lista de agendamentos
- Realiza check-in para o atendimento do dia

---

## 🔄 Fluxo Detalhado

### **ETAPA 1: Criação do Agendamento**

#### Painel Cliente:
```typescript
// src/pages/PainelClienteAgendar.tsx
supabase.rpc('create_painel_agendamento', {
  cliente_id, barbeiro_id, servico_id, data, hora
})
```

**Tabela:** `painel_agendamentos`
- Status inicial: `agendado` ou `confirmado`
- Campos: cliente_id, barbeiro_id, servico_id, data, hora

**Notificação Realtime:**
```typescript
channel.send({
  event: 'NEW_APPOINTMENT',
  payload: { cliente_nome, servico_nome, data, hora }
})
```

---

### **ETAPA 2: Check-in (Apenas Totem)**

**Local:** `/totem/appointments-list`

**Validações:**
- Horário deve estar dentro de 2h antes até 2h depois
- Status deve ser `agendado` ou `confirmado`
- Não pode ter check-in duplicado

**Edge Function:** `totem-checkin`
```typescript
POST /functions/v1/totem-checkin
Body: { agendamento_id, qr_token?, modo }
```

**Ações:**
1. Valida QR Code (se modo QR)
2. Atualiza `painel_agendamentos.status_totem` → `CHEGOU`
3. Cria `totem_sessions` (status: `check_in`)
4. Envia notificação Realtime ao barbeiro

**Resposta:**
```json
{
  "success": true,
  "session_id": "uuid",
  "agendamento": { id, cliente, barbeiro, servico, horario, status }
}
```

---

### **ETAPA 3: Checkout (Totem)**

**Local:** `/totem/checkout`

#### **3.1. Iniciar Checkout**

**Edge Function:** `totem-checkout` (action: start)
```typescript
POST /functions/v1/totem-checkout
Body: { 
  action: 'start',
  agendamento_id,
  session_id,
  extras?: [] 
}
```

**Ações:**
1. Busca agendamento completo
2. Busca/cria `vendas` (vinculada a `totem_session_id`)
3. Adiciona serviço principal + extras em `vendas_itens`
4. Calcula subtotal, desconto, total
5. Atualiza `totem_sessions.status` → `checkout`

**Resposta:**
```json
{
  "success": true,
  "venda_id": "uuid",
  "session_id": "uuid",
  "resumo": {
    "original_service": { nome, preco },
    "extra_services": [],
    "subtotal": 0,
    "discount": 0,
    "total": 0
  }
}
```

#### **3.2. Adicionar Serviços Extras**

**Tabela:** `appointment_extra_services`
```typescript
supabase.from('appointment_extra_services').insert({
  appointment_id,
  service_id
})
```

Após adicionar, recalcula checkout chamando `totem-checkout` (action: start) novamente.

---

#### **3.3. Finalizar Pagamento**

**Fluxos de Pagamento:**
- **PIX:** `/totem/payment-pix` → `payments-pix` edge function
- **Cartão:** `/totem/payment-card` → `payments-card` edge function

**Edge Function:** `totem-checkout` (action: finish)
```typescript
POST /functions/v1/totem-checkout
Body: { 
  action: 'finish',
  venda_id,
  session_id,
  payment_id
}
```

**Ações Executadas:**
1. Atualiza `totem_payments.paid_at`
2. Atualiza `totem_sessions.status` → `completed` + `check_out_time`
3. Atualiza `vendas.status` → `PAGA`
4. Atualiza `painel_agendamentos.status` → `FINALIZADO`
5. **Gera comissão** em `barber_commissions`
6. **Cria transação RECEITA** em `finance_transactions`
7. **Cria transação DESPESA (comissão)** em `finance_transactions`
8. Notifica barbeiro via Realtime

---

### **ETAPA 4: Finalização Manual (Admin)**

**Local:** Admin → Agendamentos Clientes → Botão "Finalizar Atendimento"

**Quando usar:**
- Agendamentos criados pelo Painel do Cliente
- Atendimentos sem check-in via totem
- Finalizações offline

**Edge Function:** `process-appointment-completion`
```typescript
POST /functions/v1/process-appointment-completion
Body: {
  agendamento_id,
  source: 'admin' | 'painel',
  completed_by: user_id
}
```

**Ações Executadas:**
1. Busca agendamento + serviços extras
2. Busca staff_id e commission_rate do barbeiro
3. Calcula total (serviço principal + extras)
4. Calcula comissão total
5. Atualiza `painel_agendamentos.status` → `FINALIZADO`
6. **Gera comissão** em `barber_commissions`
7. **Cria transação RECEITA** em `finance_transactions`
8. **Cria transação DESPESA (comissão)** em `finance_transactions`
9. Notifica barbeiro via Realtime

---

## 💰 Geração de Comissões

### **Tabela Correta:** `barber_commissions`

```sql
CREATE TABLE barber_commissions (
  id UUID PRIMARY KEY,
  barber_id UUID NOT NULL,           -- staff.id (não painel_barbeiros.id!)
  appointment_id UUID NOT NULL,       -- painel_agendamentos.id
  amount NUMERIC NOT NULL,            -- Valor da comissão
  commission_rate NUMERIC NOT NULL,   -- Taxa % do barbeiro
  status TEXT NOT NULL,               -- 'pending' ou 'paid'
  appointment_source TEXT,            -- 'totem' ou 'painel' ou 'admin'
  created_at TIMESTAMP,
  payment_date TIMESTAMP
)
```

### **Cálculo:**
```typescript
const commission_rate = staff.commission_rate || 50  // Padrão 50%
const service_price = servico.preco
const extras_total = extras.reduce((sum, e) => sum + e.preco, 0)
const total_amount = service_price + extras_total
const commission_amount = total_amount * (commission_rate / 100)
```

---

## 💵 Lançamentos Financeiros

### **Tabela:** `finance_transactions`

#### **Receita (Entrada):**
```typescript
{
  tipo: 'receita',
  categoria: 'servico',
  descricao: 'Atendimento finalizado - [Nome do Serviço]',
  valor: total_amount,  // Serviço + Extras
  data: YYYY-MM-DD,
  agendamento_id,
  barbeiro_id: staff_id,
  status: 'pago'
}
```

#### **Despesa (Comissão):**
```typescript
{
  tipo: 'despesa',
  categoria: 'comissao',
  descricao: 'Comissão [taxa]% - [Nome do Serviço]',
  valor: commission_amount,
  data: YYYY-MM-DD,
  agendamento_id,
  barbeiro_id: staff_id,
  status: 'pago'
}
```

---

## 🔔 Notificações Realtime

### **Barbeiro recebe notificações:**

1. **Novo Agendamento** (Painel Cliente)
```typescript
Event: 'NEW_APPOINTMENT'
Payload: { cliente_nome, servico_nome, data, hora }
```

2. **Check-in** (Totem)
```typescript
Event: 'CHECKIN'
Payload: { cliente_nome, horario }
```

3. **Atendimento Finalizado**
```typescript
Event: 'APPOINTMENT_COMPLETED'
Payload: { cliente_nome, servico_nome, total, comissao }
```

### **Admin recebe notificações:**
- Novos agendamentos (INSERT)
- Atualizações de status (UPDATE)
- Exclusões (DELETE)

Via `postgres_changes` na tabela `painel_agendamentos`

---

## 📊 Status do Agendamento

| Status | Origem | Significado |
|--------|--------|-------------|
| `agendado` | Painel Cliente / Totem | Agendamento criado, aguardando confirmação |
| `confirmado` | Admin / Sistema | Confirmado pelo admin ou automaticamente |
| `CHEGOU` | Totem Check-in | Cliente fez check-in no totem |
| `FINALIZADO` | Totem Checkout / Admin | Atendimento concluído, comissões geradas |
| `cancelado` | Admin / Cliente | Agendamento cancelado |

### **Status Totem Session:**
- `check_in` - Cliente chegou
- `in_service` - Em atendimento (não usado atualmente)
- `checkout` - No processo de checkout
- `completed` - Finalizado e pago

---

## 🧪 Como Testar o Fluxo Completo

### **Teste 1: Fluxo Totem (Completo)**
1. Criar agendamento via Painel Cliente
2. Ir para `/totem/search` → buscar telefone
3. Fazer check-in
4. Ir para checkout (`/totem/checkout`)
5. Adicionar serviços extras (opcional)
6. Realizar pagamento (PIX ou Cartão)
7. **Verificar:**
   - `painel_agendamentos.status` = `FINALIZADO`
   - `barber_commissions` tem nova entrada
   - `finance_transactions` tem 2 novas entradas (receita + despesa)
   - Barbeiro recebeu notificações

### **Teste 2: Fluxo Admin (Manual)**
1. Criar agendamento via Painel Cliente
2. Ir para Admin → Agendamentos Clientes
3. Clicar em "..." → "Finalizar Atendimento"
4. **Verificar:**
   - `painel_agendamentos.status` = `FINALIZADO`
   - `barber_commissions` tem nova entrada
   - `finance_transactions` tem 2 novas entradas
   - Barbeiro recebeu notificação

### **Teste 3: Notificações Realtime**
1. Abrir Painel Barbeiro em uma aba
2. Abrir Painel Cliente em outra aba
3. Criar agendamento no Painel Cliente
4. **Verificar:** Notificação aparece no Painel Barbeiro
5. Fazer check-in no totem
6. **Verificar:** Notificação aparece no Painel Barbeiro

---

## 🐛 Troubleshooting

### **Comissão não foi gerada:**
- Verificar se `painel_barbeiros.staff_id` está preenchido
- Verificar se `staff.commission_rate` existe
- Ver logs da edge function

### **Notificações não chegam:**
- Verificar se Realtime está habilitado para `painel_agendamentos`
- Verificar console do navegador para logs
- Confirmar que `barbeiro_id` está correto

### **Lançamentos financeiros duplicados:**
- Verificar se não está chamando finalização 2x
- Ver tabela `finance_transactions` por `agendamento_id`

### **Status inconsistente:**
- Sempre usar as edge functions para finalização
- Não atualizar status `FINALIZADO` manualmente no banco

---

## 🔧 Edge Functions Utilizadas

| Função | Descrição | Quando Usar |
|--------|-----------|-------------|
| `totem-checkin` | Processa check-in do cliente | Cliente chegou na barbearia |
| `totem-checkout` | Gerencia checkout e finalização | Cliente no totem finalizando |
| `process-appointment-completion` | Finalização unificada | Admin finaliza manualmente |
| `payments-pix` | Processa pagamento PIX | Cliente paga via PIX |
| `payments-card` | Processa pagamento Cartão | Cliente paga via Cartão |

---

## 📈 Melhorias Futuras

- [ ] Permitir edição de comissões antes de pagar
- [ ] Adicionar desconto por cupom no admin
- [ ] Relatório de comissões por período
- [ ] Notificação por email/WhatsApp ao cliente
- [ ] Dashboard em tempo real com métricas
- [ ] Histórico completo de mudanças de status
- [ ] Exportar relatórios em Excel/PDF
