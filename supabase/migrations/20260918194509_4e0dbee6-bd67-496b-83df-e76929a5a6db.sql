ALTER TABLE public.painel_agendamentos
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'desconhecida',
  ADD COLUMN IF NOT EXISTS origem_user_id uuid,
  ADD COLUMN IF NOT EXISTS origem_device text;

CREATE INDEX IF NOT EXISTS idx_painel_agendamentos_origem ON public.painel_agendamentos(origem);
CREATE INDEX IF NOT EXISTS idx_painel_agendamentos_created_at ON public.painel_agendamentos(created_at DESC);

CREATE OR REPLACE FUNCTION public.set_appointment_origin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.origem IS NULL OR btrim(NEW.origem) = '' THEN
    NEW.origem := 'desconhecida';
  END IF;

  IF NEW.origem_user_id IS NULL THEN
    NEW.origem_user_id := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_appointment_origin ON public.painel_agendamentos;
CREATE TRIGGER trg_set_appointment_origin
BEFORE INSERT ON public.painel_agendamentos
FOR EACH ROW EXECUTE FUNCTION public.set_appointment_origin();