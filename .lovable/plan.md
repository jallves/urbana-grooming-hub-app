
# Plano: Novo Fluxo de Agendamento do Cliente (Wizard Dinâmico)

## Objetivo
Substituir o formulário único atual (`NewClientAppointmentForm`) por um **wizard em etapas**, mais rápido, com sugestões inteligentes, sem quebrar as integrações existentes (Admin, Totem check-in, Painel Barbeiro, comissões).

## Fluxo alvo (5 etapas)

```text
[1] Escolher SERVIÇOS    →  ordenados pelos mais executados
         ↓                    (após 1º corte → popup Combo)
[2] Escolher BARBEIRO    →  cards com foto
         ↓
[3] Escolher DIA         →  scroll horizontal de datas
         ↓
[4] Escolher HORÁRIO     →  subtela dedicada + botão Voltar
         ↓                    (voltar = etapa 3 novamente)
[5] RESUMO + extras      →  serviços extras + popup produtos
         ↓
    Confirmar → grava em painel_agendamentos (fluxo atual)
```

## Regras por etapa

### 1. Serviços — ordenação inteligente
- Nova view/consulta agregando execuções dos últimos **90 dias** em `painel_agendamentos` (status `concluido`) por `servico_id`, retornando ranking.
- Ordem final: serviços com ranking primeiro (desc), demais em ordem alfabética como fallback.
- Cache React Query 10 min.

### 2. Popup Combo (após seleção)
- Ao selecionar um serviço que participa de algum combo (`combo_service_items`), abrir modal rápido sugerindo os serviços complementares do(s) combo(s).
- Se o cliente aceitar, adiciona o(s) serviço(s) extra(s) e aplica o **preço do combo** (mesmo desconto já usado no Totem — reaproveitar `detectMatchingCombo` já existente).
- Se recusar, mantém apenas o serviço original.

### 3. Data
- Scroll horizontal (chips) com próximos 30 dias, respeitando `barber_availability` e regra de "dia vazio" oculto (memória já existente).
- Seleção da data **abre subtela** de horários (não força scroll).

### 4. Horários (subtela)
- Lista de slots disponíveis do barbeiro naquele dia (reaproveitar `useBarberAppointmentFetch` + validação unificada — memória `unified-appointment-validation`).
- Botão **Voltar** retorna à etapa 3 (mantém barbeiro/serviços).

### 5. Resumo + extras + produtos
- Resumo: barbeiro, data, horário, lista de serviços com preços, total (já com desconto de combo se aplicável).
- Botão **+ Adicionar serviço extra** (mesmo componente já reutilizado no admin/barbeiro, com detecção automática de combo).
- Antes de confirmar, popup dos **produtos mais vendidos** (reaproveitar `ProductCrossSellDialog` — trocar ordenação de "cross-sell" para "mais vendidos" via `vendas_itens`).
- Confirmar → grava normalmente via `useClientAppointmentSubmit` (integrações intactas).

## Integrações preservadas
- Persistência continua em `painel_agendamentos` (sem alterar schema principal).
- Admin (`AdminAppointments`), Painel Barbeiro (`BarberAppointments`) e Totem (`TotemSearch`) continuam lendo/escrevendo nas mesmas tabelas.
- Sem mudanças em comissões, ERP, ou fluxo de check-in.

---

## Detalhes técnicos

### Novos arquivos
- `src/components/client/appointment/wizard/ClientAppointmentWizard.tsx` — orquestrador (state machine simples com `step: 1..5`).
- `src/components/client/appointment/wizard/StepServices.tsx`
- `src/components/client/appointment/wizard/StepBarber.tsx`
- `src/components/client/appointment/wizard/StepDate.tsx`
- `src/components/client/appointment/wizard/StepTime.tsx`
- `src/components/client/appointment/wizard/StepSummary.tsx`
- `src/components/client/appointment/wizard/ComboSuggestionDialog.tsx`
- `src/hooks/useTopServices.ts` — ranking de serviços mais executados (90 dias).
- `src/hooks/useTopProducts.ts` — ranking de produtos mais vendidos (para o popup final).
- `src/hooks/useComboSuggestions.ts` — dado um `service_id`, retorna combos elegíveis a partir de `combo_service_items` + `painel_servicos`.

### Reaproveitamento
- `detectMatchingCombo` (já usado no Totem/Admin/Barbeiro) para cálculo do desconto.
- `useClientAppointmentSubmit` para gravação final.
- `ProductCrossSellDialog` existente (adaptar fonte de dados para "mais vendidos").
- Validação unificada de slots (memória existente).

### Substituição
- `NewClientAppointmentForm.tsx` passa a renderizar o novo `ClientAppointmentWizard` mantendo a mesma prop API (`isOpen`, `onClose`, `defaultDate`) — nenhum call-site precisa mudar.

### Consulta de ranking (SQL client-side)
```ts
supabase
  .from('painel_agendamentos')
  .select('servico_id')
  .eq('status', 'concluido')
  .gte('data', <hoje - 90d>);
// agrupa por servico_id no cliente
```
(Sem migração de schema; leitura simples.)

### Estado do Wizard
```ts
{
  step: 1|2|3|4|5,
  services: Service[],       // suporta múltiplos (combos/extras)
  barberId: string | null,
  date: Date | null,
  time: string | null,
  extraProducts: Product[],
  appliedComboId: string | null,
  totalPrice: number,
}
```

## Fora de escopo
- Alterações em Admin/Totem/Barbeiro (integrações permanecem lendo `painel_agendamentos`).
- Alterações no cálculo de comissões.
- Migrações de banco.

## Riscos e mitigação
- **DOM/translation extensions**: seguir memória (`key` dinâmico em containers de step, `suppressHydrationWarning`).
- **Mobile 100dvh**: sheet fullscreen conforme padrão Urbana.
- **Combo duplicado**: usar mesma função `detectMatchingCombo` já validada no Totem.
