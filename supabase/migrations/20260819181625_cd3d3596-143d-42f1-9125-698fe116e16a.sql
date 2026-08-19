-- Grants para o papel anon (o totem usa a chave pública + header x-totem-token)
GRANT SELECT ON public.painel_barbeiros TO anon;
GRANT SELECT ON public.painel_clientes TO anon;
GRANT SELECT ON public.staff TO anon;
GRANT ALL ON public.painel_barbeiros TO service_role;
GRANT ALL ON public.painel_clientes TO service_role;
GRANT ALL ON public.staff TO service_role;

-- Barbeiros: leitura pública restrita a usuários autenticados + totem com token
DROP POLICY IF EXISTS "Public can read active barbers" ON public.painel_barbeiros;
CREATE POLICY "Authenticated can read active barbers"
ON public.painel_barbeiros FOR SELECT TO authenticated
USING (ativo = true);

CREATE POLICY "Totem can read barbers"
ON public.painel_barbeiros FOR SELECT TO anon, authenticated
USING (private.is_totem_request());

-- Colaboradores: idem
DROP POLICY IF EXISTS "Public can read active staff" ON public.staff;
CREATE POLICY "Authenticated can read active staff"
ON public.staff FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Totem can read active staff"
ON public.staff FOR SELECT TO anon, authenticated
USING (private.is_totem_request() AND is_active = true);

-- Clientes: o totem precisa reconhecer o cliente no check-in/checkout
CREATE POLICY "Totem can read clients"
ON public.painel_clientes FOR SELECT TO anon, authenticated
USING (private.is_totem_request());

CREATE POLICY "Totem can update clients"
ON public.painel_clientes FOR UPDATE TO anon, authenticated
USING (private.is_totem_request())
WITH CHECK (private.is_totem_request());