
CREATE OR REPLACE FUNCTION public.appointment_total_duration(p_servico_id uuid, p_extras jsonb)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT duracao FROM public.painel_servicos WHERE id = p_servico_id), 30)
       + COALESCE((
           SELECT SUM(COALESCE((e->>'duracao')::int, 30))
           FROM jsonb_array_elements(
             CASE WHEN jsonb_typeof(p_extras) = 'array' THEN p_extras ELSE '[]'::jsonb END
           ) AS e
         ), 0);
$$;

CREATE OR REPLACE FUNCTION public.prevent_appointment_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start int;
  v_end int;
  v_dur int;
  v_conflicts int;
  v_encaixes int;
BEGIN
  IF NEW.status IN ('cancelado', 'faltou', 'nao_compareceu') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.barbeiro_id IS NOT DISTINCT FROM OLD.barbeiro_id
     AND NEW.data IS NOT DISTINCT FROM OLD.data
     AND NEW.hora IS NOT DISTINCT FROM OLD.hora
     AND NEW.servico_id IS NOT DISTINCT FROM OLD.servico_id
     AND NEW.servicos_extras IS NOT DISTINCT FROM OLD.servicos_extras
     AND OLD.status NOT IN ('cancelado', 'faltou', 'nao_compareceu') THEN
    RETURN NEW;
  END IF;

  IF NEW.barbeiro_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_dur := public.appointment_total_duration(NEW.servico_id, NEW.servicos_extras);
  v_start := EXTRACT(HOUR FROM NEW.hora)::int * 60 + EXTRACT(MINUTE FROM NEW.hora)::int;
  v_end := v_start + v_dur;

  SELECT
    COUNT(*) FILTER (WHERE NOT COALESCE(a.is_encaixe, false)),
    COUNT(*) FILTER (WHERE COALESCE(a.is_encaixe, false))
  INTO v_conflicts, v_encaixes
  FROM public.painel_agendamentos a
  WHERE a.id <> NEW.id
    AND a.barbeiro_id = NEW.barbeiro_id
    AND a.data = NEW.data
    AND a.status NOT IN ('cancelado', 'faltou', 'nao_compareceu')
    AND v_start < (EXTRACT(HOUR FROM a.hora)::int * 60 + EXTRACT(MINUTE FROM a.hora)::int
                   + public.appointment_total_duration(a.servico_id, a.servicos_extras))
    AND v_end > (EXTRACT(HOUR FROM a.hora)::int * 60 + EXTRACT(MINUTE FROM a.hora)::int);

  IF COALESCE(NEW.is_encaixe, false) THEN
    IF v_encaixes >= 1 THEN
      RAISE EXCEPTION 'Já existe um encaixe neste horário para este barbeiro. Escolha outro horário.'
        USING ERRCODE = '23505';
    END IF;
    RETURN NEW;
  END IF;

  IF v_conflicts > 0 THEN
    RAISE EXCEPTION 'Este horário já está ocupado para este barbeiro. Escolha outro horário ou marque como encaixe.'
      USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_appointment_overlap ON public.painel_agendamentos;
CREATE TRIGGER trg_prevent_appointment_overlap
BEFORE INSERT OR UPDATE ON public.painel_agendamentos
FOR EACH ROW EXECUTE FUNCTION public.prevent_appointment_overlap();
