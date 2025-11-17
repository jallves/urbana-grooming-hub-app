-- ============================================================
-- CORREÇÃO DAS RLS POLICIES PARA PUSH NOTIFICATION TOKENS
-- Adaptar para funcionar com ambos sistemas de autenticação
-- ============================================================

-- 1. Remover policies antigas
DROP POLICY IF EXISTS "Clientes podem ver seus próprios tokens" ON push_notification_tokens;
DROP POLICY IF EXISTS "Clientes podem inserir seus próprios tokens" ON push_notification_tokens;
DROP POLICY IF EXISTS "Clientes podem atualizar seus próprios tokens" ON push_notification_tokens;
DROP POLICY IF EXISTS "Clientes podem deletar seus próprios tokens" ON push_notification_tokens;

-- 2. Criar nova policy permissiva para SERVICE ROLE
-- Permite que edge functions (que usam service role key) acessem tudo
CREATE POLICY "Service role tem acesso total"
ON push_notification_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Criar policy para clientes autenticados via Supabase Auth
CREATE POLICY "Clientes autenticados via Supabase Auth podem gerenciar tokens"
ON push_notification_tokens
FOR ALL
TO public
USING (
  -- Verifica se o client_id corresponde ao email do usuário autenticado
  client_id IN (
    SELECT id FROM painel_clientes
    WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
  )
)
WITH CHECK (
  -- Mesmo check para INSERT/UPDATE
  client_id IN (
    SELECT id FROM painel_clientes
    WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
  )
);

-- 4. Comentário explicativo
COMMENT ON POLICY "Service role tem acesso total" ON push_notification_tokens IS 
'Edge functions (service role) precisam de acesso para enviar notificações e gerenciar tokens expirados';

COMMENT ON POLICY "Clientes autenticados via Supabase Auth podem gerenciar tokens" ON push_notification_tokens IS 
'Permite que clientes autenticados via Supabase Auth (admin/barbeiros) gerenciem seus tokens. 
Clientes do painel customizado usam localStorage e são gerenciados via service role nas edge functions.';