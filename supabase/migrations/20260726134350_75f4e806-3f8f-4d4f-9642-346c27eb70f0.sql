-- Índice único no endpoint para permitir upsert
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_key ON public.push_subscriptions (endpoint);

-- Garantir grants (RLS ainda gate final)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

-- Política adicional: usuário pode desativar (update active=false) sua inscrição
-- A política atual "Users can manage own subscriptions" já cobre auth.uid()=user_id
-- Adicionar política para permitir insert quando user_id é setado no cliente
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.push_subscriptions;
CREATE POLICY "push_subs_own_manage"
  ON public.push_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);