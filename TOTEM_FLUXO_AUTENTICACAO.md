# Fluxo de Autenticação Simplificada do Totem - Costa Urbana

## 🎯 Conceito

O Totem utiliza **autenticação simplificada por telefone**, sem necessidade de email/senha. O sistema busca todos os dados do cliente automaticamente, proporcionando experiência rápida e dinâmica.

## 📱 Fluxo Completo

### 1. **Cliente digita o telefone** (`TotemSearch.tsx`)
```
┌─────────────────────────────┐
│   Digite seu telefone       │
│                             │
│   (11) 98765-4321          │
│                             │
│   [1] [2] [3]              │
│   [4] [5] [6]              │
│   [7] [8] [9]              │
│   [C] [0] [⌫]              │
│                             │
│      [BUSCAR] 🔍           │
└─────────────────────────────┘
```

**O que acontece:**
- Busca em `painel_clientes` pelo campo `whatsapp`
- Se encontrar, busca **TODOS** os agendamentos do cliente
- Carrega últimos 10 agendamentos (ordenados por data decrescente)
- Navega para lista de agendamentos

### 2. **Seleção de Agendamento** (`TotemAppointmentsList.tsx`) - **NOVA TELA**
```
┌───────────────────────────────────────────────┐
│        Olá, João Silva!                       │
│   Selecione um agendamento para check-in      │
├───────────────────────────────────────────────┤
│                                               │
│  📅 25 de Novembro - Sábado    [CONFIRMADO]  │
│  🕐 14:00 | ✂️ Corte + Barba | 👤 Paulo     │
│  ✅ Toque para fazer CHECK-IN                │
├───────────────────────────────────────────────┤
│                                               │
│  📅 18 de Novembro - Sábado    [CONCLUÍDO]   │
│  🕐 15:00 | ✂️ Corte         | 👤 Carlos    │
│  ❌ Agendamento passado                       │
├───────────────────────────────────────────────┤
│                                               │
│  📅 10 de Novembro - Sexta    [CANCELADO]    │
│  🕐 10:00 | ✂️ Barba         | 👤 Paulo     │
└───────────────────────────────────────────────┘
```

**Recursos:**
- Lista TODOS os agendamentos do cliente (histórico completo)
- Status visual com cores (Agendado, Confirmado, Concluído, Cancelado)
- **Apenas agendamentos de HOJE com status "agendado" ou "confirmado" permitem check-in**
- Agendamentos passados ficam desabilitados
- Toque no card do agendamento para prosseguir

### 3. **Confirmação de Dados** (`TotemConfirmation.tsx`)
```
┌───────────────────────────────────────────────┐
│         Confirme seus dados                   │
├───────────────────────────────────────────────┤
│                                               │
│  👤 João Silva                                │
│                                               │
│  📅 Data: 25 de Novembro                      │
│  🕐 Horário: 14:00                            │
│  ✂️ Serviço: Corte + Barba - R$ 60.00       │
│  👤 Barbeiro: Paulo Costa                     │
│                                               │
│      [CONFIRMAR CHECK-IN] ✅                  │
└───────────────────────────────────────────────┘
```

**O que acontece:**
- Chama edge function `totem-checkin`
- Atualiza `status_totem` para 'CHEGOU'
- Notifica barbeiro via Realtime
- Navega para tela de sucesso

### 4. **Sucesso** (`TotemCheckInSuccess.tsx`)
```
┌───────────────────────────────────────────────┐
│                                               │
│              ✅ Check-in                      │
│            realizado!                         │
│                                               │
│   Seu barbeiro foi notificado.                │
│   Em breve você será chamado!                 │
│                                               │
│         [VOLTAR AO INÍCIO]                    │
└───────────────────────────────────────────────┘
```

## 🔗 Integração com Sistema

### Tabela Principal: `painel_clientes`
```sql
- id (uuid)
- nome (text)
- email (text)
- whatsapp (text) ⭐ CAMPO USADO PARA BUSCA
- senha_hash (text) -- usado apenas no portal web
```

### Tabela de Agendamentos: `painel_agendamentos`
```sql
- id (uuid)
- cliente_id (uuid) -> painel_clientes
- barbeiro_id (uuid) -> painel_barbeiros
- servico_id (uuid) -> painel_servicos
- data (date)
- hora (time)
- status (text) -- agendado, confirmado, concluido, cancelado
- status_totem (text) -- AGUARDANDO, CHEGOU, EM_ATENDIMENTO
- qr_checkin (text)
```

## 🎨 Características UX

### ✅ Vantagens do Fluxo
1. **Sem cadastro adicional**: usa dados já existentes
2. **Rápido**: apenas 3 toques (digitar telefone → selecionar agendamento → confirmar)
3. **Histórico visível**: cliente vê todos seus agendamentos
4. **Visual claro**: status com cores e ícones intuitivos
5. **Touch otimizado**: botões grandes, feedback visual instantâneo

### 🎯 Validações
- Telefone deve ter mínimo 10 dígitos
- Cliente deve estar cadastrado
- Apenas agendamentos de HOJE podem fazer check-in
- Apenas status "agendado" ou "confirmado" permitem check-in

### 🔄 Notificação em Tempo Real
Quando o check-in é realizado:
1. Totem chama edge function `totem-checkin`
2. Edge function atualiza status no banco
3. Edge function envia broadcast via Supabase Realtime
4. Portal do Barbeiro recebe notificação instantânea
5. Agendamento aparece destacado para o barbeiro

## 📊 Comparação: Antes vs Agora

### ❌ Antes
- Buscava apenas agendamentos de HOJE
- Cliente não via histórico
- Não permitia escolher agendamento
- Se tivesse múltiplos agendamentos no dia, pegava apenas o primeiro

### ✅ Agora
- Busca TODOS os agendamentos do cliente
- Cliente vê histórico completo (últimos 10)
- Cliente escolhe qual agendamento fazer check-in
- Interface visual mostra status de cada agendamento
- Apenas agendamentos elegíveis permitem check-in

## 🚀 Benefícios para o Negócio

1. **Fidelização**: cliente vê seu histórico, sente-se reconhecido
2. **Flexibilidade**: suporta múltiplos agendamentos no mesmo dia
3. **Transparência**: cliente vê status de todos agendamentos
4. **Eficiência**: processo rápido e sem fricção
5. **Profissionalismo**: experiência premium e moderna

## 🔐 Segurança

- Telefone como identificador único
- Sem exposição de dados sensíveis na tela
- Validação no backend (edge function)
- RLS políticas protegem dados do cliente
- Check-in só permitido para agendamentos válidos

---

**Costa Urbana - Tecnologia e Tradição lado a lado** ✨
