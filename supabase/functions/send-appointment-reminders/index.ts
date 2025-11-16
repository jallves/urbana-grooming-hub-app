import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'mailto:contato@costaurbana.com';

interface Appointment {
  id: string;
  cliente_id: string;
  barbeiro_id: string;
  servico_id: string;
  data: string;
  hora: string;
  status: string;
  cliente: {
    nome: string;
    email: string;
  };
  barbeiro: {
    nome: string;
  };
  servico: {
    nome: string;
  };
}

interface PushToken {
  id: string;
  client_id: string;
  subscription_data: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendPushNotification(
  subscription: PushToken['subscription_data'],
  title: string,
  body: string,
  data: any
) {
  try {
    const payload = JSON.stringify({
      title,
      body,
      ...data,
    });

    // Importa a biblioteca web-push
    const webpush = await import('https://esm.sh/web-push@3.6.6');

    webpush.setVapidDetails(
      vapidEmail,
      vapidPublicKey,
      vapidPrivateKey
    );

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      payload
    );

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar notificação push:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calcula os horários de verificação
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in4Hours = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    // Formata datas para comparação (YYYY-MM-DD)
    const date24h = in24Hours.toISOString().split('T')[0];
    const date4h = in4Hours.toISOString().split('T')[0];

    // Formata horas para comparação (HH:MM)
    const time24h = in24Hours.toTimeString().substring(0, 5);
    const time4h = in4Hours.toTimeString().substring(0, 5);

    console.log('Verificando agendamentos para:', { date24h, time24h, date4h, time4h });

    // Busca agendamentos que precisam de notificação
    // Para 24 horas antes
    const { data: appointments24h, error: error24h } = await supabase
      .from('painel_agendamentos')
      .select(`
        id,
        cliente_id,
        barbeiro_id,
        servico_id,
        data,
        hora,
        status,
        cliente:painel_clientes!cliente_id (nome, email),
        barbeiro:painel_barbeiros!barbeiro_id (nome),
        servico:painel_servicos!servico_id (nome)
      `)
      .eq('status', 'confirmado')
      .eq('data', date24h)
      .gte('hora', time24h)
      .lte('hora', `${time24h.split(':')[0]}:59`);

    if (error24h) throw error24h;

    // Para 4 horas antes
    const { data: appointments4h, error: error4h } = await supabase
      .from('painel_agendamentos')
      .select(`
        id,
        cliente_id,
        barbeiro_id,
        servico_id,
        data,
        hora,
        status,
        cliente:painel_clientes!cliente_id (nome, email),
        barbeiro:painel_barbeiros!barbeiro_id (nome),
        servico:painel_servicos!servico_id (nome)
      `)
      .eq('status', 'confirmado')
      .eq('data', date4h)
      .gte('hora', time4h)
      .lte('hora', `${time4h.split(':')[0]}:59`);

    if (error4h) throw error4h;

    const results = {
      sent24h: 0,
      sent4h: 0,
      failed: 0,
      skipped: 0,
    };

    // Processa notificações de 24 horas
    if (appointments24h && appointments24h.length > 0) {
      for (const appointment of appointments24h as Appointment[]) {
        // Verifica se já enviou notificação
        const { data: existingLog } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('appointment_id', appointment.id)
          .eq('notification_type', '24h_before')
          .single();

        if (existingLog) {
          results.skipped++;
          continue;
        }

        // Busca tokens de push do cliente
        const { data: tokens } = await supabase
          .from('push_notification_tokens')
          .select('*')
          .eq('client_id', appointment.cliente_id)
          .eq('is_active', true);

        if (!tokens || tokens.length === 0) {
          results.skipped++;
          continue;
        }

        const dateFormatted = new Date(appointment.data).toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
        });

        for (const token of tokens as PushToken[]) {
          const result = await sendPushNotification(
            token.subscription_data,
            '⏰ Lembrete: Agendamento Amanhã',
            `Seu ${appointment.servico.nome} com ${appointment.barbeiro.nome} está agendado para ${dateFormatted} às ${appointment.hora}. Te esperamos!`,
            {
              url: '/painel-cliente/agendamentos',
              appointmentId: appointment.id,
              tag: `appointment-${appointment.id}-24h`,
            }
          );

          if (result.success) {
            results.sent24h++;
          } else {
            results.failed++;
          }
        }

        // Registra log
        await supabase.from('notification_logs').insert({
          appointment_id: appointment.id,
          client_id: appointment.cliente_id,
          notification_type: '24h_before',
          status: 'sent',
        });
      }
    }

    // Processa notificações de 4 horas
    if (appointments4h && appointments4h.length > 0) {
      for (const appointment of appointments4h as Appointment[]) {
        // Verifica se já enviou notificação
        const { data: existingLog } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('appointment_id', appointment.id)
          .eq('notification_type', '4h_before')
          .single();

        if (existingLog) {
          results.skipped++;
          continue;
        }

        // Busca tokens de push do cliente
        const { data: tokens } = await supabase
          .from('push_notification_tokens')
          .select('*')
          .eq('client_id', appointment.cliente_id)
          .eq('is_active', true);

        if (!tokens || tokens.length === 0) {
          results.skipped++;
          continue;
        }

        for (const token of tokens as PushToken[]) {
          const result = await sendPushNotification(
            token.subscription_data,
            '⏰ Último Aviso: Agendamento em 4 Horas',
            `Seu ${appointment.servico.nome} com ${appointment.barbeiro.nome} é hoje às ${appointment.hora}. Não se esqueça! Você pode cancelar pelo painel até 3h antes.`,
            {
              url: '/painel-cliente/agendamentos',
              appointmentId: appointment.id,
              tag: `appointment-${appointment.id}-4h`,
            }
          );

          if (result.success) {
            results.sent4h++;
          } else {
            results.failed++;
          }
        }

        // Registra log
        await supabase.from('notification_logs').insert({
          appointment_id: appointment.id,
          client_id: appointment.cliente_id,
          notification_type: '4h_before',
          status: 'sent',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Notificações processadas: ${results.sent24h} (24h) + ${results.sent4h} (4h) enviadas, ${results.failed} falhas, ${results.skipped} ignoradas`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro ao processar lembretes:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
