
CREATE OR REPLACE FUNCTION public.clear_checkout_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelado' AND (OLD.status IS DISTINCT FROM 'cancelado') THEN
    -- Clear totem status so it no longer appears as pending checkout
    NEW.status_totem := NULL;

    -- Mark linked totem sessions as cancelled
    UPDATE appointment_totem_sessions
    SET status = 'cancelled'
    WHERE appointment_id = NEW.id
      AND status NOT IN ('completed', 'cancelled');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_clear_checkout_on_cancel
BEFORE UPDATE ON public.painel_agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.clear_checkout_on_cancel();
