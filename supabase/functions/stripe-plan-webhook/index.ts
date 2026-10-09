import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

// Webhook da Stripe: única forma de ativar plano comprado online.
// Assinatura verificada com STRIPE_WEBHOOK_SECRET; idempotente por stripe_session_id.

const ok = (b: unknown = { received: true }) => new Response(JSON.stringify(b), { headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const whSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!stripeKey || !whSecret) return new Response('Not configured', { status: 503 })

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() })
  const signature = req.headers.get('stripe-signature')
  const raw = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature!, whSecret, undefined, Stripe.createSubtleCryptoProvider())
  } catch (e: any) {
    console.error('[stripe-plan-webhook] assinatura inválida', e?.message)
    return new Response('Invalid signature', { status: 400 })
  }

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const s = event.data.object as Stripe.Checkout.Session
      if (s.metadata?.kind !== 'subscription_plan') return ok()
      if (s.payment_status !== 'paid') return ok({ pending: true }) // Pix/boleto: aguarda async_payment_succeeded

      const { data: existing } = await db.from('client_subscriptions').select('id').eq('stripe_session_id', s.id).maybeSingle()
      if (existing) return ok({ duplicate: true })

      const clientId = s.metadata.client_id
      const planId = s.metadata.plan_id
      const { data: plan } = await db.from('subscription_plans').select('name, credits_total').eq('id', planId).single()
      const { data: client } = await db.from('painel_clientes').select('nome').eq('id', clientId).single()
      const amount = (s.amount_total || 0) / 100
      const pi = typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id || null
      const method = (s.payment_method_types || []).includes('pix') && s.payment_method_types.length === 1 ? 'pix' : 'credito'

      const { data: sub, error: subErr } = await db.from('client_subscriptions').insert({
        client_id: clientId,
        plan_id: planId,
        status: 'active',
        start_date: today(),
        credits_total: plan?.credits_total || 4,
        credits_used: 0,
        payment_method: method,
        source: 'online',
        stripe_session_id: s.id,
        stripe_payment_intent: pi,
        notes: 'Compra online (Stripe)',
      }).select('id, expires_at').single()

      if (subErr) {
        // Ex.: cliente ainda tinha créditos (trigger). Registrar para estorno manual.
        console.error('[stripe-plan-webhook] ativação recusada', subErr.message, s.id)
        await db.from('admin_activity_log').insert({
          action: 'subscription_online_activation_failed', entity_type: 'stripe_session',
          new_data: { session_id: s.id, client_id: clientId, plan_id: planId, error: subErr.message },
        })
        return ok({ activated: false })
      }

      await db.from('subscription_payments').insert({
        subscription_id: sub.id, amount, payment_date: today(), payment_method: method,
        period_start: today(), period_end: sub.expires_at, status: 'paid', notes: `Stripe ${pi || s.id}`,
      })
      await db.from('contas_receber').insert({
        descricao: `Assinatura ${plan?.name || 'Plano'} — ${client?.nome || 'Cliente'} (online)`,
        valor: amount, data_vencimento: today(), data_recebimento: today(), status: 'pago',
        categoria: 'Assinatura', forma_pagamento: method, cliente_id: clientId, transaction_id: pi || s.id,
        observacoes: `Compra online Stripe • sessão ${s.id}`,
      })
      await db.from('admin_activity_log').insert({
        action: 'subscription_online_activated', entity_type: 'client_subscriptions', entity_id: sub.id,
        new_data: { session_id: s.id, amount, plan_id: planId, client_id: clientId },
      })
      return ok({ activated: true })
    }

    if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
      const obj: any = event.data.object
      const pi = typeof obj.payment_intent === 'string' ? obj.payment_intent : obj.payment_intent?.id
      if (pi) {
        const { data: subs } = await db.from('client_subscriptions')
          .update({ status: 'suspended', cancellation_reason: event.type === 'charge.refunded' ? 'Estorno Stripe' : 'Contestação Stripe', cancelled_at: new Date().toISOString() })
          .eq('stripe_payment_intent', pi).select('id')
        for (const s of subs || []) {
          await db.from('admin_activity_log').insert({ action: 'subscription_online_suspended', entity_type: 'client_subscriptions', entity_id: s.id, new_data: { event: event.type, payment_intent: pi } })
        }
      }
      return ok()
    }

    return ok({ ignored: event.type })
  } catch (e: any) {
    console.error('[stripe-plan-webhook] erro', e?.message || e)
    return new Response('Error', { status: 500 })
  }
})
