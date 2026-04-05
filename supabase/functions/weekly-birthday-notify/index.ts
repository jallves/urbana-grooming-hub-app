import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current week range (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Get month/day ranges for the week (handles year boundary)
    const startMonth = monday.getMonth() + 1;
    const startDay = monday.getDate();
    const endMonth = sunday.getMonth() + 1;
    const endDay = sunday.getDate();

    // Fetch all clients with birthdays
    const { data: clients, error } = await supabase
      .from('painel_clientes')
      .select('id, nome, data_nascimento, telefone')
      .not('data_nascimento', 'is', null);

    if (error) throw error;

    // Filter clients whose birthday falls in this week
    const birthdayClients = (clients || []).filter(client => {
      if (!client.data_nascimento) return false;
      const bdate = new Date(client.data_nascimento + 'T00:00:00');
      const bMonth = bdate.getMonth() + 1;
      const bDay = bdate.getDate();

      if (startMonth === endMonth) {
        return bMonth === startMonth && bDay >= startDay && bDay <= endDay;
      } else {
        // Week crosses month boundary
        return (bMonth === startMonth && bDay >= startDay) ||
               (bMonth === endMonth && bDay <= endDay);
      }
    });

    if (birthdayClients.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum aniversariante esta semana', count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build notification content
    const names = birthdayClients.map(c => {
      const bdate = new Date(c.data_nascimento + 'T00:00:00');
      const day = bdate.getDate().toString().padStart(2, '0');
      const month = (bdate.getMonth() + 1).toString().padStart(2, '0');
      return `${c.nome} (${day}/${month})`;
    });

    const title = `🎂 ${birthdayClients.length} aniversariante${birthdayClients.length > 1 ? 's' : ''} esta semana!`;
    const body = names.join(', ');

    // Get all admin user IDs
    const { data: admins } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('is_active', true)
      .not('user_id', 'is', null);

    // Get all barber user IDs (staff_id is their auth user id)
    const { data: barbers } = await supabase
      .from('painel_barbeiros')
      .select('staff_id')
      .eq('ativo', true)
      .not('staff_id', 'is', null);

    const userIds = new Set<string>();
    (admins || []).forEach(a => { if (a.user_id) userIds.add(a.user_id); });
    (barbers || []).forEach(b => { if (b.staff_id) userIds.add(b.staff_id); });

    // Create notifications for each user
    const weekKey = `${monday.getFullYear()}-W${getWeekNumber(monday)}`;
    
    const notifications = Array.from(userIds).map(userId => ({
      user_id: userId,
      title,
      body,
      type: 'birthday_week',
      is_read: false,
      data: {
        weekKey,
        birthdayClients: birthdayClients.map(c => ({
          id: c.id,
          nome: c.nome,
          data_nascimento: c.data_nascimento,
          telefone: c.telefone,
        })),
      },
    }));

    // Check if notifications already sent for this week
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('type', 'birthday_week')
      .contains('data', { weekKey })
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: 'Notificações já enviadas esta semana', count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({
      message: `Notificações criadas para ${userIds.size} usuários`,
      birthdayCount: birthdayClients.length,
      notifiedUsers: userIds.size,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getWeekNumber(d: Date): number {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - oneJan.getTime()) / 86400000);
  return Math.ceil((days + oneJan.getDay() + 1) / 7);
}
