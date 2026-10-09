import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'npm:stripe@14.21.0'
import { z } from 'https://esm.sh/zod@3.23.8'
import { corsHeaders } from '../_shared/cors.ts'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const Body = z.object({ plan_id: z.string().uuid(), return_origin: z.string().url().optional() })
const ALLOWED_ORIGINS = [
  'https://barbeariacostaurbana.com.br',
  'https://www.barbeariacostaurbana.com.br',
  'https://barbeariacostaurbana.lovable.app',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405)

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return json({ error: 'Pagamento online ainda não configurado' }, 503)

    // 1. Autenticação obrigatória (usuário do painel do cliente)
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return json({ error: 'Não autenticado' }, 401)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) return json({ error: 'Não autenticado' }, 401)
    const user = userData.user

    const parsed = Body.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) return json({ error: 'Dados inválidos' }, 400)
    const { plan_id } = parsed.data

    // 2. Cliente titular = usuário logado (intransferível)
    const { data: client } = await admin
      .from('painel_clientes').select('id, nome, email').eq('user_id', user.id).maybeSingle()
    if (!client) return json({ error: 'Cadastro de cliente não encontrado' }, 403)

    // 3. Plano e preço definidos SOMENTE no servidor
    const { data: plan } = await admin
      .from('subscription_plans').select('id, name, price, credits_total, is_active').eq('id', plan_id).maybeSingle()
    if (!plan || !plan.is_active || Number(plan.price) <= 0) return json({ error: 'Plano indisponível' }, 400)

    // 4. Renovação só depois de usar todos os créditos (ou plano vencido)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    const { data: active } = await admin
      .from('client_subscriptions')
      .select('id, credits_total, credits_used, expires_at')
      .eq('client_id', client.id).eq('status', 'active')
    const blocking = (active || []).find((s: any) => s.credits_used < s.credits_total && (!s.expires_at || s.expires_at >= today))
    if (blocking) {
      return json({ error: 'Você ainda possui créditos no plano atual. A renovação fica disponível após usar todos os créditos.' }, 409)
    }

    const origin = req.headers.get('origin') || ''
    const base = ALLOWED_ORIGINS.includes(origin) || origin.includes('lovable') ? origin : ALLOWED_ORIGINS[0]

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() })
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: client.email || user.email || undefined,
      client_reference_id: client.id,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'brl',
          unit_amount: Math.round(Number(plan.price) * 100),
          product_data: {
            name: `Plano ${plan.name}`,
            description: `${plan.credits_total} créditos • válido por 365 dias • pessoal e intransferível`,
          },
        },
      }],
      metadata: { client_id: client.id, plan_id: plan.id, user_id: user.id, kind: 'subscription_plan' },
      payment_intent_data: { metadata: { client_id: client.id, plan_id: plan.id, kind: 'subscription_plan' } },
      success_url: `${base}/painel-cliente/planos?status=sucesso&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/painel-cliente/planos?status=cancelado`,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    })

    return json({ url: session.url })
  } catch (e: any) {
    console.error('[create-plan-checkout]', e?.message || e)
    return json({ error: 'Não foi possível iniciar o pagamento' }, 500)
  }
})
