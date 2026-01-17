import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

type RequestBody = {
  venda_id?: string | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = (await req.json().catch(() => ({}))) as RequestBody

    // 1) Encontrar a última venda paga (ou uma venda específica)
    const vendaQuery = supabase.from('vendas').select('*')

    const { data: venda, error: vendaError } = body.venda_id
      ? await vendaQuery.eq('id', body.venda_id).maybeSingle()
      : await vendaQuery.eq('status', 'pago').order('updated_at', { ascending: false }).order('created_at', { ascending: false }).limit(1).maybeSingle()

    if (vendaError) throw vendaError
    if (!venda?.id) {
      return new Response(JSON.stringify({ success: false, error: 'Nenhuma venda paga encontrada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    console.log('🛠️ repair-last-checkout: venda encontrada', { venda_id: venda.id, status: venda.status })

    // 2) Buscar itens
    const { data: vendaItens, error: itensError } = await supabase
      .from('vendas_itens')
      .select('*')
      .eq('venda_id', venda.id)

    if (itensError) throw itensError

    // 3) Buscar agendamento vinculado
    const { data: agendamento, error: agendError } = await supabase
      .from('painel_agendamentos')
      .select('id, barbeiro_id, cliente_id, status, status_totem')
      .eq('venda_id', venda.id)
      .maybeSingle()

    if (agendError) throw agendError

    // 4) Atualizar status do agendamento (painel admin + painel cliente dependem disso)
    let appointmentUpdated = false
    if (agendamento?.id) {
      if (agendamento.status !== 'concluido' || agendamento.status_totem !== 'FINALIZADO') {
        const { error: updError } = await supabase
          .from('painel_agendamentos')
          .update({ status: 'concluido', status_totem: 'FINALIZADO', updated_at: new Date().toISOString() })
          .eq('id', agendamento.id)

        if (updError) throw updError
        appointmentUpdated = true
      }
    }

    // 5) Reprocessar ERP (idempotente: financial_records + contas_receber/pagar + barber_commissions)
    const tipAmount = Number(venda.gorjeta || 0)

    const erpItems = (vendaItens || []).map((item: any) => ({
      type: item.tipo === 'PRODUTO' ? 'product' : 'service',
      id: item.item_id,
      name: item.nome,
      quantity: Number(item.quantidade || 1),
      price: Number(item.preco_unitario || 0),
      discount: 0,
      isExtra: item.tipo === 'SERVICO_EXTRA',
    }))

    const { data: erpResult, error: erpError } = await supabase.functions.invoke('create-financial-transaction', {
      body: {
        appointment_id: agendamento?.id || null,
        client_id: venda.cliente_id || null,
        barber_id: agendamento?.barbeiro_id || venda.barbeiro_id || null,
        reference_id: venda.id,
        reference_type: 'totem_venda',
        items: erpItems,
        payment_method: venda.forma_pagamento || 'credit_card',
        discount_amount: Number(venda.desconto || 0),
        notes: `Reprocessado automaticamente - Venda ${venda.id}`,
        tip_amount: tipAmount,
      },
    })

    if (erpError) throw erpError

    console.log('✅ repair-last-checkout: ERP OK', { venda_id: venda.id })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          venda_id: venda.id,
          agendamento_id: agendamento?.id || null,
          appointment_updated: appointmentUpdated,
          erp: erpResult,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('❌ repair-last-checkout error:', error)
    return new Response(JSON.stringify({ success: false, error: error?.message || String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
