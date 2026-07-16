# Monitoramento total de sessões e auditoria em tempo real

## Objetivo
Ter visão 360° de tudo que acontece nos 4 painéis (Admin, Barbeiro, Cliente, Totem): quem está logado agora, quem logou/deslogou, todas as operações CRUD, com retenção automática de 30 dias.

## O que já existe
- Tabelas `active_sessions` e `admin_activity_log` com realtime ativo.
- Tela `Sessões` e `Log de Segurança` já renderizando ao vivo.
- Login em Admin/Barbeiro/Cliente/Totem já cria sessão via `sessionManager.createSession`.
- Logout já invalida sessão.

## O que vou adicionar

### 1. Migração SQL (uma migração única)
- Habilitar `pg_cron` + `pg_net`.
- **Retenção 30 dias automática** (job diário 03:00):
  - Apaga `admin_activity_log` onde `created_at < now() - 30 days`.
  - Apaga `active_sessions` inativas ou expiradas há >30 dias.
- **Auditoria automática via trigger genérico** `audit_table_change()` anexado a:
  `painel_agendamentos`, `painel_clientes`, `painel_barbeiros`, `painel_produtos`, `painel_servicos`, `financial_records`, `contas_pagar`, `contas_receber`, `vendas`, `vendas_itens`, `employees`, `staff`, `admin_users`, `user_roles`, `subscription_plans`, `client_subscriptions`, `discount_coupons`, `cash_register_sessions`, `working_hours`, `barber_availability`, `time_off`, `banner_images`, `gallery_images`, `staff_module_access`, `settings`.
  Cada INSERT/UPDATE/DELETE gera linha em `admin_activity_log` com `action`, `entity_type`, `entity_id`, `old_data`, `new_data` e `admin_id` (via `auth.uid()`).
- **RPC `get_monthly_login_stats()`**: retorna `{user_type, unique_users, total_logins}` do mês corrente a partir de `admin_activity_log` (action=login).
- **RPC `cleanup_locked_sessions()`**: encerra sessões com `last_activity_at < now() - 30 min` marcando `is_active=false`.

### 2. Frontend

**Hook novo `src/hooks/useForceLogoutWatcher.ts`**
- Escuta em realtime a própria linha em `active_sessions` (filter por `user_id`).
- Quando `is_active` vira `false` (ou linha some), chama `supabase.auth.signOut()` + redireciona pra tela de login apropriada do painel + toast "Sessão encerrada pelo administrador".

**Integração do watcher** em:
- `AuthContext.tsx` (redirect → `/auth`).
- `ClientAuthContext.tsx` (redirect → `/painel-cliente/login`).
- `TotemAuthContext.tsx` (redirect → `/totem/login`).

**`SessionsManagement.tsx` (upgrade da UI existente)**
- Novo bloco de KPIs mensais no topo: 4 cards (Admin, Barbeiro, Cliente, Totem) mostrando logins únicos e total do mês, atualizado via realtime em `admin_activity_log`.
- Nova badge visual "🔒 Em lock" em sessões com >30min sem atividade (badge amarela).
- Novo botão "Encerrar sessões em lock" que chama `cleanup_locked_sessions()`.
- Novo filtro de status incluindo "Em lock".

**`SecurityLogViewer.tsx`**
- Trocar botão "Limpar >30 dias" por indicador "Retenção automática ativa (30d)" já que o cron cuida.

## Detalhes técnicos

**Trigger genérico** (evita loop infinito ao pular a própria tabela):
```sql
CREATE FUNCTION audit_table_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_action text; v_entity uuid; v_admin uuid;
BEGIN
  v_action := lower(TG_OP);  -- insert/update/delete
  v_entity := COALESCE(
    (CASE WHEN TG_OP='DELETE' THEN OLD.id ELSE NEW.id END)::uuid, NULL);
  SELECT id INTO v_admin FROM admin_users WHERE user_id=auth.uid() LIMIT 1;
  INSERT INTO admin_activity_log(admin_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (v_admin, v_action, TG_TABLE_NAME,
          v_entity,
          CASE WHEN TG_OP='INSERT' THEN NULL ELSE to_jsonb(OLD) END,
          CASE WHEN TG_OP='DELETE' THEN NULL ELSE to_jsonb(NEW) END);
  RETURN COALESCE(NEW, OLD);
END $$;
```

**Ordem dos steps na migração**: extensões → função de auditoria → triggers → RPCs → cron jobs.

**Segurança**: triggers usam SECURITY DEFINER e `admin_activity_log` mantém RLS existente. Nenhuma alteração em RLS de tabelas auditadas.

**Volume esperado**: com 25 tabelas auditadas + retenção 30d, tamanho de `admin_activity_log` fica limitado. Índice em `created_at` já existe.

## Arquivos alterados/criados
1. `supabase/migrations/<timestamp>_audit_and_retention.sql` — novo
2. `src/hooks/useForceLogoutWatcher.ts` — novo
3. `src/contexts/AuthContext.tsx` — integra watcher
4. `src/contexts/ClientAuthContext.tsx` — integra watcher
5. `src/contexts/TotemAuthContext.tsx` — integra watcher
6. `src/pages/admin/SessionsManagement.tsx` — KPIs mensais + badge lock + botão cleanup
7. `src/components/admin/security/SecurityLogViewer.tsx` — troca botão por indicador de retenção auto

## Fora do escopo
- Geolocalização de IPs.
- Limite de sessões simultâneas por usuário.
- Dashboard analítico histórico (>30d).
