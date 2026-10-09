import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { z } from 'https://esm.sh/zod@3.23.8'
import { corsHeaders } from '../_shared/cors.ts'
import { activatePlanFromSession } from '../_shared/planActivation.ts'

// Confirma com a Stripe (servidor) que a sessão foi paga e ativa o plano do PRÓPRIO usuário.
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const Body = z.object({ session_id: z.string().regex(/^cs_(test|live)_[A-Za-z0-9]+$/) })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return json({ error: 'Pagamento online não configurado' }, 503)

    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    if (!token) return json({ error: 'Não autenticado' }, 401)
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: u } = await db.auth.getUser(token)
    if (!u?.user) return json({ error: 'Não autenticado' }, 401)

    const parsed = Body.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) return json({ error: 'Sessão inválida' }, 400)

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() })
    const s = await stripe.checkout.sessions.retrieve(parsed.data.session_id)

    // Intransferível: a sessão precisa ser do usuário logado
    const { data: client } = await db.from('painel_clientes').select('id').eq('user_id', u.user.id).maybeSingle()
    if (!client || s.metadata?.client_id !== client.id || s.metadata?.user_id !== u.user.id) {
      return json({ error: 'Acesso negado' }, 403)
    }
    if (s.payment_status !== 'paid') return json({ status: 'pending' })

    const r = await activatePlanFromSession(db, s)
    return json({ status: r.activated ? 'active' : 'failed', error: r.activated ? undefined : 'Não foi possível ativar o plano. A equipe foi avisada.' })
  } catch (e: any) {
    console.error('[verify-plan-checkout]', e?.message || e)
    return json({ error: 'Erro ao confirmar pagamento' }, 500)
  }
})
