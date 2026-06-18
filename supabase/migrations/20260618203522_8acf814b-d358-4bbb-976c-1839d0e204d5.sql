
-- 1) Recriar triggers de sincronização (as funções já existem)
DROP TRIGGER IF EXISTS trg_sync_employee_to_staff ON public.employees;
CREATE TRIGGER trg_sync_employee_to_staff
AFTER INSERT OR UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.sync_employee_to_staff();

DROP TRIGGER IF EXISTS trg_sync_staff_to_painel_barbeiros ON public.staff;
CREATE TRIGGER trg_sync_staff_to_painel_barbeiros
AFTER INSERT OR UPDATE ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.sync_staff_to_painel_barbeiros();

DROP TRIGGER IF EXISTS trg_sync_staff_commission_to_painel ON public.staff;
CREATE TRIGGER trg_sync_staff_commission_to_painel
AFTER UPDATE OF commission_rate ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.sync_staff_commission_to_painel();

DROP TRIGGER IF EXISTS trg_sync_painel_commission_to_staff ON public.painel_barbeiros;
CREATE TRIGGER trg_sync_painel_commission_to_staff
BEFORE INSERT OR UPDATE ON public.painel_barbeiros
FOR EACH ROW EXECUTE FUNCTION public.sync_painel_commission_to_staff();

DROP TRIGGER IF EXISTS trg_clear_checkout_on_cancel ON public.painel_agendamentos;
CREATE TRIGGER trg_clear_checkout_on_cancel
BEFORE UPDATE ON public.painel_agendamentos
FOR EACH ROW EXECUTE FUNCTION public.clear_checkout_on_cancel();

-- 2) Backfill: criar painel_barbeiros faltantes para barbeiros ativos do staff
INSERT INTO public.painel_barbeiros (
  nome, email, telefone, image_url, foto_url,
  specialties, experience, commission_rate, taxa_comissao,
  is_active, ativo, role, staff_id
)
SELECT
  s.name, s.email, s.phone, s.image_url, s.image_url,
  s.specialties, s.experience, s.commission_rate, s.commission_rate,
  s.is_active, s.is_active, s.role, COALESCE(s.staff_id, s.id)
FROM public.staff s
WHERE s.role = 'barber'
  AND NOT EXISTS (
    SELECT 1 FROM public.painel_barbeiros pb
    WHERE pb.staff_id = COALESCE(s.staff_id, s.id)
       OR lower(trim(pb.email)) = lower(trim(s.email))
  );

-- 3) Corrigir painel_barbeiros sem staff_id preenchido
UPDATE public.painel_barbeiros pb
SET staff_id = COALESCE(s.staff_id, s.id),
    updated_at = now()
FROM public.staff s
WHERE pb.staff_id IS NULL
  AND lower(trim(pb.email)) = lower(trim(s.email));
