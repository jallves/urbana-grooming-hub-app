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
BEGIN
  v_data := to_char(COALESCE(NEW.data, CURRENT_DATE), 'DD/MM');
  v_hora := COALESCE(NEW.hora::text, '');
  v_barbeiro_id := NEW.barbeiro_id;
  v_cliente_id := NEW.cliente_id;

  -- Buscar nome do serviço via servico_id
  BEGIN
    SELECT COALESCE(nome, 'Serviço') INTO v_servico
    FROM painel_servicos WHERE id = NEW.servico_id LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_servico := 'Serviço';
  END;
  v_servico := COALESCE(v_servico, 'Serviço');

  -- Buscar nome do cliente via cliente_id
  BEGIN
    SELECT COALESCE(nome, 'Cliente') INTO v_cliente_nome
    FROM painel_clientes WHERE id = NEW.cliente_id LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_cliente_nome := 'Cliente';
  END;
  v_cliente_nome := COALESCE(v_cliente_nome, 'Cliente');

  IF TG_OP = 'INSERT' THEN
    IF v_barbeiro_id IS NOT NULL THEN
      PERFORM public.notify_push(
        jsonb_build_object('barbeiro_id', v_barbeiro_id),
        jsonb_build_object(
          'title', 'Novo agendamento',
          'body', v_data || ' às ' || v_hora || ' — ' || v_cliente_nome,
          'url', '/barbeiro/agendamentos',
          'tag', 'ag-'||NEW.id
        )
      );
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
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
        PERFORM public.notify_push(
          jsonb_build_object('barbeiro_id', v_barbeiro_id),
          jsonb_build_object(
            'title', 'Cliente chegou 👋',
            'body', v_cliente_nome||' — '||v_hora,
            'url', '/barbeiro/agendamentos',
            'tag', 'ci-'||NEW.id
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;