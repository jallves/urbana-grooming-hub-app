import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
);

const TZ = 'America/Sao_Paulo';

function nowInTz(): { date: string; minutes: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => fmt.find((p) => p.type === t)?.value || '00';
  const date = `${get('year')}-${get('month')}-${get('day')}`;
  const minutes = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
  return { date, minutes };
}

function toMinutes(hora: string): number {
  const [h, m] = String(hora || '00:00').split(':').map((v) => parseInt(v, 10) || 0);
  return h * 60 + m;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { date, minutes } = nowInTz();
    // Janela: 55–65 minutos à frente
    const windowStart = minutes + 55;
    const windowEnd = minutes + 65;

    const { data: rows, error } = await supabase
      .from('painel_agendamentos')
      .select('id, cliente_id, barbeiro_id, servico_id, data, hora, status, reminder_1h_sent_at')
      .eq('data', date)
      .in('status', ['agendado', 'confirmado'])
      .is('reminder_1h_sent_at', null);

    if (error) throw error;

    const due = (rows || []).filter((r: any) => {
      const m = toMinutes(r.hora);
      return m >= windowStart && m <= windowEnd;
    });

    let sent = 0;
    for (const ag of due) {
      let servico = 'Serviço';
      let barbeiro = 'Barbeiro';
      try {
        const { data: s } = await supabase.from('painel_servicos').select('nome').eq('id', ag.servico_id).maybeSingle();
        if (s?.nome) servico = s.nome;
      } catch {}
      try {
        const { data: b } = await supabase.from('painel_barbeiros').select('nome').eq('id', ag.barbeiro_id).maybeSingle();
        if (b?.nome) barbeiro = b.nome;
      } catch {}

      const payload = {
        title: '⏰ Seu agendamento é em 1 hora',
        body: `${servico} com ${barbeiro} às ${ag.hora}`,
        url: '/painel-cliente/agendamentos',
        tag: `ag-rem1h-${ag.id}`,
        requireInteraction: true,
      };

      if (ag.cliente_id) {
        await supabase.functions.invoke('send-push', {
          body: { target: { cliente_id: ag.cliente_id }, payload },
        });
      }

      await supabase
        .from('painel_agendamentos')
        .update({ reminder_1h_sent_at: new Date().toISOString() })
        .eq('id', ag.id);

      sent += 1;
    }

    return new Response(JSON.stringify({ ok: true, checked: rows?.length ?? 0, sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('send-appointment-push-reminders error', err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});