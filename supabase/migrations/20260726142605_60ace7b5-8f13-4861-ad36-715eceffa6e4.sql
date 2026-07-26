
CREATE OR REPLACE FUNCTION public.trg_push_agendamentos()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_barbeiro_id uuid;
  v_cliente_id uuid;
  v_data text;
  v_hora text;
  v_servico text;
  v_cliente_nome text;
  v_barbeiro_nome text;
BEGIN
  v_data := to_char(COALESCE(NEW.data, CURRENT_DATE), 'DD/MM');
  v_hora := COALESCE(NEW.hora::text, '');
  v_barbeiro_id := NEW.barbeiro_id;
  v_cliente_id := NEW.cliente_id;

  BEGIN
    SELECT COALESCE(nome, 'Serviço') INTO v_servico
    FROM painel_servicos WHERE id = NEW.servico_id LIMIT 1;
  EXCEPTION WHEN OTHERS THEN v_servico := 'Serviço'; END;
  v_servico := COALESCE(v_servico, 'Serviço');

  BEGIN
    SELECT COALESCE(nome, 'Cliente') INTO v_cliente_nome
    FROM painel_clientes WHERE id = NEW.cliente_id LIMIT 1;
  EXCEPTION WHEN OTHERS THEN v_cliente_nome := 'Cliente'; END;
  v_cliente_nome := COALESCE(v_cliente_nome, 'Cliente');

  BEGIN
    SELECT COALESCE(nome, 'Barbeiro') INTO v_barbeiro_nome
    FROM painel_barbeiros WHERE id = NEW.barbeiro_id LIMIT 1;
  EXCEPTION WHEN OTHERS THEN v_barbeiro_nome := 'Barbeiro'; END;
  v_barbeiro_nome := COALESCE(v_barbeiro_nome, 'Barbeiro');

  IF TG_OP = 'INSERT' THEN
    -- Barbeiro
    IF v_barbeiro_id IS NOT NULL THEN
      PERFORM public.notify_push(
        jsonb_build_object('barbeiro_id', v_barbeiro_id),
        jsonb_build_object(
          'title', 'Novo agendamento',
          'body', v_data || ' às ' || v_hora || ' — ' || v_cliente_nome,
          'url', '/barbeiro/agendamentos',
          'tag', 'ag-new-b-'||NEW.id
        )
      );
    END IF;

    -- Admin (todos)
    PERFORM public.notify_push(
      jsonb_build_object('role','admin'),
      jsonb_build_object(
        'title','Novo agendamento',
        'body', v_cliente_nome||' — '||v_servico||' com '||v_barbeiro_nome||' em '||v_data||' às '||v_hora,
        'url','/admin/appointments',
        'tag','ag-new-a-'||NEW.id
      )
    );

    -- Cliente confirmação de criação
    IF v_cliente_id IS NOT NULL THEN
      PERFORM public.notify_push(
        jsonb_build_object('cliente_id', v_cliente_id),
        jsonb_build_object(
          'title','Agendamento criado 📅',
          'body', v_servico||' com '||v_barbeiro_nome||' em '||v_data||' às '||v_hora,
          'url','/painel-cliente/agendamentos',
          'tag','ag-new-c-'||NEW.id
        )
      );
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      -- Admin em qualquer mudança de status
      PERFORM public.notify_push(
        jsonb_build_object('role','admin'),
        jsonb_build_object(
          'title','Status atualizado: '||NEW.status,
          'body', v_cliente_nome||' — '||v_servico||' com '||v_barbeiro_nome||' em '||v_data||' às '||v_hora,
          'url','/admin/appointments',
          'tag','ag-st-a-'||NEW.id||'-'||NEW.status
        )
      );

      IF NEW.status = 'confirmado' AND v_cliente_id IS NOT NULL THEN
        PERFORM public.notify_push(
          jsonb_build_object('cliente_id', v_cliente_id),
          jsonb_build_object(
            'title','Agendamento confirmado ✅',
            'body', v_servico||' em '||v_data||' às '||v_hora,
            'url','/painel-cliente/agendamentos',
            'tag','ag-conf-'||NEW.id
          )
        );
      ELSIF NEW.status = 'cancelado' AND v_cliente_id IS NOT NULL THEN
        PERFORM public.notify_push(
          jsonb_build_object('cliente_id', v_cliente_id),
          jsonb_build_object(
            'title','Agendamento cancelado',
            'body', v_servico||' em '||v_data||' às '||v_hora,
            'url','/painel-cliente/agendamentos',
            'tag','ag-canc-'||NEW.id
          )
        );
      ELSIF NEW.status IN ('chegou','confirmado') AND v_barbeiro_id IS NOT NULL AND NEW.status = 'chegou' THEN
        PERFORM public.notify_push(
          jsonb_build_object('barbeiro_id', v_barbeiro_id),
          jsonb_build_object(
            'title','Cliente chegou 👋',
            'body', v_cliente_nome||' — '||v_hora,
            'url','/barbeiro/agendamentos',
            'tag','ci-'||NEW.id
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Coluna para deduplicar lembrete 1h antes
ALTER TABLE public.painel_agendamentos
  ADD COLUMN IF NOT EXISTS reminder_1h_sent_at timestamptz;

-- Cron a cada 5 min chamando edge function de lembretes push
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'push-appointment-reminder-1h') THEN
    PERFORM cron.unschedule('push-appointment-reminder-1h');
  END IF;
  PERFORM cron.schedule(
    'push-appointment-reminder-1h',
    '*/5 * * * *',
    $CRON$
    SELECT net.http_post(
      url:='https://apizqnknnmjqpqovlkux.supabase.co/functions/v1/send-appointment-push-reminders',
      headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaXpxbmtubm1qcXBxb3Zsa3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDk1OTAsImV4cCI6MjA4Mzg4NTU5MH0.6vCTm7Jb8c-FHxZRq06HseZBwecKLhBvRZ7bGFYK7a4"}'::jsonb,
      body:='{"source":"cron"}'::jsonb
    );
    $CRON$
  );
END $$;
