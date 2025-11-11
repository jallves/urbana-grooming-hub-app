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

      // Buscar agendamentos com check-in mas sem checkout
      const { data: agendamentosPendentes, error: listError } = await supabase
        .from('painel_agendamentos')
        .select(`
          id,
          data,
          hora,
          status,
          cliente_id,
          barbeiro_id,
          servico_id,
          painel_clientes!inner(nome, whatsapp),
          painel_barbeiros!inner(nome),
          painel_servicos!inner(nome, preco),
          totem_sessions!inner(
            id,
            check_in_time,
            check_out_time,
            status
          )
        `)
        .not('totem_sessions.check_in_time', 'is', null)
        .is('totem_sessions.check_out_time', null)
        .order('data', { ascending: false })
        .order('hora', { ascending: false })

      if (listError) {
        console.error('❌ Erro ao listar agendamentos pendentes:', listError)
        throw listError
      }

      console.log(`✅ Encontrados ${agendamentosPendentes?.length || 0} agendamentos com check-in pendente`)

      return new Response(
        JSON.stringify({
          success: true,
          count: agendamentosPendentes?.length || 0,
          appointments: agendamentosPendentes || []
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

      // Buscar sessão
      const { data: session, error: sessionError } = await supabase
        .from('totem_sessions')
        .select('*, appointment_id')
        .eq('id', session_id)
        .single()

      if (sessionError || !session) {
        console.error('❌ Sessão não encontrada:', session_id)
        throw new Error('Sessão não encontrada')
      }

      // Validar que tem check-in
      if (!session.check_in_time) {
        throw new Error('Esta sessão não possui check-in')
      }

      // Validar que NÃO tem check-out
      if (session.check_out_time) {
        throw new Error('Esta sessão já possui check-out')
      }

      console.log('✅ Sessão válida para checkout forçado:', session.id)

      // Buscar venda associada
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .select('*')
        .eq('agendamento_id', session.appointment_id)
        .eq('status', 'ABERTA')
        .maybeSingle()

      let venda_id = venda?.id

      // Se não existe venda, criar uma
      if (!venda) {
        console.log('📝 Criando venda para checkout forçado...')

        // Buscar agendamento
        const { data: agendamento, error: agendError } = await supabase
          .from('painel_agendamentos')
          .select(`
            *,
            painel_servicos!inner(nome, preco),
            painel_barbeiros!inner(staff_id)
          `)
          .eq('id', session.appointment_id)
          .single()

        if (agendError || !agendamento) {
          throw new Error('Agendamento não encontrado')
        }

        // Criar venda
        const { data: novaVenda, error: novaVendaError } = await supabase
          .from('vendas')
          .insert({
            agendamento_id: session.appointment_id,
            cliente_id: agendamento.cliente_id,
            barbeiro_id: agendamento.painel_barbeiros.staff_id,
            totem_session_id: session_id,
            subtotal: agendamento.painel_servicos.preco,
            desconto: 0,
            total: agendamento.painel_servicos.preco,
            status: 'ABERTA'
          })
          .select()
          .single()

        if (novaVendaError || !novaVenda) {
          console.error('❌ Erro ao criar venda:', novaVendaError)
          throw new Error('Erro ao criar venda')
        }

        venda_id = novaVenda.id

        // Criar item da venda
        await supabase
          .from('vendas_itens')
          .insert({
            venda_id: novaVenda.id,
            tipo: 'SERVICO',
            ref_id: agendamento.servico_id,
            nome: agendamento.painel_servicos.nome,
            quantidade: 1,
            preco_unit: agendamento.painel_servicos.preco,
            total: agendamento.painel_servicos.preco
          })

        console.log('✅ Venda criada:', novaVenda.id)
      }

      // Atualizar sessão para completed com checkout
      const { error: updateSessionError } = await supabase
        .from('totem_sessions')
        .update({
          status: 'completed',
          check_out_time: new Date().toISOString()
        })
        .eq('id', session_id)

      if (updateSessionError) {
        console.error('❌ Erro ao atualizar sessão:', updateSessionError)
        throw updateSessionError
      }

      // Se tem venda, marcar como PAGA
      if (venda_id) {
        await supabase
          .from('vendas')
          .update({
            status: 'PAGA',
            updated_at: new Date().toISOString()
          })
          .eq('id', venda_id)
      }

      // Atualizar agendamento para concluído
      await supabase
        .from('painel_agendamentos')
        .update({
          status: 'concluido',
          status_totem: 'FINALIZADO',
          updated_at: new Date().toISOString()
        })
        .eq('id', session.appointment_id)

      console.log('✅ Checkout forçado com sucesso!')

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Checkout realizado com sucesso',
          session_id: session_id,
          venda_id: venda_id
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
