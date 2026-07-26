-- Helper: dispara send-push via pg_net
CREATE OR REPLACE FUNCTION public.notify_push(target jsonb, payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  fn_url text := 'https://apizqnknnmjqpqovlkux.supabase.co/functions/v1/send-push';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaXpxbmtubm1qcXBxb3Zsa3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDk1OTAsImV4cCI6MjA4Mzg4NTU5MH0.6vCTm7Jb8c-FHxZRq06HseZBwecKLhBvRZ7bGFYK7a4';
BEGIN
  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||anon_key),
    body := jsonb_build_object('target', target, 'payload', payload)
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_push failed: %', SQLERRM;
END;
$$;

-- Trigger em painel_agendamentos: novo agendamento avisa barbeiro; alterações de status avisam cliente
CREATE OR REPLACE FUNCTION public.trg_push_agendamentos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_barbeiro_id uuid;
  v_cliente_id uuid;
  v_data text;
  v_hora text;
  v_servico text;
BEGIN
  v_data := to_char(COALESCE(NEW.data, CURRENT_DATE), 'DD/MM');
  v_hora := COALESCE(NEW.hora::text, '');
  v_servico := COALESCE(NEW.servico, 'Serviço');
  v_barbeiro_id := NEW.barbeiro_id;
  v_cliente_id := NEW.cliente_id;

  IF TG_OP = 'INSERT' THEN
    -- Avisa barbeiro
    IF v_barbeiro_id IS NOT NULL THEN
      PERFORM public.notify_push(
        jsonb_build_object('barbeiro_id', v_barbeiro_id),
        jsonb_build_object(
          'title', 'Novo agendamento',
          'body', v_data || ' às ' || v_hora || ' — ' || COALESCE(NEW.cliente_nome,'Cliente'),
          'url', '/barbeiro/agendamentos',
          'tag', 'ag-'||NEW.id
        )
      );
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Cliente: notificar mudança de status
    IF NEW.status IS DISTINCT FROM OLD.status AND v_cliente_id IS NOT NULL THEN
      IF NEW.status = 'confirmado' THEN
        PERFORM public.notify_push(
          jsonb_build_object('cliente_id', v_cliente_id),
          jsonb_build_object(
            'title', 'Agendamento confirmado ✅',
            'body', v_servico||' em '||v_data||' às '||v_hora,
            'url', '/painel-cliente/agendamentos',
            'tag', 'ag-'||NEW.id
          )
        );
      ELSIF NEW.status = 'cancelado' THEN
        PERFORM public.notify_push(
          jsonb_build_object('cliente_id', v_cliente_id),
          jsonb_build_object(
            'title', 'Agendamento cancelado',
            'body', v_servico||' em '||v_data||' às '||v_hora,
            'url', '/painel-cliente/agendamentos',
            'tag', 'ag-'||NEW.id
          )
        );
      ELSIF NEW.status = 'chegou' AND v_barbeiro_id IS NOT NULL THEN
        -- Barbeiro: cliente fez check-in
        PERFORM public.notify_push(
          jsonb_build_object('barbeiro_id', v_barbeiro_id),
          jsonb_build_object(
            'title', 'Cliente chegou 👋',
            'body', COALESCE(NEW.cliente_nome,'Cliente')||' — '||v_hora,
            'url', '/barbeiro/agendamentos',
            'tag', 'ci-'||NEW.id
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS push_agendamentos_trigger ON public.painel_agendamentos;
CREATE TRIGGER push_agendamentos_trigger
  AFTER INSERT OR UPDATE ON public.painel_agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.trg_push_agendamentos();

-- Trigger em painel_clientes: novo cliente avisa admins
CREATE OR REPLACE FUNCTION public.trg_push_novo_cliente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_push(
    jsonb_build_object('role','admin'),
    jsonb_build_object(
      'title','Novo cliente cadastrado',
      'body', COALESCE(NEW.nome,'Cliente')||' acabou de se cadastrar',
      'url','/admin/clients',
      'tag','cli-'||NEW.id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS push_novo_cliente_trigger ON public.painel_clientes;
CREATE TRIGGER push_novo_cliente_trigger
  AFTER INSERT ON public.painel_clientes
  FOR EACH ROW EXECUTE FUNCTION public.trg_push_novo_cliente();