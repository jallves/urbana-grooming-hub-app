CREATE OR REPLACE FUNCTION public.barber_busy_intervals(p_barber_id uuid, p_date date)
RETURNS TABLE(appointment_id uuid, hora time without time zone, duracao integer, is_encaixe boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id,
         a.hora,
         public.appointment_total_duration(a.servico_id, a.servicos_extras) AS duracao,
         COALESCE(a.is_encaixe, false)
  FROM public.painel_agendamentos a
  WHERE a.barbeiro_id = p_barber_id
    AND a.data = p_date
    AND COALESCE(a.status, '') NOT IN ('cancelado', 'ausente');
$$;

GRANT EXECUTE ON FUNCTION public.barber_busy_intervals(uuid, date) TO anon, authenticated, service_role;