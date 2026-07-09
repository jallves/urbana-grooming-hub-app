## Cupom de desconto no agendamento do cliente

Objetivo: permitir que o cliente aplique um cupom de desconto na tela de agendamento (após escolher serviço/barbeiro/horário, antes de confirmar). O valor descontado fica gravado no agendamento e aparece no check-in/checkout do totem e no painel admin. Admin gerencia os cupons na aba de Agendamentos de Clientes.

### 1. Banco de dados (migration)
Adicionar em `painel_agendamentos`:
- `cupom_codigo text` — código aplicado
- `cupom_id uuid` — FK opcional para `discount_coupons.id`
- `desconto_valor numeric default 0` — valor absoluto em R$ descontado
- `valor_original numeric` — preço antes do desconto (auditoria)
- `valor_final numeric` — preço cobrado

Nova RPC `validate_and_apply_coupon(p_code text, p_service_price numeric)`:
- Verifica `is_active`, `valid_from/until`, `max_uses`
- Retorna `{success, coupon_id, discount_amount, final_amount, error}`
- Não incrementa `current_uses` (só incrementa quando o agendamento é confirmado — trigger)

Trigger em `painel_agendamentos`:
- Ao INSERT com `cupom_id`, incrementa `current_uses`
- Ao UPDATE de status para `cancelado`, decrementa
- Ao DELETE com `cupom_id`, decrementa

Ajustar RLS em `discount_coupons`: permitir `SELECT` para `authenticated` (clientes logados precisam validar cupons pelo código).

### 2. Painel do cliente (agendamento)
Arquivo: `src/pages/PainelClienteAgendamentos.tsx` e componentes filhos do fluxo de novo agendamento.

- Nova etapa/campo "Cupom de desconto" logo antes do botão "Confirmar agendamento"
- Input de código + botão "Aplicar"
- Chama RPC `validate_and_apply_coupon` com o código e o preço do serviço selecionado
- Mostra: preço original, desconto (R$ e %), preço final, badge verde do cupom
- Botão "Remover cupom" para trocar
- Ao confirmar, envia `cupom_codigo`, `cupom_id`, `desconto_valor`, `valor_original`, `valor_final` para o INSERT

### 3. Painel admin — gestão de cupons dentro de Agendamentos de Clientes
Arquivo: `src/pages/AdminClientAppointments.tsx` (nova aba "Cupons de Desconto").

Nova aba usando componentes já existentes do módulo Marketing como base (`CouponForm`, `CouponList`) mas reaproveitados/adaptados:
- Listagem com colunas: código, tipo (%, R$), valor, validade, usos (atual/máx), status ativo
- Botão criar cupom: código, tipo (percentual/fixo), valor, valid_from, valid_until, max_uses, is_active
- Toggle ativar/inativar (switch no card/linha)
- Editar e excluir cupom
- Todas operações usam a tabela `discount_coupons` já existente

### 4. Exibição do desconto no fluxo pós-agendamento
- **Lista admin de agendamentos** (`ClientAppointmentDashboard` e cards do agendamento): mostrar badge do cupom + desconto ao lado do valor
- **Totem check-in/checkout** (`TotemCheckoutSearch`, `TotemPaymentCash`, `TotemProductCardType`): quando o agendamento tem `cupom_codigo`, exibir "Cupom X — desconto R$ Y" e cobrar `valor_final` em vez do preço do serviço
- **Painel do cliente** (lista de próximos agendamentos): mostrar o cupom aplicado e valor final

### Detalhes técnicos
- RPC `SECURITY DEFINER` com `SET search_path = public` para permitir cliente autenticado validar sem acessar tabela diretamente
- Trigger de decremento no cancelamento evita "gastar" cupom em agendamento cancelado
- `valor_original` e `valor_final` gravados para preservar valor mesmo se o preço do serviço mudar depois
- Reutilizar `discount_coupons` (já existe) — não criar tabela nova
- Componente `CouponBadge` reutilizável para admin/totem/cliente

### Pontos a confirmar
1. Cupom deve poder ter **valor mínimo do serviço** (`min_amount` já existe na tabela) — quer usar?
2. Um cupom pode ser usado **múltiplas vezes pelo mesmo cliente** ou só uma vez por cliente? (hoje só há limite global `max_uses`)
3. Quer restringir cupom a serviços/barbeiros específicos ou vale para todos?