import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 7 days from now
    const sevenDays = new Date(today);
    sevenDays.setDate(sevenDays.getDate() + 7);
    const sevenDaysStr = sevenDays.toISOString().split('T')[0];

    // Find active subscriptions with next_billing_date within 7 days
    const { data: expiringSubs, error: subsError } = await supabase
      .from('client_subscriptions')
      .select('id, client_id, plan_id, next_billing_date, credits_used, credits_total')
      .eq('status', 'active')
      .gte('next_billing_date', todayStr)
      .lte('next_billing_date', sevenDaysStr);

    if (subsError) throw subsError;

    if (!expiringSubs || expiringSubs.length === 0) {
      return new Response(JSON.stringify({ message: 'No expiring subscriptions', processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch client and plan details
    const clientIds = [...new Set(expiringSubs.map(s => s.client_id))];
    const planIds = [...new Set(expiringSubs.map(s => s.plan_id))];

    const [clientsRes, plansRes] = await Promise.all([
      supabase.from('painel_clientes').select('id, nome, user_id').in('id', clientIds),
      supabase.from('subscription_plans').select('id, name, price').in('id', planIds),
    ]);

    const clientMap = Object.fromEntries((clientsRes.data || []).map(c => [c.id, c]));
    const planMap = Object.fromEntries((plansRes.data || []).map(p => [p.id, p]));

    // Check which notifications were already sent today to avoid duplicates
    const { data: existingNotifs } = await supabase
      .from('notifications')
      .select('data')
      .eq('type', 'subscription_renewal')
      .gte('created_at', `${todayStr}T00:00:00`);

    const alreadyNotified = new Set(
      (existingNotifs || []).map(n => (n.data as any)?.subscription_id).filter(Boolean)
    );

    const notificationsToInsert: any[] = [];

    for (const sub of expiringSubs) {
      if (alreadyNotified.has(sub.id)) continue;

      const client = clientMap[sub.client_id];
      const plan = planMap[sub.plan_id];
      if (!client || !plan) continue;

      const daysUntil = Math.ceil(
        (new Date(sub.next_billing_date!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const daysText = daysUntil === 0 ? 'hoje' : daysUntil === 1 ? 'amanhã' : `em ${daysUntil} dias`;
      const creditsRemaining = sub.credits_total - sub.credits_used;

      // Client notification
      if (client.user_id) {
        notificationsToInsert.push({
          user_id: client.user_id,
          title: `🔔 Assinatura vence ${daysText}`,
          body: `Seu plano ${plan.name} (R$ ${plan.price.toFixed(2)}) vence ${daysText}. Créditos restantes: ${creditsRemaining}/${sub.credits_total}.`,
          type: 'subscription_renewal',
          data: {
            subscription_id: sub.id,
            plan_name: plan.name,
            next_billing_date: sub.next_billing_date,
            days_until: daysUntil,
            credits_remaining: creditsRemaining,
            target: 'client',
          },
        });
      }

      // Admin notification (user_id = null means global/admin)
      notificationsToInsert.push({
        user_id: null,
        title: `📋 Renovação: ${client.nome}`,
        body: `Assinatura ${plan.name} de ${client.nome} vence ${daysText}. Valor: R$ ${plan.price.toFixed(2)}. Créditos usados: ${sub.credits_used}/${sub.credits_total}.`,
        type: 'subscription_renewal',
        data: {
          subscription_id: sub.id,
          client_id: sub.client_id,
          client_name: client.nome,
          plan_name: plan.name,
          plan_price: plan.price,
          next_billing_date: sub.next_billing_date,
          days_until: daysUntil,
          credits_used: sub.credits_used,
          credits_total: sub.credits_total,
          target: 'admin',
        },
      });
    }

    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notificationsToInsert);
      if (insertError) throw insertError;
    }

    // Also check for OVERDUE subscriptions (next_billing_date < today)
    const { data: overdueSubs } = await supabase
      .from('client_subscriptions')
      .select('id, client_id, plan_id, next_billing_date')
      .eq('status', 'active')
      .lt('next_billing_date', todayStr);

    const overdueNotifications: any[] = [];
    if (overdueSubs && overdueSubs.length > 0) {
      const overdueClientIds = [...new Set(overdueSubs.map(s => s.client_id))];
      const overduePlanIds = [...new Set(overdueSubs.map(s => s.plan_id))];

      const [ocRes, opRes] = await Promise.all([
        supabase.from('painel_clientes').select('id, nome').in('id', overdueClientIds),
        supabase.from('subscription_plans').select('id, name, price').in('id', overduePlanIds),
      ]);

      const ocMap = Object.fromEntries((ocRes.data || []).map(c => [c.id, c]));
      const opMap = Object.fromEntries((opRes.data || []).map(p => [p.id, p]));

      for (const sub of overdueSubs) {
        if (alreadyNotified.has(`overdue-${sub.id}`)) continue;

        const client = ocMap[sub.client_id];
        const plan = opMap[sub.plan_id];
        if (!client || !plan) continue;

        overdueNotifications.push({
          user_id: null,
          title: `⚠️ Assinatura Vencida: ${client.nome}`,
          body: `Plano ${plan.name} de ${client.nome} está vencido desde ${sub.next_billing_date}. Valor: R$ ${plan.price.toFixed(2)}.`,
          type: 'subscription_overdue',
          data: {
            subscription_id: `overdue-${sub.id}`,
            client_name: client.nome,
            plan_name: plan.name,
            next_billing_date: sub.next_billing_date,
            target: 'admin',
          },
        });
      }

      if (overdueNotifications.length > 0) {
        await supabase.from('notifications').insert(overdueNotifications);
      }
    }

    const totalProcessed = notificationsToInsert.length + overdueNotifications.length;

    return new Response(
      JSON.stringify({
        message: `Processed ${totalProcessed} notifications`,
        expiring: expiringSubs.length,
        overdue: overdueSubs?.length || 0,
        notifications_sent: totalProcessed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking subscription renewals:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
