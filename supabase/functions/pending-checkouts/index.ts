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

    const { action, session_id } = await req.json()

    // ==================== ACTION: LIST ====================
    if (action === 'list') {
      console.log('📋 Listando agendamentos com check-in sem checkout...')

      // Buscar sessões do totem que têm check-in mas não têm checkout
      // Usando a tabela intermediária appointment_totem_sessions
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

      // Se não há sessões pendentes, retornar lista vazia
      if (!sessoesPendentes || sessoesPendentes.length === 0) {
        console.log('✅ Nenhuma sessão pendente encontrada')
        return new Response(
          JSON.stringify({
            success: true,
            count: 0,
            appointments: []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Buscar detalhes dos agendamentos
      const appointmentIds = sessoesPendentes.map(s => s.appointment_id).filter(Boolean)
      
      const { data: agendamentos, error: agendError } = await supabase
        .from('painel_agendamentos')
        .select(`
          id,
          data,
          hora,
          status,
          cliente_id,
          barbeiro_id,
          servico_id,
          painel_clientes(nome, whatsapp, telefone),
          painel_barbeiros(nome),
          painel_servicos(nome, preco)
        `)
        .in('id', appointmentIds)

      if (agendError) {
        console.error('❌ Erro ao buscar agendamentos:', agendError)
        throw agendError
      }

      // Combinar dados
      const agendamentosPendentes = sessoesPendentes.map(sessao => {
        const agendamento = agendamentos?.find(a => a.id === sessao.appointment_id)
        return {
          ...agendamento,
          session_id: sessao.totem_session_id,
          session_status: sessao.status,
          totem_session: sessao.totem_sessions
        }
      }).filter(a => a.id) // Filtrar apenas os que têm agendamento válido

      console.log(`✅ Encontrados ${agendamentosPendentes.length} agendamentos com check-in pendente`)

      return new Response(
        JSON.stringify({
          success: true,
          count: agendamentosPendentes.length,
          appointments: agendamentosPendentes
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ==================== ACTION: FORCE_CHECKOUT ====================
    if (action === 'force_checkout') {
      console.log('🔧 Forçando checkout para sessão:', session_id)

      if (!session_id) {
        throw new Error('session_id é obrigatório para force_checkout')
      }

      // Buscar appointment_totem_session pela totem_session_id
      const { data: appointmentSession, error: sessionError } = await supabase
        .from('appointment_totem_sessions')
        .select('*, totem_sessions(*)')
        .eq('totem_session_id', session_id)
        .eq('status', 'checked_in')
        .maybeSingle()

      if (sessionError) {
        console.error('❌ Erro ao buscar sessão:', sessionError)
        throw sessionError
      }

      if (!appointmentSession) {
        console.error('❌ Sessão não encontrada ou já finalizada:', session_id)
        throw new Error('Sessão não encontrada ou já finalizada')
      }

      const appointment_id = appointmentSession.appointment_id

      console.log('✅ Sessão válida para checkout forçado:', session_id, 'Appointment:', appointment_id)

      // Buscar agendamento com detalhes
      const { data: agendamento, error: agendError } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_servicos(nome, preco),
          painel_barbeiros(id, nome, staff_id)
        `)
        .eq('id', appointment_id)
        .single()

      if (agendError || !agendamento) {
        console.error('❌ Agendamento não encontrado:', agendError)
        throw new Error('Agendamento não encontrado')
      }

      // Criar venda se não existir
      const preco = agendamento.painel_servicos?.preco || 0
      const nomeServico = agendamento.painel_servicos?.nome || 'Serviço'
      const barbeiro_id = agendamento.barbeiro_id

      const { data: novaVenda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          cliente_id: agendamento.cliente_id,
          barbeiro_id: barbeiro_id,
          valor_total: preco,
          desconto: 0,
          status: 'pendente',
          observacoes: `Checkout forçado - Agendamento ${appointment_id}`
        })
        .select()
        .single()

      if (vendaError) {
        console.error('❌ Erro ao criar venda:', vendaError)
        throw vendaError
      }

      console.log('✅ Venda criada:', novaVenda.id)

      // Criar item da venda
      await supabase
        .from('vendas_itens')
        .insert({
          venda_id: novaVenda.id,
          tipo: 'servico',
          item_id: agendamento.servico_id || agendamento.id,
          nome: nomeServico,
          quantidade: 1,
          preco_unitario: preco,
          subtotal: preco,
          barbeiro_id: barbeiro_id
        })

      // Atualizar appointment_totem_session para completed
      const { error: updateSessionError } = await supabase
        .from('appointment_totem_sessions')
        .update({
          status: 'completed'
        })
        .eq('id', appointmentSession.id)

      if (updateSessionError) {
        console.error('❌ Erro ao atualizar sessão:', updateSessionError)
        throw updateSessionError
      }

      // Invalidar totem_session
      await supabase
        .from('totem_sessions')
        .update({
          is_valid: false
        })
        .eq('id', session_id)

      // Atualizar agendamento para concluído
      await supabase
        .from('painel_agendamentos')
        .update({
          status: 'concluido',
          status_totem: 'FINALIZADO',
          venda_id: novaVenda.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointment_id)

      console.log('✅ Checkout forçado com sucesso!')

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Checkout realizado com sucesso',
          session_id: session_id,
          venda_id: novaVenda.id,
          appointment_id: appointment_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Action inválida
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
