-- ============================================
-- CORREÇÃO DE VULNERABILIDADES CRÍTICAS
-- Apenas adicionar policies e índices
-- ============================================

-- 1. Adicionar policies RLS para tabelas sem policies
-- ============================================

-- Tabela: appointment_history
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'appointment_history' 
    AND policyname = 'Users can view their own appointment history'
  ) THEN
    CREATE POLICY "Users can view their own appointment history"
    ON public.appointment_history FOR SELECT
    TO authenticated
    USING (
      changed_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM appointments 
        WHERE appointments.id = appointment_history.appointment_id 
        AND (appointments.client_id = auth.uid() OR appointments.staff_id = auth.uid())
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'appointment_history' 
    AND policyname = 'Only system can insert appointment history'
  ) THEN
    CREATE POLICY "Only system can insert appointment history"
    ON public.appointment_history FOR INSERT
    TO authenticated
    WITH CHECK (changed_by = auth.uid());
  END IF;
END $$;

-- Tabela: barber_availability
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'barber_availability' 
    AND policyname = 'Anyone can view barber availability'
  ) THEN
    CREATE POLICY "Anyone can view barber availability"
    ON public.barber_availability FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'barber_availability' 
    AND policyname = 'Only staff can manage their availability'
  ) THEN
    CREATE POLICY "Only staff can manage their availability"
    ON public.barber_availability FOR INSERT
    TO authenticated
    WITH CHECK (barber_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'barber_availability' 
    AND policyname = 'Only staff can update their availability'
  ) THEN
    CREATE POLICY "Only staff can update their availability"
    ON public.barber_availability FOR UPDATE
    TO authenticated
    USING (barber_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'barber_availability' 
    AND policyname = 'Only staff can delete their availability'
  ) THEN
    CREATE POLICY "Only staff can delete their availability"
    ON public.barber_availability FOR DELETE
    TO authenticated
    USING (barber_id = auth.uid());
  END IF;
END $$;

-- Tabela: client_sessions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_sessions' 
    AND policyname = 'Users can only view their own sessions'
  ) THEN
    CREATE POLICY "Users can only view their own sessions"
    ON public.client_sessions FOR SELECT
    TO authenticated
    USING (client_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_sessions' 
    AND policyname = 'Users can only delete their own sessions'
  ) THEN
    CREATE POLICY "Users can only delete their own sessions"
    ON public.client_sessions FOR DELETE
    TO authenticated
    USING (client_id = auth.uid());
  END IF;
END $$;

-- 2. Adicionar índices para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON public.user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_role 
ON public.user_roles(role);

CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment_id
ON public.appointment_history(appointment_id);

CREATE INDEX IF NOT EXISTS idx_barber_availability_barber_id
ON public.barber_availability(barber_id);

CREATE INDEX IF NOT EXISTS idx_barber_availability_date
ON public.barber_availability(date);

CREATE INDEX IF NOT EXISTS idx_client_sessions_client_id
ON public.client_sessions(client_id);

CREATE INDEX IF NOT EXISTS idx_client_sessions_expires_at
ON public.client_sessions(expires_at);

-- 3. Comentários para documentação
-- ============================================
COMMENT ON TABLE public.user_roles IS 'Tabela de roles dos usuários - CRÍTICA PARA AUTENTICAÇÃO';
COMMENT ON COLUMN public.user_roles.user_id IS 'ID do usuário no auth.users';
COMMENT ON COLUMN public.user_roles.role IS 'Role do usuário: master, admin, manager, barber';
COMMENT ON INDEX idx_user_roles_user_id IS 'Índice para melhorar performance de queries por user_id';
COMMENT ON INDEX idx_user_roles_role IS 'Índice para melhorar performance de queries por role';
