import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'npm:stripe@14.21.0'
import { activatePlanFromSession } from '../_shared/planActivation.ts'

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

      const r = await activatePlanFromSession(db, s)
      return ok(r)
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
