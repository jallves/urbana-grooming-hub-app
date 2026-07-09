
-- Add coupon fields to painel_agendamentos
ALTER TABLE public.painel_agendamentos
  ADD COLUMN IF NOT EXISTS cupom_codigo text,
  ADD COLUMN IF NOT EXISTS cupom_id uuid REFERENCES public.discount_coupons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS desconto_valor numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_original numeric,
  ADD COLUMN IF NOT EXISTS valor_final numeric;

-- RLS: allow authenticated users to read active coupons (needed to validate by code)
DROP POLICY IF EXISTS "Authenticated can view active coupons" ON public.discount_coupons;
CREATE POLICY "Authenticated can view active coupons"
  ON public.discount_coupons
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RPC: validate coupon and compute discount without incrementing usage
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_service_price numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_discount numeric;
  v_final numeric;
BEGIN
  SELECT * INTO v_coupon
  FROM public.discount_coupons
  WHERE upper(code) = upper(trim(p_code))
  LIMIT 1;

  IF v_coupon IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cupom não encontrado');
  END IF;

  IF COALESCE(v_coupon.is_active, false) = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cupom inativo');
  END IF;

  IF v_coupon.valid_from IS NOT NULL AND v_coupon.valid_from > CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cupom ainda não é válido');
  END IF;

  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cupom expirado');
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND COALESCE(v_coupon.current_uses, 0) >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cupom esgotado');
  END IF;

  IF v_coupon.min_amount IS NOT NULL AND p_service_price < v_coupon.min_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor mínimo do serviço não atingido');
  END IF;

  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := ROUND(p_service_price * (v_coupon.discount_value / 100.0), 2);
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;

  v_discount := LEAST(v_discount, p_service_price);
  v_final := GREATEST(p_service_price - v_discount, 0);

  RETURN jsonb_build_object(
    'success', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'discount_amount', v_discount,
    'original_amount', p_service_price,
    'final_amount', v_final
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO anon, authenticated;

-- Trigger to increment/decrement current_uses based on appointment lifecycle
CREATE OR REPLACE FUNCTION public.sync_coupon_usage_on_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.cupom_id IS NOT NULL AND COALESCE(NEW.status, '') <> 'cancelado' THEN
      UPDATE public.discount_coupons
        SET current_uses = COALESCE(current_uses, 0) + 1, updated_at = now()
        WHERE id = NEW.cupom_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- appointment cancelled: release coupon
    IF NEW.cupom_id IS NOT NULL
       AND NEW.status = 'cancelado'
       AND COALESCE(OLD.status, '') <> 'cancelado' THEN
      UPDATE public.discount_coupons
        SET current_uses = GREATEST(COALESCE(current_uses, 0) - 1, 0), updated_at = now()
        WHERE id = NEW.cupom_id;
    -- appointment reactivated
    ELSIF NEW.cupom_id IS NOT NULL
       AND OLD.status = 'cancelado'
       AND COALESCE(NEW.status, '') <> 'cancelado' THEN
      UPDATE public.discount_coupons
        SET current_uses = COALESCE(current_uses, 0) + 1, updated_at = now()
        WHERE id = NEW.cupom_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.cupom_id IS NOT NULL AND COALESCE(OLD.status, '') <> 'cancelado' THEN
      UPDATE public.discount_coupons
        SET current_uses = GREATEST(COALESCE(current_uses, 0) - 1, 0), updated_at = now()
        WHERE id = OLD.cupom_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_coupon_usage ON public.painel_agendamentos;
CREATE TRIGGER trg_sync_coupon_usage
  AFTER INSERT OR UPDATE OF status OR DELETE
  ON public.painel_agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.sync_coupon_usage_on_appointment();
