
REVOKE ALL ON FUNCTION public.prevent_appointment_overlap() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.appointment_total_duration(uuid, jsonb) FROM PUBLIC, anon, authenticated;
