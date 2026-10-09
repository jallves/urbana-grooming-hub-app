import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'npm:stripe@14.21.0'
import { corsHeaders } from '../_shared/cors.ts'

// Extrato transparente dos planos do PRÓPRIO cliente logado: assinaturas, usos e pagamento.
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const METHOD_LABEL: Record<string, string> = {
  card: 'Cartão de crédito', pix: 'Pix', boleto: 'Boleto',
  credito: 'Cartão de crédito', debito: 'Cartão de débito', dinheiro: 'Dinheiro',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    if (!token) return json({ error: 'Não autenticado' }, 401)
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: u } = await db.auth.getUser(token)
    if (!u?.user) return json({ error: 'Não autenticado' }, 401)

    const { data: client } = await db.from('painel_clientes').select('id').eq('user_id', u.user.id).maybeSingle()
    if (!client) return json({ subscriptions: [] })

    const { data: subs } = await db.from('client_subscriptions')
      .select('id, plan_id, status, start_date, expires_at, credits_total, credits_used, payment_method, source, stripe_session_id, stripe_payment_intent, created_at, cancelled_at, subscription_plans(name, price)')
      .eq('client_id', client.id).order('created_at', { ascending: false }).limit(20)

    const ids = (subs || []).map((s: any) => s.id)
    const [{ data: usage }, { data: pays }] = await Promise.all([
      ids.length ? db.from('subscription_usage')
        .select('subscription_id, used_at, service_name, notes, appointment_id, painel_agendamentos(data, hora, painel_barbeiros(nome))')
        .in('subscription_id', ids).order('used_at', { ascending: false }) : Promise.resolve({ data: [] as any[] }),
      ids.length ? db.from('subscription_payments').select('subscription_id, amount, payment_date, payment_method, status')
        .in('subscription_id', ids).order('payment_date', { ascending: false }) : Promise.resolve({ data: [] as any[] }),
    ])

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() }) : null

    const out = await Promise.all((subs || []).map(async (s: any) => {
      const localPay = (pays || []).find((p: any) => p.subscription_id === s.id)
      let payment: any = {
        method: METHOD_LABEL[s.payment_method || localPay?.payment_method || ''] || s.payment_method || localPay?.payment_method || (s.source === 'balcao' ? 'Pago na barbearia' : '—'),
        amount: localPay?.amount ?? s.subscription_plans?.price ?? null,
        paid_at: localPay?.payment_date || s.start_date,
        card_brand: null, card_last4: null, status: 'Pago',
      }
      if (stripe && (s.stripe_payment_intent || s.stripe_session_id)) {
        try {
          let piId = s.stripe_payment_intent
          if (!piId && s.stripe_session_id) {
            const sess = await stripe.checkout.sessions.retrieve(s.stripe_session_id)
            piId = typeof sess.payment_intent === 'string' ? sess.payment_intent : sess.payment_intent?.id
          }
          if (piId) {
            const pi = await stripe.paymentIntents.retrieve(piId, { expand: ['latest_charge'] })
            const ch: any = pi.latest_charge
            const pmd = ch?.payment_method_details
            payment = {
              method: METHOD_LABEL[pmd?.type] || pmd?.type || payment.method,
              amount: pi.amount_received ? pi.amount_received / 100 : payment.amount,
              paid_at: ch?.created ? new Date(ch.created * 1000).toISOString() : payment.paid_at,
              card_brand: pmd?.card?.brand || null,
              card_last4: pmd?.card?.last4 || null,
              installments: pmd?.card?.installments?.count || null,
              status: ch?.refunded ? 'Estornado' : ch?.disputed ? 'Em contestação' : 'Pago',
            }
          }
        } catch (e: any) { console.error('[my-plan-details] stripe', e?.message) }
      }
      return {
        id: s.id, plan_name: s.subscription_plans?.name || 'Plano', status: s.status,
        start_date: s.start_date, expires_at: s.expires_at,
        credits_total: s.credits_total, credits_used: s.credits_used,
        source: s.source, payment,
        usage: (usage || []).filter((x: any) => x.subscription_id === s.id).map((x: any) => ({
          used_at: x.used_at, service_name: x.service_name,
          appointment_date: x.painel_agendamentos?.data || null, appointment_time: x.painel_agendamentos?.hora || null,
          barber: x.painel_agendamentos?.painel_barbeiros?.nome || null,
        })),
      }
    }))
    return json({ subscriptions: out })
  } catch (e: any) {
    console.error('[my-plan-details]', e?.message || e)
    return json({ error: 'Erro ao carregar seus planos' }, 500)
  }
})
