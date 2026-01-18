import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { getBrazilDateTime } from '../_shared/brazilDateTime.ts'

/**
 * Edge Function: create-financial-transaction
 *
 * Objetivo (schema real do banco):
 * - Criar registros no ERP em public.financial_records (receitas e comissões)
 * - Criar registros em public.barber_commissions (para repasse ao barbeiro)
 * - Criar também em public.contas_receber e public.contas_pagar (para auditoria/relatórios)
 *
 * Regras:
 * - Receita: status = 'completed' e payment_date preenchido
 * - Comissão/Gorjeta a pagar: status = 'pending' e due_date preenchido
 * - Idempotência: se reference_id vier, não duplica lançamentos com a mesma (reference_id + reference_type)
 */

type CheckoutItem = {
  type: 'service' | 'product'
  id: string
  name?: string
  quantity: number
  price: number
  discount?: number
  isExtra?: boolean
}

type RequestBody = {
  appointment_id?: string | null
  client_id?: string | null
  barber_id?: string | null
  items: CheckoutItem[]
  payment_method?: string | null
  discount_amount?: number
  notes?: string | null
  transaction_date?: string
  transaction_datetime?: string
  tip_amount?: number
  reference_id?: string | null
  reference_type?: string | null
  transaction_id?: string | null // ID da transação eletrônica (NSU PayGo, código PIX, etc.)
}

function normalizePaymentMethod(raw: string | null | undefined) {
  if (!raw) return null
  const map: Record<string, string> = {
    credit: 'credit_card',
    debit: 'debit_card',
    pix: 'pix',
    cash: 'cash',
    bank_transfer: 'bank_transfer',
    credit_card: 'credit_card',
    debit_card: 'debit_card',
  }
  return map[raw] || raw
}

async function ensureContasReceber(
  supabase: any,
  params: {
    descricao: string
    valor: number
    data_vencimento: string
    data_recebimento: string | null
    cliente_id: string | null
    status: 'pendente' | 'recebido'
    observacoes: string
    categoria?: string | null
    transaction_id?: string | null // ID da transação eletrônica (NSU, PIX, etc.)
  }
) {
  const { data: existing } = await supabase
    .from('contas_receber')
    .select('id')
    .eq('observacoes', params.observacoes)
    .maybeSingle()

  if (existing?.id) return existing.id

  const { data, error } = await supabase
    .from('contas_receber')
    .insert({
      descricao: params.descricao,
      valor: params.valor,
      data_vencimento: params.data_vencimento,
      data_recebimento: params.data_recebimento,
      categoria: params.categoria || null,
      cliente_id: params.cliente_id,
      status: params.status,
      observacoes: params.observacoes,
      transaction_id: params.transaction_id || null, // ID da transação eletrônica
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function ensureContasPagar(
  supabase: any,
  params: {
    descricao: string
    valor: number
    data_vencimento: string
    data_pagamento: string | null
    status: 'pendente' | 'pago'
    observacoes: string
    categoria?: string | null
    fornecedor?: string | null
  }
) {
  const { data: existing } = await supabase
    .from('contas_pagar')
    .select('id')
    .eq('observacoes', params.observacoes)
    .maybeSingle()

  if (existing?.id) return existing.id

  const { data, error } = await supabase
    .from('contas_pagar')
    .insert({
      descricao: params.descricao,
      valor: params.valor,
      data_vencimento: params.data_vencimento,
      data_pagamento: params.data_pagamento,
      categoria: params.categoria || null,
      fornecedor: params.fornecedor || null,
      status: params.status,
      observacoes: params.observacoes,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function ensureBarberCommission(
  supabase: any,
  params: {
    barber_id: string
    barber_name: string | null
    appointment_id: string | null
    venda_id: string | null
    valor: number
    commission_rate: number
    status: string
    tipo: string
  }
) {
  // Estratégia idempotente (sem constraint no DB):
  // considerar uma comissão "igual" quando bate (barber_id + venda_id + tipo + valor + appointment_id)
  const { data: existing } = await supabase
    .from('barber_commissions')
    .select('id')
    .eq('barber_id', params.barber_id)
    .eq('venda_id', params.venda_id)
    .eq('tipo', params.tipo)
    .eq('valor', params.valor)
    .eq('appointment_id', params.appointment_id)
    .maybeSingle()

  if (existing?.id) return existing.id

  const { data, error } = await supabase
    .from('barber_commissions')
    .insert({
      barber_id: params.barber_id,
      barber_name: params.barber_name,
      appointment_id: params.appointment_id,
      venda_id: params.venda_id,
      valor: params.valor,
      amount: params.valor,
      commission_rate: params.commission_rate,
      status: params.status,
      tipo: params.tipo,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function upsertFinancialRecord(
  supabase: any,
  payload: any,
  uniqueKey: { reference_id: string | null; reference_type: string; sub_ref: string }
) {
  // Idempotência via (reference_id + reference_type + sub_ref)
  if (uniqueKey.reference_id) {
    const obs = `ref=${uniqueKey.reference_type};id=${uniqueKey.reference_id};sub=${uniqueKey.sub_ref}`

    const { data: existing } = await supabase
      .from('financial_records')
      .select('id')
      .eq('notes', obs)
      .maybeSingle()

    if (existing?.id) return { id: existing.id, alreadyExisted: true, obs }

    const { data, error } = await supabase
      .from('financial_records')
      .insert({ ...payload, notes: obs })
      .select('id')
      .single()

    if (error) throw error
    return { id: data.id, alreadyExisted: false, obs }
  }

  const { data, error } = await supabase
    .from('financial_records')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw error
  return { id: data.id, alreadyExisted: false, obs: null }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const body = (await req.json()) as RequestBody

    const payment_method = normalizePaymentMethod(body.payment_method)
    const tip_amount = Number(body.tip_amount || 0)

    if (!body.items || body.items.length === 0) {
      throw new Error('Nenhum item fornecido para a transação')
    }

    if (!payment_method) {
      throw new Error('Forma de pagamento é obrigatória')
    }

    const brazilNow = getBrazilDateTime()
    const transaction_date = body.transaction_date || brazilNow.date
    const transaction_datetime = body.transaction_datetime || brazilNow.datetime

    const reference_id = body.reference_id || null
    const reference_type = body.reference_type || (body.appointment_id ? 'totem_appointment' : 'totem_sale')

    const transaction_id = body.transaction_id || null // ID da transação eletrônica (NSU, PIX, etc.)

    console.log('💰 create-financial-transaction:', {
      reference_id,
      reference_type,
      appointment_id: body.appointment_id,
      client_id: body.client_id,
      barber_id: body.barber_id,
      items: body.items.length,
      payment_method,
      transaction_date,
      transaction_datetime,
      tip_amount,
      transaction_id,
    })

    // Buscar nome do barbeiro (se tiver)
    let barberName: string | null = null
    if (body.barber_id) {
      const { data: b } = await supabase
        .from('painel_barbeiros')
        .select('nome')
        .eq('id', body.barber_id)
        .maybeSingle()
      barberName = b?.nome || null
    }

    const created: any[] = []

    // ===================== RECEITAS =====================
    for (const item of body.items) {
      const qty = Number(item.quantity || 1)
      const unit = Number(item.price || 0)
      const discount = Number(item.discount || 0)
      const gross = qty * unit
      const net = Math.max(0, gross - discount)

      const isService = item.type === 'service'
      const category = isService ? 'services' : 'products'
      const subcategory = isService ? (item.isExtra ? 'service_extra' : 'service') : 'product'
      const description = isService ? `Serviço: ${item.name || 'Serviço'}` : `Produto: ${item.name || 'Produto'}`

      const subRef = `revenue:${item.type}:${item.id}:${subcategory}`

      const { id: financialId, alreadyExisted, obs } = await upsertFinancialRecord(
        supabase,
        {
          transaction_type: 'revenue',
          category,
          subcategory,
          amount: gross,
          net_amount: net,
          status: 'completed',
          description,
          transaction_date,
          payment_date: transaction_datetime,
          barber_id: body.barber_id,
          barber_name: barberName,
          client_id: body.client_id,
          service_id: isService ? item.id : null,
          service_name: isService ? item.name || null : null,
          reference_id,
          reference_type,
        },
        { reference_id, reference_type, sub_ref: subRef }
      )

       // Sempre garantir contas_receber (idempotente por observacoes),
       // mesmo quando o financial_record já existia (caso de migração parcial).
       if (reference_id) {
         await ensureContasReceber(supabase, {
           descricao: description,
           valor: net,
           data_vencimento: transaction_date,
           data_recebimento: transaction_date,
           cliente_id: body.client_id || null,
           status: 'recebido',
           categoria: category,
           observacoes: `ref_financial_record_id=${financialId};ref=${reference_type};id=${reference_id};sub=${subRef}`,
           transaction_id: transaction_id, // ID da transação eletrônica (NSU, PIX, etc.)
         })
       }

      created.push({ kind: 'revenue', item_type: item.type, financial_record_id: financialId, amount: net, obs })
    }

    // ===================== COMISSÕES (SERVIÇOS + PRODUTOS) =====================
    // Serviço: usar comissão do barbeiro (campo staff.commission_rate não serve aqui; painel_barbeiros.taxa_comissao existe)
    // Produto: usar painel_produtos.commission_percentage / commission_value

    if (body.barber_id) {
      // Comissão de serviços: default 40% se não configurado
      const { data: barberCfg } = await supabase
        .from('painel_barbeiros')
        .select('taxa_comissao')
        .eq('id', body.barber_id)
        .maybeSingle()

      const serviceCommissionRate = Number(barberCfg?.taxa_comissao ?? 40)

      for (const item of body.items.filter((i) => i.type === 'service')) {
        const qty = Number(item.quantity || 1)
        const unit = Number(item.price || 0)
        const discount = Number(item.discount || 0)
        const gross = qty * unit
        const net = Math.max(0, gross - discount)

        const commissionAmount = Number((net * (serviceCommissionRate / 100)).toFixed(2))
        const subcategory = item.isExtra ? 'service_extra_commission' : 'service_commission'
        const description = `Comissão ${serviceCommissionRate}% - ${item.name || 'Serviço'}`
        const subRef = `commission:service:${item.id}:${subcategory}`

        const { id: commissionFinancialId, alreadyExisted, obs } = await upsertFinancialRecord(
          supabase,
          {
            transaction_type: 'commission',
            category: 'staff_payments',
            subcategory,
            amount: commissionAmount,
            net_amount: commissionAmount,
            status: 'pending',
            description,
            transaction_date,
            due_date: transaction_date,
            barber_id: body.barber_id,
            barber_name: barberName,
            client_id: body.client_id,
            reference_id,
            reference_type,
          },
          { reference_id, reference_type, sub_ref: subRef }
        )

         if (commissionAmount > 0) {
           // Sempre garantir replica no painel do barbeiro + contas a pagar (idempotentes)
           await ensureBarberCommission(supabase, {
             barber_id: body.barber_id,
             barber_name: barberName,
             appointment_id: body.appointment_id || null,
             venda_id: reference_id,
             valor: commissionAmount,
             commission_rate: serviceCommissionRate,
             status: 'pending',
             tipo: item.isExtra ? 'servico_extra' : 'servico',
           })

           await ensureContasPagar(supabase, {
             descricao: description,
             valor: commissionAmount,
             data_vencimento: transaction_date,
             data_pagamento: null,
             status: 'pendente',
             categoria: 'staff_payments',
             fornecedor: barberName,
             observacoes: `ref_financial_record_id=${commissionFinancialId};ref=${reference_type};id=${reference_id};sub=${subRef}`,
           })
         }

        created.push({ kind: 'commission_service', financial_record_id: commissionFinancialId, amount: commissionAmount, obs })
      }

      // Comissão de produtos (se configurada)
      for (const item of body.items.filter((i) => i.type === 'product')) {
        const qty = Number(item.quantity || 1)
        const unit = Number(item.price || 0)
        const discount = Number(item.discount || 0)
        const gross = qty * unit
        const net = Math.max(0, gross - discount)

        const { data: productCfg } = await supabase
          .from('painel_produtos')
          .select('commission_percentage, commission_value')
          .eq('id', item.id)
          .maybeSingle()

        let commissionAmount = 0
        let commissionRate = Number(productCfg?.commission_percentage || 0)
        const commissionValue = Number(productCfg?.commission_value || 0)

        if (commissionValue > 0) {
          commissionAmount = Number((commissionValue * qty).toFixed(2))
          commissionRate = 0
        } else if (commissionRate > 0) {
          commissionAmount = Number((net * (commissionRate / 100)).toFixed(2))
        }

        const description = `Comissão produto - ${item.name || 'Produto'}`
        const subRef = `commission:product:${item.id}:product_commission`

        const { id: commissionFinancialId, alreadyExisted, obs } = await upsertFinancialRecord(
          supabase,
          {
            transaction_type: 'commission',
            category: 'products',
            subcategory: 'product_commission',
            amount: commissionAmount,
            net_amount: commissionAmount,
            status: 'pending',
            description,
            transaction_date,
            due_date: transaction_date,
            barber_id: body.barber_id,
            barber_name: barberName,
            client_id: body.client_id,
            reference_id,
            reference_type,
          },
          { reference_id, reference_type, sub_ref: subRef }
        )

         if (commissionAmount > 0) {
           await ensureBarberCommission(supabase, {
             barber_id: body.barber_id,
             barber_name: barberName,
             appointment_id: body.appointment_id || null,
             venda_id: reference_id,
             valor: commissionAmount,
             commission_rate: commissionRate,
             status: 'pending',
             tipo: 'produto',
           })

           await ensureContasPagar(supabase, {
             descricao: description,
             valor: commissionAmount,
             data_vencimento: transaction_date,
             data_pagamento: null,
             status: 'pendente',
             categoria: 'products',
             fornecedor: barberName,
             observacoes: `ref_financial_record_id=${commissionFinancialId};ref=${reference_type};id=${reference_id};sub=${subRef}`,
           })
         }

        created.push({ kind: 'commission_product', financial_record_id: commissionFinancialId, amount: commissionAmount, obs })
      }
    }

    // ===================== GORJETA (receita + a pagar) =====================
    if (tip_amount > 0) {
      const tipRevenueSubRef = `revenue:tip:received`
      const { id: tipRevenueId, alreadyExisted: tipRevenueExisted } = await upsertFinancialRecord(
        supabase,
        {
          transaction_type: 'revenue',
          category: 'tips',
          subcategory: 'tip_received',
          amount: tip_amount,
          net_amount: tip_amount,
          status: 'completed',
          description: 'Gorjeta recebida',
          transaction_date,
          payment_date: transaction_datetime,
          barber_id: body.barber_id,
          barber_name: barberName,
          client_id: body.client_id,
          reference_id,
          reference_type,
        },
        { reference_id, reference_type, sub_ref: tipRevenueSubRef }
      )

       if (reference_id) {
         await ensureContasReceber(supabase, {
           descricao: 'Gorjeta recebida',
           valor: tip_amount,
           data_vencimento: transaction_date,
           data_recebimento: transaction_date,
           cliente_id: body.client_id || null,
           status: 'recebido',
           categoria: 'tips',
           observacoes: `ref_financial_record_id=${tipRevenueId};ref=${reference_type};id=${reference_id};sub=${tipRevenueSubRef}`,
         })
       }

      created.push({ kind: 'tip_revenue', financial_record_id: tipRevenueId, amount: tip_amount })

      // Gorjeta a pagar ao barbeiro (commission)
      if (body.barber_id) {
        const tipPayableSubRef = `commission:tip:payable`
        const { id: tipPayableId, alreadyExisted: tipPayableExisted } = await upsertFinancialRecord(
          supabase,
          {
            transaction_type: 'commission',
            category: 'tips',
            subcategory: 'tip_payable',
            amount: tip_amount,
            net_amount: tip_amount,
            status: 'pending',
            description: 'Gorjeta a pagar ao barbeiro',
            transaction_date,
            due_date: transaction_date,
            barber_id: body.barber_id,
            barber_name: barberName,
            client_id: body.client_id,
            reference_id,
            reference_type,
          },
          { reference_id, reference_type, sub_ref: tipPayableSubRef }
        )

         // Sempre garantir réplica no painel do barbeiro + contas a pagar (idempotentes)
         await ensureBarberCommission(supabase, {
           barber_id: body.barber_id,
           barber_name: barberName,
           appointment_id: body.appointment_id || null,
           venda_id: reference_id,
           valor: tip_amount,
           commission_rate: 100,
           status: 'pending',
           tipo: 'gorjeta',
         })

         await ensureContasPagar(supabase, {
           descricao: 'Gorjeta a pagar ao barbeiro',
           valor: tip_amount,
           data_vencimento: transaction_date,
           data_pagamento: null,
           status: 'pendente',
           categoria: 'tips',
           fornecedor: barberName,
           observacoes: `ref_financial_record_id=${tipPayableId};ref=${reference_type};id=${reference_id};sub=${tipPayableSubRef}`,
         })

        created.push({ kind: 'tip_payable', financial_record_id: tipPayableId, amount: tip_amount })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          reference_id,
          reference_type,
          transaction_date,
          transaction_datetime,
          created,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('❌ create-financial-transaction error:', error)
    return new Response(JSON.stringify({ success: false, error: error?.message || String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
