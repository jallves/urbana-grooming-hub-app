
-- Criar função temporária para limpar dados do Thomas Jefferson
CREATE OR REPLACE FUNCTION public.cleanup_thomas_jefferson()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM appointment_ratings WHERE barber_id = 'ada214c2-3553-40d4-9460-af81b25cc95f';
  DELETE FROM appointment_totem_sessions WHERE appointment_id IN (
    SELECT id FROM painel_agendamentos WHERE barbeiro_id = 'ada214c2-3553-40d4-9460-af81b25cc95f'
  );
  DELETE FROM barber_commissions WHERE barber_id = 'ada214c2-3553-40d4-9460-af81b25cc95f';
  DELETE FROM comissoes WHERE barbeiro_id = 'ada214c2-3553-40d4-9460-af81b25cc95f';
  DELETE FROM financial_records WHERE barber_id = 'ada214c2-3553-40d4-9460-af81b25cc95f';
  DELETE FROM financial_transactions WHERE barber_id = 'ada214c2-3553-40d4-9460-af81b25cc95f';
  DELETE FROM totem_payments WHERE venda_id IN (
    SELECT id FROM vendas WHERE barbeiro_id = 'ada214c2-3553-40d4-9460-af81b25cc95f'
  );
  DELETE FROM painel_agendamentos WHERE barbeiro_id = 'ada214c2-3553-40d4-9460-af81b25cc95f';
  DELETE FROM vendas WHERE barbeiro_id = 'ada214c2-3553-40d4-9460-af81b25cc95f';
  DELETE FROM time_off WHERE barber_id = 'ada214c2-3553-40d4-9460-af81b25cc95f';
  DELETE FROM barber_availability WHERE barber_id = 'ada214c2-3553-40d4-9460-af81b25cc95f';
  DELETE FROM staff_module_access WHERE staff_id = '2b20a740-8e36-40a8-919c-2858d8d769ff';
  DELETE FROM painel_barbeiros WHERE id = 'ada214c2-3553-40d4-9460-af81b25cc95f';
  DELETE FROM staff WHERE id = '2b20a740-8e36-40a8-919c-2858d8d769ff';
  DELETE FROM employees WHERE id = 'd25a152d-17f3-4d50-bd43-a60aa61171f7';
  DELETE FROM active_sessions WHERE user_email = 'ursocara2@gmail.com';
END;
$$;

-- Executar a limpeza
SELECT public.cleanup_thomas_jefferson();

-- Remover a função temporária
DROP FUNCTION public.cleanup_thomas_jefferson();
