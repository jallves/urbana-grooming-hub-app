DO $$
DECLARE r record; q text; c text; s text;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname, qual, with_check FROM pg_policies
           WHERE schemaname='public' AND (coalesce(qual,'')||coalesce(with_check,'')) ~ '(is_admin_or_higher|is_barber_admin)\(auth\.uid\(\)\)'
  LOOP
    q := regexp_replace(r.qual, '(is_admin_or_higher|is_barber_admin)\(auth\.uid\(\)\)', '(SELECT \1((SELECT auth.uid())))', 'g');
    c := regexp_replace(r.with_check, '(is_admin_or_higher|is_barber_admin)\(auth\.uid\(\)\)', '(SELECT \1((SELECT auth.uid())))', 'g');
    s := format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    IF q IS NOT NULL THEN s := s || ' USING (' || q || ')'; END IF;
    IF c IS NOT NULL THEN s := s || ' WITH CHECK (' || c || ')'; END IF;
    EXECUTE s;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_contas_pagar_venc ON public.contas_pagar(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON public.contas_pagar(status);
CREATE INDEX IF NOT EXISTS idx_contas_receber_venc ON public.contas_receber(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_vendas_created_status ON public.vendas(created_at, status);
CREATE INDEX IF NOT EXISTS idx_barber_comm_tipo_created ON public.barber_commissions(tipo, created_at);
CREATE INDEX IF NOT EXISTS idx_fin_records_date ON public.financial_records(transaction_date);
CREATE INDEX IF NOT EXISTS idx_agend_status ON public.painel_agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agend_cliente_data ON public.painel_agendamentos(cliente_id, data);