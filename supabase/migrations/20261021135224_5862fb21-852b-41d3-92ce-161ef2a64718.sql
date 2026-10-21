ALTER POLICY "Barbers can update own appointments" ON public.painel_agendamentos
USING (private.is_this_barber(barbeiro_id))
WITH CHECK (private.is_this_barber(barbeiro_id));

-- Regression: exercise UPDATE planning under authenticated RLS, without changing rows.
DO $test$
DECLARE affected integer;
BEGIN
  PERFORM set_config('request.jwt.claims', '{"sub":"adc11c3c-1e4a-4547-bfa2-325046ee1c3c","role":"authenticated"}', true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF NOT public.is_admin_or_higher(auth.uid()) THEN
    RAISE EXCEPTION 'Regression: Renatta must retain administrator access';
  END IF;
  UPDATE public.painel_agendamentos SET data = data, hora = hora WHERE false;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Regression test must not modify appointments'; END IF;
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', '{}', true);
END
$test$;