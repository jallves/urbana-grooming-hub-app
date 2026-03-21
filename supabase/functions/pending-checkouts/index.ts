import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json()
    const { action, session_id, checkout_type, custom_value } = body

    // ==================== ACTION: LIST ====================
    if (action === 'list') {
      console.log('📋 Listando agendamentos com check-in sem checkout...')

      const { data: sessoesPendentes, error: listError } = await supabase
        .from('appointment_totem_sessions')
        .select(`
          id,
          appointment_id,
          status,
          totem_session_id,
          totem_sessions!inner(
            id,
            token,
            is_valid,
            created_at
          )
        `)
        .eq('status', 'checked_in')
        .order('created_at', { ascending: false })

      if (listError) {
        console.error('❌ Erro ao listar sessões pendentes:', listError)
        throw listError
      }

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

      console.log(`✅ Encontrados ${agendamentosPendentes.length} agendamentos pendentes`)

      return new Response(
        JSON.stringify({ success: true, count: agendamentosPendentes.length, appointments: agendamentosPendentes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ==================== ACTION: FORCE_CHECKOUT ====================
    if (action === 'force_checkout') {
      console.log('🔧 Forçando checkout para sessão:', session_id, 'Tipo:', checkout_type || 'full')

      if (!session_id) {
        throw new Error('session_id é obrigatório para force_checkout')
      }

      // Determine the checkout type and final value
      const type = checkout_type || 'full' // 'full' | 'courtesy' | 'custom'

      // Buscar appointment_totem_session
      const { data: appointmentSession, error: sessionError } = await supabase
        .from('appointment_totem_sessions')
        .select('*, totem_sessions(*)')
        .eq('totem_session_id', session_id)
        .eq('status', 'checked_in')
        .maybeSingle()

      if (sessionError) throw sessionError
      if (!appointmentSession) throw new Error('Sessão não encontrada ou já finalizada')

      const appointment_id = appointmentSession.appointment_id
      console.log('✅ Sessão válida. Appointment:', appointment_id)

      // Buscar agendamento
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

      // Calculate final price based on checkout type
      let finalPrice: number
      let observacao: string

      switch (type) {
        case 'courtesy':
          finalPrice = 0
          observacao = `Cortesia administrativa - Agendamento ${appointment_id}`
          break
        case 'custom':
          finalPrice = typeof custom_value === 'number' ? custom_value : originalPrice
          observacao = `Checkout admin (valor personalizado R$ ${finalPrice.toFixed(2)}) - Agendamento ${appointment_id}`
          break
        default:
          finalPrice = originalPrice
          observacao = `Checkout administrativo - Agendamento ${appointment_id}`
      }

      console.log('💰 Preços:', { originalPrice, finalPrice, type })

      // Criar venda
      const { data: novaVenda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          cliente_id: agendamento.cliente_id,
          barbeiro_id: barbeiro_id,
          valor_total: finalPrice,
          desconto: originalPrice - finalPrice,
          status: 'PAGA',
          observacoes: observacao
        })
        .select()
        .single()

      if (vendaError) throw vendaError
      console.log('✅ Venda criada:', novaVenda.id, 'Valor:', finalPrice)

      // Criar item da venda
      await supabase
        .from('vendas_itens')
        .insert({
          venda_id: novaVenda.id,
          tipo: 'servico',
          item_id: agendamento.servico_id || agendamento.id,
          nome: nomeServico,
          quantidade: 1,
          preco_unitario: finalPrice,
          subtotal: finalPrice,
          barbeiro_id: barbeiro_id
        })

      // Gerar comissão (mesmo para cortesia, comissão pode ser zero)
      const commissionRate = agendamento.painel_barbeiros?.commission_rate 
        || agendamento.painel_barbeiros?.taxa_comissao 
        || 50
      const commissionAmount = finalPrice * (commissionRate / 100)

      // Verificar comissão existente
      const { data: existingCommission } = await supabase
        .from('barber_commissions')
        .select('id')
        .eq('appointment_id', appointment_id)
        .maybeSingle()

      if (!existingCommission) {
        const barberName = agendamento.painel_barbeiros?.nome || 'N/A'

        await supabase
          .from('barber_commissions')
          .insert({
            barber_id: barbeiro_id,
            appointment_id: appointment_id,
            venda_id: novaVenda.id,
            valor: commissionAmount,
            amount: commissionAmount,
            commission_rate: commissionRate,
            barber_name: barberName,
            tipo: type === 'courtesy' ? 'cortesia' : 'servico',
            status: 'pending',
            appointment_source: 'admin_checkout'
          })

        console.log('✅ Comissão criada:', commissionAmount)
      }

      // Registrar transação financeira
      if (finalPrice > 0) {
        await supabase
          .from('financial_transactions')
          .insert({
            transaction_type: 'income',
            amount: finalPrice,
            description: `${type === 'custom' ? 'Checkout personalizado' : 'Checkout admin'} - ${nomeServico}`,
            category: 'servico',
            payment_method: type === 'courtesy' ? 'cortesia' : 'admin',
            status: 'completed',
            barber_id: barbeiro_id,
            client_id: agendamento.cliente_id,
            reference_id: novaVenda.id
          })
        console.log('✅ Transação financeira criada')
      }

      // Atualizar appointment_totem_session
      await supabase
        .from('appointment_totem_sessions')
        .update({ status: 'completed' })
        .eq('id', appointmentSession.id)

      // Invalidar totem_session
      await supabase
        .from('totem_sessions')
        .update({ is_valid: false })
        .eq('id', session_id)

      // Atualizar agendamento
      await supabase
        .from('painel_agendamentos')
        .update({
          status: 'concluido',
          status_totem: 'FINALIZADO',
          venda_id: novaVenda.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointment_id)

      console.log('✅ Checkout forçado com sucesso! Tipo:', type)

      return new Response(
        JSON.stringify({
          success: true,
          message: type === 'courtesy' ? 'Cortesia registrada com sucesso' : 'Checkout realizado com sucesso',
          session_id,
          venda_id: novaVenda.id,
          appointment_id,
          checkout_type: type,
          final_price: finalPrice,
          commission: commissionAmount
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
