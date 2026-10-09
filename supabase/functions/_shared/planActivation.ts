// Ativação de plano comprado online (Stripe). Idempotente por stripe_session_id.
// Chamado só após o servidor confirmar com a Stripe que a sessão está paga.
export async function activatePlanFromSession(db: any, s: any): Promise<{ activated: boolean; duplicate?: boolean; error?: string }> {
  const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  if (s.metadata?.kind !== 'subscription_plan' || s.payment_status !== 'paid') return { activated: false, error: 'not_paid' }
      const { data: existing } = await db.from('client_subscriptions').select('id').eq('stripe_session_id', s.id).maybeSingle()
  if (existing) return { activated: true, duplicate: true }

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
    return { activated: false, error: subErr.message }
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
  return { activated: true }
}
