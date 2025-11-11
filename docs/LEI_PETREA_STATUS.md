# 📜 LEI PÉTREA DOS STATUS DE AGENDAMENTO

## 🎯 Conceito

A partir de agora, os status de agendamento seguem uma **LEI PÉTREA** (imutável) baseada exclusivamente no fluxo de check-in/checkout do cliente através do totem.

**Não há mais mudanças manuais de status, EXCETO para cancelamento.**

---

## 📊 OS 4 ESTADOS DO SISTEMA

### 1. 📅 AGENDADO / Check-in Pendente
**Quando acontece:**
- Cliente fez o agendamento
- Cliente ainda NÃO fez check-in no totem

**Características:**
- Badge azul
- Ícone: 📅
- Label: "Agendado" + "Check-in Pendente"
- **PODE SER CANCELADO**

**Como detectar no código:**
```typescript
const hasCheckIn = totem_sessions && totem_sessions.some(s => s.check_in_time);
if (!hasCheckIn) return 'agendado';
```

---

### 2. ✅ CHECK-IN FINALIZADO / Checkout Pendente
**Quando acontece:**
- Cliente fez check-in no totem
- Cliente ainda NÃO fez checkout (não pagou)

**Características:**
- Badge laranja
- Ícone: ✅
- Label: "Check-in Finalizado" + "Checkout Pendente"
- **PODE SER CANCELADO**

**Como detectar no código:**
```typescript
const hasCheckIn = totem_sessions && totem_sessions.some(s => s.check_in_time);
const hasCheckOut = totem_sessions && totem_sessions.some(s => s.check_out_time);

if (hasCheckIn && !hasCheckOut) return 'check_in_finalizado';
```

---

### 3. 🎉 CONCLUÍDO
**Quando acontece:**
- Cliente fez check-in
- Cliente fez checkout (pagamento finalizado)
- Processo completo

**Características:**
- Badge verde
- Ícone: 🎉
- Label: "Concluído"
- **NÃO PODE SER CANCELADO**
- **NÃO PODE SER EXCLUÍDO**

**Como detectar no código:**
```typescript
const hasCheckIn = totem_sessions && totem_sessions.some(s => s.check_in_time);
const hasCheckOut = totem_sessions && totem_sessions.some(s => s.check_out_time);

if (hasCheckIn && hasCheckOut) return 'concluido';
```

---

### 4. ❌ CANCELADO
**Quando acontece:**
- Admin cancela manualmente um agendamento com status 'agendado' ou 'check_in_finalizado'
- É o ÚNICO status que pode ser definido manualmente

**Características:**
- Badge vermelho
- Ícone: ❌
- Label: "Cancelado"
- **É IRREVERSÍVEL** (uma vez cancelado, não pode voltar)
- **NÃO PODE SER EXCLUÍDO** (deve ser mantido para auditoria)

**Como detectar no código:**
```typescript
const statusUpper = appointment.status?.toUpperCase() || '';
if (statusUpper === 'CANCELADO') return 'cancelado';
```

---

## ⚠️ REGRAS CRÍTICAS

### ✅ PERMITIDO:
- ✅ Editar data/hora do agendamento (qualquer status)
- ✅ Editar barbeiro (qualquer status)
- ✅ Editar serviço (qualquer status)
- ✅ **CANCELAR** agendamento com status 'agendado' ou 'check_in_finalizado'
- ✅ **EXCLUIR** agendamento apenas se:
  - NÃO tiver check-in
  - NÃO tiver vendas
  - NÃO estiver concluído
  - NÃO estiver cancelado

### ❌ NÃO PERMITIDO:
- ❌ Mudar status manualmente (exceto para cancelar)
- ❌ Forçar check-in pelo admin (deve ser feito no totem)
- ❌ Forçar checkout pelo admin (deve ser feito no totem ou via "Checkouts Pendentes")
- ❌ Cancelar agendamento concluído
- ❌ Excluir agendamento com check-in
- ❌ Excluir agendamento com vendas
- ❌ Excluir agendamento concluído
- ❌ Excluir agendamento cancelado (deve ser mantido para auditoria)
- ❌ Reverter cancelamento (é irreversível)

---

## 🔄 FLUXO COMPLETO

```mermaid
graph LR
    A[Cliente Agenda] --> B[📅 Agendado<br/>Check-in Pendente]
    B --> C{Admin Cancela?}
    C -->|Sim| D[❌ Cancelado<br/>IRREVERSÍVEL]
    C -->|Não| E[Cliente faz<br/>Check-in no Totem]
    E --> F[✅ Check-in Finalizado<br/>Checkout Pendente]
    F --> G{Admin Cancela?}
    G -->|Sim| D
    G -->|Não| H[Cliente faz<br/>Checkout no Totem]
    H --> I[🎉 Concluído<br/>NÃO PODE CANCELAR]
```

---

## 📁 ARQUIVOS MODIFICADOS

### Componentes de Visualização:
- `ClientAppointmentCompactRow.tsx` - Botão "Cancelar" + validação de exclusão
- `ClientAppointmentMobileCard.tsx` - Botão "Cancelar" + validação de exclusão
- `ClientAppointmentList.tsx` - Filtro de cancelados
- `ClientAppointmentStats.tsx` - Card de cancelados (5 cards total)
- `ClientAppointmentFilters.tsx` - Opção de filtro "Cancelado"

### Lógica de Negócio:
- `useClientAppointments.ts` - Função `handleStatusChange` para cancelamento + validação de exclusão

### Função de Status (getActualStatus):
```typescript
const getActualStatus = () => {
  // Prioridade 1: Verificar cancelamento manual
  const statusUpper = appointment.status?.toUpperCase() || '';
  if (statusUpper === 'CANCELADO') {
    return 'cancelado';
  }

  // Prioridade 2: Calcular status baseado em check-in/checkout
  const hasCheckIn = appointment.totem_sessions && 
    appointment.totem_sessions.some((s: any) => s.check_in_time);
  
  const hasCheckOut = appointment.totem_sessions && 
    appointment.totem_sessions.some((s: any) => s.check_out_time);

  if (!hasCheckIn) return 'agendado';
  if (hasCheckIn && !hasCheckOut) return 'check_in_finalizado';
  return 'concluido';
};
```

---

## 🎨 CONFIGURAÇÃO DE BADGES

```typescript
const statusConfig = {
  'agendado': { 
    label: 'Agendado',
    sublabel: 'Check-in Pendente',
    className: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: '📅'
  },
  'check_in_finalizado': {
    label: 'Check-in Finalizado',
    sublabel: 'Checkout Pendente',
    className: 'bg-orange-100 text-orange-700 border-orange-300',
    icon: '✅'
  },
  'concluido': { 
    label: 'Concluído',
    sublabel: null,
    className: 'bg-green-100 text-green-700 border-green-300',
    icon: '🎉'
  },
  'cancelado': {
    label: 'Cancelado',
    sublabel: null,
    className: 'bg-red-100 text-red-700 border-red-300',
    icon: '❌'
  },
};
```

---

## 📊 ESTATÍSTICAS

Dashboard mostra 5 cards:
1. **Total de Agendamentos** - Todos os agendamentos
2. **Agendado** - Aguardando check-in (pode cancelar)
3. **Check-in Finalizado** - Aguardando checkout (pode cancelar)
4. **Concluído** - Processo completo (não pode cancelar/excluir)
5. **Cancelado** - Agendamentos cancelados (não pode excluir)

---

## 🔍 FILTROS

Dropdown de filtros mostra:
- 📋 Todos
- 📅 Agendado (Check-in Pendente)
- ✅ Check-in Finalizado (Checkout Pendente)
- 🎉 Concluído
- ❌ Cancelado

---

## 🚨 CHECKOUTS PENDENTES

Sistema automático que:
- Detecta agendamentos com check-in mas sem checkout
- Alerta o cliente no totem quando ele digita o telefone
- Permite checkout a qualquer momento (sem restrição de data/hora)
- Mantém integridade dos dados

**Acesso Admin:** `/admin/checkouts-pendentes`
**Acesso Totem:** Automático ao digitar telefone

---

## 🗑️ VALIDAÇÕES DE EXCLUSÃO

**Pode excluir APENAS se:**
- ❌ NÃO tem check-in
- ❌ NÃO tem vendas associadas
- ❌ NÃO está finalizado/concluído
- ❌ NÃO está cancelado

**Não pode excluir se:**
- ✅ Tem check-in (integridade do histórico)
- ✅ Tem vendas (integridade financeira)
- ✅ Está concluído (auditoria)
- ✅ Está cancelado (auditoria)

---

## ❌ CANCELAMENTO

**Pode cancelar:**
- ✅ Status 'agendado' (check-in pendente)
- ✅ Status 'check_in_finalizado' (checkout pendente)

**Não pode cancelar:**
- ❌ Status 'concluido' (processo finalizado)
- ❌ Status 'cancelado' (já está cancelado)

**Efeitos do cancelamento:**
- Status muda para 'cancelado'
- Badge fica vermelho (❌)
- Não pode mais ser editado (exceto data/hora/barbeiro/serviço)
- **É IRREVERSÍVEL** (não pode voltar para status anterior)
- Fica registrado no log de auditoria

---

## ✨ BENEFÍCIOS

1. **Clareza Total** - Status sempre reflete a realidade do fluxo
2. **Sem Ambiguidade** - 4 estados únicos, impossível confundir
3. **Automático** - 3 status automáticos + 1 manual (cancelar)
4. **Auditável** - Histórico completo via totem_sessions
5. **Didático** - Fácil entender onde o cliente está no processo
6. **Segurança** - Cancelamentos mantidos para auditoria

---

## 🔐 INTEGRIDADE

**Validações de Exclusão:**
- ❌ Não pode excluir se tem check-in
- ❌ Não pode excluir se tem vendas
- ❌ Não pode excluir se está concluído
- ❌ Não pode excluir se está cancelado

**Validações de Cancelamento:**
- ❌ Não pode cancelar se está concluído
- ✅ Pode cancelar se está agendado
- ✅ Pode cancelar se tem check-in mas não tem checkout

**Logs de Auditoria:**
- Todas as tentativas de exclusão são registradas
- Todos os cancelamentos são registrados
- Admin activity log mantém histórico completo

---

## 📝 NOTAS IMPORTANTES

1. O campo `status` na tabela `painel_agendamentos` é usado APENAS para "cancelado"
2. Os outros 3 status são calculados dinamicamente via `totem_sessions`
3. Cancelamento é IRREVERSÍVEL
4. Agendamentos cancelados NÃO podem ser excluídos (auditoria)
5. Esta é uma mudança PERMANENTE

---

**Data de Implementação:** 2025-11-11  
**Última Atualização:** 2025-11-11 (Adicionado status "Cancelado")  
**Status:** ✅ LEI PÉTREA ATIVA  
**Revisão:** NÃO PERMITIDA (imutável)

### 1. 📅 AGENDADO / Check-in Pendente
**Quando acontece:**
- Cliente fez o agendamento
- Cliente ainda NÃO fez check-in no totem

**Características:**
- Badge azul
- Ícone: 📅
- Label: "Agendado" + "Check-in Pendente"

**Como detectar no código:**
```typescript
const hasCheckIn = totem_sessions && totem_sessions.some(s => s.check_in_time);
if (!hasCheckIn) return 'agendado';
```

---

### 2. ✅ CHECK-IN FINALIZADO / Checkout Pendente
**Quando acontece:**
- Cliente fez check-in no totem
- Cliente ainda NÃO fez checkout (não pagou)

**Características:**
- Badge laranja
- Ícone: ✅
- Label: "Check-in Finalizado" + "Checkout Pendente"

**Como detectar no código:**
```typescript
const hasCheckIn = totem_sessions && totem_sessions.some(s => s.check_in_time);
const hasCheckOut = totem_sessions && totem_sessions.some(s => s.check_out_time);

if (hasCheckIn && !hasCheckOut) return 'check_in_finalizado';
```

---

### 3. 🎉 CONCLUÍDO
**Quando acontece:**
- Cliente fez check-in
- Cliente fez checkout (pagamento finalizado)
- Processo completo

**Características:**
- Badge verde
- Ícone: 🎉
- Label: "Concluído"

**Como detectar no código:**
```typescript
const hasCheckIn = totem_sessions && totem_sessions.some(s => s.check_in_time);
const hasCheckOut = totem_sessions && totem_sessions.some(s => s.check_out_time);

if (hasCheckIn && hasCheckOut) return 'concluido';
```

---

## ⚠️ REGRAS CRÍTICAS

### ✅ PERMITIDO:
- ✅ Editar data/hora do agendamento
- ✅ Editar barbeiro
- ✅ Editar serviço
- ✅ Excluir agendamento (com validações)

### ❌ NÃO PERMITIDO:
- ❌ Mudar status manualmente (botões Confirmar/Finalizar/Cancelar foram REMOVIDOS)
- ❌ Forçar check-in pelo admin (deve ser feito no totem)
- ❌ Forçar checkout pelo admin (deve ser feito no totem ou via "Checkouts Pendentes")
- ❌ Criar novos status customizados

---

## 🔄 FLUXO COMPLETO

```mermaid
graph LR
    A[Cliente Agenda] --> B[📅 Agendado<br/>Check-in Pendente]
    B --> C[Cliente faz<br/>Check-in no Totem]
    C --> D[✅ Check-in Finalizado<br/>Checkout Pendente]
    D --> E[Cliente faz<br/>Checkout no Totem]
    E --> F[🎉 Concluído]
```

---

## 📁 ARQUIVOS MODIFICADOS

### Componentes de Visualização:
- `ClientAppointmentCompactRow.tsx`
- `ClientAppointmentMobileCard.tsx`
- `ClientAppointmentList.tsx`
- `ClientAppointmentStats.tsx`
- `ClientAppointmentFilters.tsx`

### Função Padrão (getActualStatus):
```typescript
const getActualStatus = () => {
  const hasCheckIn = appointment.totem_sessions && 
    appointment.totem_sessions.some((s: any) => s.check_in_time);
  
  const hasCheckOut = appointment.totem_sessions && 
    appointment.totem_sessions.some((s: any) => s.check_out_time);

  if (!hasCheckIn) return 'agendado';
  if (hasCheckIn && !hasCheckOut) return 'check_in_finalizado';
  return 'concluido';
};
```

---

## 🎨 CONFIGURAÇÃO DE BADGES

```typescript
const statusConfig = {
  'agendado': { 
    label: 'Agendado',
    sublabel: 'Check-in Pendente',
    className: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: '📅'
  },
  'check_in_finalizado': {
    label: 'Check-in Finalizado',
    sublabel: 'Checkout Pendente',
    className: 'bg-orange-100 text-orange-700 border-orange-300',
    icon: '✅'
  },
  'concluido': { 
    label: 'Concluído',
    sublabel: null,
    className: 'bg-green-100 text-green-700 border-green-300',
    icon: '🎉'
  },
};
```

---

## 📊 ESTATÍSTICAS

Dashboard mostra apenas 4 cards:
1. **Total de Agendamentos** - Todos os agendamentos
2. **Agendado** - Aguardando check-in
3. **Check-in Finalizado** - Aguardando checkout
4. **Concluído** - Processo completo

---

## 🔍 FILTROS

Dropdown de filtros mostra apenas:
- 📋 Todos
- 📅 Agendado (Check-in Pendente)
- ✅ Check-in Finalizado (Checkout Pendente)
- 🎉 Concluído

---

## 🚨 CHECKOUTS PENDENTES

Sistema automático que:
- Detecta agendamentos com check-in mas sem checkout
- Alerta o cliente no totem quando ele digita o telefone
- Permite checkout a qualquer momento (sem restrição de data/hora)
- Mantém integridade dos dados

**Acesso Admin:** `/admin/checkouts-pendentes`
**Acesso Totem:** Automático ao digitar telefone

---

## ✨ BENEFÍCIOS

1. **Clareza Total** - Status sempre reflete a realidade do fluxo
2. **Sem Ambiguidade** - 3 estados únicos, impossível confundir
3. **Automático** - Reduz erros humanos
4. **Auditável** - Histórico completo via totem_sessions
5. **Didático** - Fácil entender onde o cliente está no processo

---

## 🔐 INTEGRIDADE

**Validações de Exclusão:**
- ❌ Não pode excluir se tem check-in
- ❌ Não pode excluir se tem vendas
- ❌ Não pode excluir se está concluído

**Logs de Auditoria:**
- Todas as tentativas de exclusão são registradas
- Admin activity log mantém histórico completo

---

## 📝 NOTAS IMPORTANTES

1. O campo `status` na tabela `painel_agendamentos` ainda existe mas **não é mais usado** para exibição
2. Status é calculado dinamicamente via `totem_sessions`
3. Esta é uma mudança PERMANENTE e IRREVERSÍVEL
4. Qualquer tentativa de adicionar novos status deve ser recusada

---

**Data de Implementação:** 2025-11-11
**Status:** ✅ LEI PÉTREA ATIVA
**Revisão:** NÃO PERMITIDA (imutável)
