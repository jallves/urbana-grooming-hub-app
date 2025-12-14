-- Remover a versão da função que recebe TIME (manter apenas a versão TEXT)
DROP FUNCTION IF EXISTS public.check_barber_slot_availability(uuid, date, time without time zone, integer, uuid);
