import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const COMMISSION_RATE = 40 // 40% default

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json()
    const { action, session_id, checkout_type, custom_value, pay_commission } = body

    // ==================== ACTION: LIST ====================
    if (action === 'list') {
      console.log('📋 Listando agendamentos com check-in sem checkout...')

      const { data: sessoesPendentes, error: listError } = await supabase
        .from('appointment_totem_sessions')
        .select(`
          id, appointment_id, status, totem_session_id,
          totem_sessions!inner(id, token, is_valid, created_at)
        `)
        .eq('status', 'checked_in')
        .order('created_at', { ascending: false })

      if (listError) throw listError

      if (!sessoesPendentes || sessoesPendentes.length === 0) {
        return new Response(
          JSON.stringify({ success: true, count: 0, appointments: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const appointmentIds = sessoesPendentes.map(s => s.appointment_id).filter(Boolean)

      const { data: agendamentos, error: agendError } = await supabase
        .from('painel_agendamentos')
        .select(`
          id, data, hora, status, cliente_id, barbeiro_id, servico_id,
          painel_clientes(nome, whatsapp, telefone),
          painel_barbeiros(nome),
          painel_servicos(nome, preco)
        `)
        .in('id', appointmentIds)

      if (agendError) throw agendError

      const agendamentosPendentes = sessoesPendentes.map(sessao => {
        const agendamento = agendamentos?.find(a => a.id === sessao.appointment_id)
        return {
          ...agendamento,
          session_id: sessao.totem_session_id,
          session_status: sessao.status,
          totem_session: sessao.totem_sessions
        }
      }).filter(a => a.id)

      return new Response(
        JSON.stringify({ success: true, count: agendamentosPendentes.length, appointments: agendamentosPendentes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ==================== ACTION: FORCE_CHECKOUT ====================
    if (action === 'force_checkout') {
      const type = checkout_type || 'full'
      const shouldPayCommission = pay_commission !== false // default true
      console.log('🔧 Checkout admin:', { session_id, type, shouldPayCommission, custom_value })

      if (!session_id) throw new Error('session_id é obrigatório')

      // 1. Buscar sessão
      const { data: appointmentSession, error: sessionError } = await supabase
        .from('appointment_totem_sessions')
        .select('*, totem_sessions(*)')
        .eq('totem_session_id', session_id)
        .eq('status', 'checked_in')
        .maybeSingle()

      if (sessionError) throw sessionError
      if (!appointmentSession) throw new Error('Sessão não encontrada ou já finalizada')

      const appointment_id = appointmentSession.appointment_id

      // 2. Buscar agendamento
      const { data: agendamento, error: agendError } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_servicos(nome, preco),
          painel_barbeiros(id, nome, staff_id, taxa_comissao, commission_rate)
        `)
        .eq('id', appointment_id)
        .single()

      if (agendError || !agendamento) throw new Error('Agendamento não encontrado')

      const originalPrice = agendamento.painel_servicos?.preco || 0
      const nomeServico = agendamento.painel_servicos?.nome || 'Serviço'
      const barbeiro_id = agendamento.barbeiro_id
      const barberName = agendamento.painel_barbeiros?.nome || 'N/A'

      // 3. Calculate prices
      let revenueAmount: number // What goes into contas_receber
      let commissionBase: number // Base for commission calculation
      let observacao: string

      switch (type) {
        case 'courtesy':
          revenueAmount = 0
          commissionBase = originalPrice // Commission on ORIGINAL price
          observacao = `Cortesia administrativa - ${nomeServico}`
          break
        case 'custom':
          revenueAmount = typeof custom_value === 'number' ? custom_value : originalPrice
          commissionBase = revenueAmount // Commission on custom value
          observacao = `Checkout admin (R$ ${revenueAmount.toFixed(2)}) - ${nomeServico}`
          break
        default:
          revenueAmount = originalPrice
          commissionBase = originalPrice
          observacao = `Checkout administrativo - ${nomeServico}`
      }

      const commissionAmount = shouldPayCommission ? commissionBase * (COMMISSION_RATE / 100) : 0

      console.log('💰 Cálculos:', {
        originalPrice,
        revenueAmount,
        commissionBase,
        commissionAmount,
        shouldPayCommission,
        type
      })

      // 4. Criar venda
      const { data: novaVenda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          cliente_id: agendamento.cliente_id,
          barbeiro_id,
          valor_total: revenueAmount,
          desconto: originalPrice - revenueAmount,
          status: 'PAGA',
          observacoes: observacao
        })
        .select()
        .single()

      if (vendaError) throw vendaError
      console.log('✅ Venda criada:', novaVenda.id)

      // 5. Criar item da venda
      await supabase.from('vendas_itens').insert({
        venda_id: novaVenda.id,
        tipo: 'servico',
        item_id: agendamento.servico_id || agendamento.id,
        nome: nomeServico,
        quantidade: 1,
        preco_unitario: revenueAmount,
        subtotal: revenueAmount,
        barbeiro_id
      })

      // 6. Contas a Receber (even if zero for courtesy - records the event)
      const today = new Date().toISOString().split('T')[0]

      await supabase.from('contas_receber').insert({
        descricao: type === 'courtesy'
          ? `Cortesia - ${nomeServico} (${barberName})`
          : `${nomeServico} - Checkout admin`,
        valor: revenueAmount,
        data_vencimento: today,
        data_recebimento: today,
        status: 'recebido',
        categoria: 'servico',
        forma_pagamento: type === 'courtesy' ? 'cortesia' : 'admin',
        cliente_id: agendamento.cliente_id,
        observacoes: observacao
      })
      console.log('✅ Contas a receber:', revenueAmount)

      // 7. Comissão + Contas a Pagar (if commission should be paid)
      if (shouldPayCommission && commissionAmount > 0) {
        // Verificar comissão existente
        const { data: existingCommission } = await supabase
          .from('barber_commissions')
          .select('id')
          .eq('appointment_id', appointment_id)
          .maybeSingle()

        if (!existingCommission) {
          await supabase.from('barber_commissions').insert({
            barber_id: barbeiro_id,
            appointment_id,
            venda_id: novaVenda.id,
            valor: commissionAmount,
            amount: commissionAmount,
            commission_rate: COMMISSION_RATE,
            barber_name: barberName,
            tipo: type === 'courtesy' ? 'cortesia' : 'servico',
            status: 'pending',
            appointment_source: 'admin_checkout'
          })
          console.log('✅ Comissão criada:', commissionAmount)
        }

        // Contas a pagar - barbeiro
        await supabase.from('contas_pagar').insert({
          descricao: `Comissão ${barberName} - ${nomeServico}${type === 'courtesy' ? ' (cortesia)' : ''}`,
          valor: commissionAmount,
          data_vencimento: today,
          status: 'pendente',
          categoria: 'comissao',
          fornecedor: barberName,
          observacoes: `Comissão ${COMMISSION_RATE}% sobre R$ ${commissionBase.toFixed(2)} - ${observacao}`
        })
        console.log('✅ Contas a pagar (comissão):', commissionAmount)

        // Financial record for commission
        await supabase.from('financial_records').insert({
          transaction_type: 'commission',
          amount: commissionAmount,
          description: `Comissão ${barberName} - ${nomeServico}${type === 'courtesy' ? ' (cortesia)' : ''}`,
          category: 'comissao',
          status: 'pending',
          barber_id: barbeiro_id,
          barber_name: barberName,
          client_id: agendamento.cliente_id,
          service_id: agendamento.servico_id,
          service_name: nomeServico,
          reference_id: novaVenda.id,
          reference_type: 'venda',
          payment_method: type === 'courtesy' ? 'cortesia' : 'admin'
        })
      }

      // 8. Financial transaction (receita) - only if revenue > 0
      if (revenueAmount > 0) {
        await supabase.from('financial_transactions').insert({
          transaction_type: 'income',
          amount: revenueAmount,
          description: `Checkout admin - ${nomeServico}`,
          category: 'servico',
          payment_method: 'admin',
          status: 'completed',
          barber_id: barbeiro_id,
          client_id: agendamento.cliente_id,
          reference_id: novaVenda.id
        })
      }

      // Financial record (receita)
      await supabase.from('financial_records').insert({
        transaction_type: type === 'courtesy' ? 'courtesy' : 'income',
        amount: revenueAmount,
        description: type === 'courtesy'
          ? `Cortesia - ${nomeServico} (${barberName})`
          : `Checkout admin - ${nomeServico}`,
        category: 'servico',
        status: 'completed',
        barber_id: barbeiro_id,
        barber_name: barberName,
        client_id: agendamento.cliente_id,
        service_id: agendamento.servico_id,
        service_name: nomeServico,
        reference_id: novaVenda.id,
        reference_type: 'venda',
        payment_method: type === 'courtesy' ? 'cortesia' : 'admin'
      })

      // 9. Update session + appointment
      await supabase
        .from('appointment_totem_sessions')
        .update({ status: 'completed' })
        .eq('id', appointmentSession.id)

      await supabase
        .from('totem_sessions')
        .update({ is_valid: false })
        .eq('id', session_id)

      await supabase
        .from('painel_agendamentos')
        .update({
          status: 'concluido',
          status_totem: 'FINALIZADO',
          venda_id: novaVenda.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointment_id)

      console.log('✅ Checkout admin finalizado!', { type, revenueAmount, commissionAmount })

      return new Response(
        JSON.stringify({
          success: true,
          message: type === 'courtesy' ? 'Cortesia registrada com sucesso' : 'Checkout realizado com sucesso',
          session_id,
          venda_id: novaVenda.id,
          appointment_id,
          checkout_type: type,
          revenue: revenueAmount,
          commission: commissionAmount,
          pay_commission: shouldPayCommission
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Action inválida. Use "list" ou "force_checkout"' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('❌ Erro em pending-checkouts:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
