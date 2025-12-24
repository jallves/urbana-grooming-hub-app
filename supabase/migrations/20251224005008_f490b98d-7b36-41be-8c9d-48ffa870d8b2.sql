
-- =====================================================
-- POLÍTICAS RLS PARA O TOTEM FUNCIONAR COMPLETAMENTE
-- O Totem é autenticado por PIN (tabela totem_auth)
-- e precisa acesso público às tabelas operacionais
-- =====================================================

-- 1. Verificar/Atualizar o PIN do totem para 7487
-- Primeiro, atualizar o hash do PIN
UPDATE public.totem_auth 
SET pin_hash = encode(sha256('7487'::bytea), 'hex'),
    updated_at = NOW()
WHERE device_name = 'Totem Principal';

-- 2. TOTEM_AUTH - Política para leitura pública (para validar PIN)
-- Já existe: "Permitir leitura de dispositivos ativos"

-- 3. TOTEM_SESSIONS - Políticas para operação pública
CREATE POLICY "Public can insert totem sessions" 
ON public.totem_sessions 
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Public can view totem sessions" 
ON public.totem_sessions 
FOR SELECT 
TO public
USING (true);

CREATE POLICY "Public can update totem sessions" 
ON public.totem_sessions 
FOR UPDATE 
TO public
USING (true);

-- 4. TOTEM_PAYMENTS - Políticas para operação pública
CREATE POLICY "Public can insert totem payments" 
ON public.totem_payments 
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Public can view own totem payments" 
ON public.totem_payments 
FOR SELECT 
TO public
USING (true);

CREATE POLICY "Public can update totem payments" 
ON public.totem_payments 
FOR UPDATE 
TO public
USING (true);

-- 5. PAINEL_BARBEIROS - Política para leitura pública (para escolher barbeiro)
CREATE POLICY "Public can view active barbers for totem" 
ON public.painel_barbeiros 
FOR SELECT 
TO public
USING (is_active = true);

-- 6. PAINEL_SERVICOS - Política para leitura pública (para escolher serviço)
CREATE POLICY "Public can view active services for totem" 
ON public.painel_servicos 
FOR SELECT 
TO public
USING (is_active = true);

-- 7. PAINEL_AGENDAMENTOS - Políticas para operação pública do totem
CREATE POLICY "Public can insert appointments via totem" 
ON public.painel_agendamentos 
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Public can view appointments via totem" 
ON public.painel_agendamentos 
FOR SELECT 
TO public
USING (true);

CREATE POLICY "Public can update appointments via totem" 
ON public.painel_agendamentos 
FOR UPDATE 
TO public
USING (true);

-- 8. CLIENT_PROFILES - Política para inserção pública (cadastro de novos clientes)
-- Já existe: "Clients can insert own profile" e "Public can view client profiles for totem search"
CREATE POLICY "Public can insert client profiles via totem" 
ON public.client_profiles 
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Public can update client profiles via totem" 
ON public.client_profiles 
FOR UPDATE 
TO public
USING (true);

-- 9. STAFF - Política para leitura pública (para exibir barbeiros no totem)
CREATE POLICY "Public can view active staff for totem" 
ON public.staff 
FOR SELECT 
TO public
USING (is_active = true);

-- 10. WORKING_HOURS - Política para leitura pública (para verificar horários)
CREATE POLICY "Public can view working hours for totem" 
ON public.working_hours 
FOR SELECT 
TO public
USING (is_active = true);

-- 11. TOTEM_AUTH - Política para atualizar último login
CREATE POLICY "Public can update totem auth last login" 
ON public.totem_auth 
FOR UPDATE 
TO public
USING (is_active = true);
