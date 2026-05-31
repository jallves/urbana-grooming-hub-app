
-- 1) Função: staff -> painel_barbeiros
CREATE OR REPLACE FUNCTION public.sync_staff_commission_to_painel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.commission_rate IS NOT DISTINCT FROM OLD.commission_rate THEN
    RETURN NEW;
  END IF;

  UPDATE public.painel_barbeiros pb
  SET commission_rate = NEW.commission_rate,
      taxa_comissao   = NEW.commission_rate,
      updated_at      = now()
  WHERE (pb.staff_id = NEW.id)
     OR (NEW.email IS NOT NULL AND lower(trim(pb.email)) = lower(trim(NEW.email)))
     OR (lower(trim(pb.nome)) = lower(trim(NEW.name)));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_staff_commission_to_painel ON public.staff;
CREATE TRIGGER trg_sync_staff_commission_to_painel
AFTER INSERT OR UPDATE OF commission_rate ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.sync_staff_commission_to_painel();

-- 2) Função: painel_barbeiros -> staff
CREATE OR REPLACE FUNCTION public.sync_painel_commission_to_staff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate NUMERIC;
BEGIN
  -- Usa commission_rate como fonte; cai para taxa_comissao se nulo
  v_rate := COALESCE(NEW.commission_rate, NEW.taxa_comissao);

  IF v_rate IS NULL THEN
    RETURN NEW;
  END IF;

  -- Mantém os dois campos do painel iguais
  IF NEW.commission_rate IS DISTINCT FROM v_rate OR NEW.taxa_comissao IS DISTINCT FROM v_rate THEN
    NEW.commission_rate := v_rate;
    NEW.taxa_comissao   := v_rate;
  END IF;

  UPDATE public.staff s
  SET commission_rate = v_rate,
      updated_at = now()
  WHERE (s.id = NEW.staff_id)
     OR (NEW.email IS NOT NULL AND lower(trim(s.email)) = lower(trim(NEW.email)))
     OR (lower(trim(s.name)) = lower(trim(NEW.nome)));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_painel_commission_to_staff ON public.painel_barbeiros;
CREATE TRIGGER trg_sync_painel_commission_to_staff
BEFORE INSERT OR UPDATE OF commission_rate, taxa_comissao ON public.painel_barbeiros
FOR EACH ROW EXECUTE FUNCTION public.sync_painel_commission_to_staff();

-- 3) Normalização imediata (usa staff como fonte da verdade atual)
UPDATE public.painel_barbeiros pb
SET commission_rate = s.commission_rate,
    taxa_comissao   = s.commission_rate,
    updated_at      = now()
FROM public.staff s
WHERE s.commission_rate IS NOT NULL
  AND (
    pb.staff_id = s.id
    OR (s.email IS NOT NULL AND lower(trim(pb.email)) = lower(trim(s.email)))
    OR lower(trim(pb.nome)) = lower(trim(s.name))
  )
  AND (pb.commission_rate IS DISTINCT FROM s.commission_rate
       OR pb.taxa_comissao IS DISTINCT FROM s.commission_rate);
