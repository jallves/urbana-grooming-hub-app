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

    const { agendamento_id, extras, action, venda_id, session_id, payment_id } = await req.json()

    // ==================== ACTION: START ====================
    if (action === 'start') {
      console.log('🛒 Iniciando checkout para agendamento:', agendamento_id, 'sessão fornecida:', session_id)

      // 🔒 SUPORTE UNIFICADO: Buscar agendamento em ambas as tabelas
      let agendamento
      let barbeiro_staff_id
      
      // Tentar buscar em painel_agendamentos primeiro
      const painelResult = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          cliente:painel_clientes(*),
          barbeiro:painel_barbeiros(*),
          servico:painel_servicos(*)
        `)
        .eq('id', agendamento_id)
        .maybeSingle()

      if (painelResult.data) {
        console.log('✅ Agendamento encontrado em painel_agendamentos')
        agendamento = painelResult.data
        
        // Buscar staff_id do barbeiro
        const { data: barbeiro } = await supabase
          .from('painel_barbeiros')
          .select('staff_id')
          .eq('id', agendamento.barbeiro_id)
          .single()
        
        barbeiro_staff_id = barbeiro?.staff_id
      } else {
        // Tentar em appointments
        console.log('⚠️ Não encontrado em painel_agendamentos, buscando em appointments...')
        const appointmentsResult = await supabase
          .from('appointments')
          .select(`
            *,
            client:clients(*),
            staff:staff(*),
            service:services(*)
          `)
          .eq('id', agendamento_id)
          .maybeSingle()

        if (appointmentsResult.data) {
          console.log('✅ Agendamento encontrado em appointments')
          const apt = appointmentsResult.data
          
          // Normalizar estrutura
          agendamento = {
            id: apt.id,
            cliente_id: apt.client_id,
            barbeiro_id: apt.staff_id,
            servico_id: apt.service_id,
            data: apt.start_time?.split('T')[0],
            hora: apt.start_time?.split('T')[1]?.substring(0, 5),
            cliente: {
              id: apt.client?.id,
              nome: apt.client?.name
            },
            barbeiro: {
              id: apt.staff?.id,
              nome: apt.staff?.name
            },
            servico: {
              id: apt.service?.id,
              nome: apt.service?.name,
              preco: apt.service?.price
            }
          }
          
          barbeiro_staff_id = apt.staff_id
        }
      }

      if (!agendamento) {
        console.error('❌ Agendamento não encontrado:', agendamento_id)
        throw new Error('Agendamento não encontrado em nenhuma tabela')
      }

      console.log('✅ Agendamento encontrado:', agendamento.id, 'Cliente:', agendamento.cliente?.nome, 'Hora:', agendamento.hora)

      // Se session_id foi fornecido, usar diretamente. Caso contrário, buscar
      let totemSession
      
      if (session_id) {
        console.log('🔍 Buscando sessão específica:', session_id)
        const { data: specificSession, error: specificError } = await supabase
          .from('totem_sessions')
          .select('*')
          .eq('id', session_id)
          .single()
        
        if (specificError || !specificSession) {
          console.error('❌ Sessão específica não encontrada:', session_id, specificError)
          throw new Error('Sessão não encontrada')
        }
        
        totemSession = specificSession
        console.log('✅ Sessão específica encontrada:', totemSession.id, 'Status:', totemSession.status)
      } else {
        console.log('🔍 Buscando sessão ativa mais recente para agendamento:', agendamento_id)
        // Buscar sessão totem ativa MAIS RECENTE para este agendamento
        const { data: foundSession, error: sessionError } = await supabase
          .from('totem_sessions')
          .select('*')
          .eq('appointment_id', agendamento_id)
          .in('status', ['check_in', 'in_service', 'checkout'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (sessionError) {
          console.error('❌ Erro ao buscar sessão totem:', sessionError)
          throw new Error('Erro ao buscar sessão do totem')
        }

        if (!foundSession) {
          console.error('❌ Nenhuma sessão ativa encontrada para agendamento:', agendamento_id)
          throw new Error('Sessão não encontrada. Faça check-in primeiro.')
        }

        totemSession = foundSession
        console.log('✅ Sessão ativa encontrada:', totemSession.id, 'Status:', totemSession.status, 'Check-in:', totemSession.check_in_time)
      }

      // barbeiro_staff_id já foi definido acima na busca unificada

      // 🔒 CORREÇÃO CRÍTICA: Verificar venda ABERTA por AGENDAMENTO primeiro
      let venda
      
      // Buscar venda ABERTA por agendamento (não só por sessão)
      const { data: vendaExistentePorAgendamento } = await supabase
        .from('vendas')
        .select('*')
        .eq('agendamento_id', agendamento_id)
        .eq('status', 'ABERTA')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (vendaExistentePorAgendamento) {
        console.log('✅ Venda ABERTA encontrada para agendamento:', agendamento_id, '- venda:', vendaExistentePorAgendamento.id)
        venda = vendaExistentePorAgendamento
        
        // Vincular venda à sessão atual se ainda não estiver vinculada
        if (venda.totem_session_id !== totemSession.id) {
          console.log('🔄 Vinculando venda existente à nova sessão:', totemSession.id)
          await supabase
            .from('vendas')
            .update({ totem_session_id: totemSession.id })
            .eq('id', venda.id)
        }
        
        // Deletar itens antigos para recalcular
        console.log('🗑️ Deletando itens antigos para recalcular total...')
        await supabase
          .from('vendas_itens')
          .delete()
          .eq('venda_id', venda.id)
      } else {
        // Criar nova venda vinculada à sessão
        console.log('➕ Criando nova venda para agendamento:', agendamento_id)
        const { data: novaVenda, error: vendaError } = await supabase
          .from('vendas')
          .insert({
            agendamento_id: agendamento_id,
            cliente_id: agendamento.cliente_id,
            barbeiro_id: barbeiro_staff_id,
            totem_session_id: totemSession.id,
            status: 'ABERTA'
          })
          .select()
          .single()

        if (vendaError) {
          console.error('❌ Erro detalhado ao criar venda:', vendaError)
          throw new Error(`Erro ao criar venda: ${vendaError.message}`)
        }

        if (!novaVenda) {
          throw new Error('Venda não foi criada')
        }

        venda = novaVenda
        console.log('✅ Nova venda criada - ID:', venda.id, 'sessão:', totemSession.id)
      }

      console.log('📝 Venda ID:', venda.id, 'vinculada à sessão:', totemSession.id)


      // Adicionar serviço principal
      const itens = [
        {
          venda_id: venda.id,
          tipo: 'SERVICO',
          ref_id: agendamento.servico_id,
          nome: agendamento.servico.nome,
          quantidade: 1,
          preco_unit: agendamento.servico.preco,
          total: agendamento.servico.preco
        }
      ]

      // Buscar serviços extras se existirem
      console.log('🔍 Buscando serviços extras para agendamento:', agendamento_id)
      
      const { data: servicos_extras, error: extrasError } = await supabase
        .from('appointment_extra_services')
        .select(`
          service_id,
          painel_servicos!inner (
            id,
            nome,
            preco
          )
        `)
        .eq('appointment_id', agendamento_id)

      if (extrasError) {
        console.error('❌ Erro ao buscar serviços extras:', extrasError)
      } else {
        console.log('📦 Serviços extras encontrados:', servicos_extras?.length || 0)
      }

      if (servicos_extras && servicos_extras.length > 0) {
        servicos_extras.forEach((extra: any) => {
          const servico = extra.painel_servicos
          console.log('➕ Adicionando extra ao checkout:', servico.nome, 'R$', servico.preco)
          
          itens.push({
            venda_id: venda.id,
            tipo: 'SERVICO',
            ref_id: extra.service_id,
            nome: servico.nome,
            quantidade: 1,
            preco_unit: servico.preco,
            total: servico.preco
          })
        })
      }

      // Adicionar extras fornecidos (se houver)
      if (extras && extras.length > 0) {
        for (const extra of extras) {
          // Buscar dados do serviço/produto
          if (extra.tipo === 'servico') {
            const { data: servico } = await supabase
              .from('painel_servicos')
              .select('nome, preco')
              .eq('id', extra.id)
              .single()

            if (servico) {
              itens.push({
                venda_id: venda.id,
                tipo: 'SERVICO',
                ref_id: extra.id,
                nome: servico.nome,
                quantidade: extra.quantidade || 1,
                preco_unit: servico.preco,
                total: servico.preco * (extra.quantidade || 1)
              })
            }
          } else if (extra.tipo === 'produto') {
            const { data: produto } = await supabase
              .from('produtos')
              .select('nome, preco_venda')
              .eq('id', extra.id)
              .single()

            if (produto) {
              itens.push({
                venda_id: venda.id,
                tipo: 'PRODUTO',
                ref_id: extra.id,
                nome: produto.nome,
                quantidade: extra.quantidade || 1,
                preco_unit: produto.preco_venda,
                total: produto.preco_venda * (extra.quantidade || 1)
              })
            }
          }
        }
      }

      // Inserir itens da venda
      const { error: itensError } = await supabase
        .from('vendas_itens')
        .insert(itens)

      if (itensError) {
        console.error('Erro ao inserir itens:', itensError)
        throw new Error('Erro ao adicionar itens da venda')
      }

      // Calcular totais
      const subtotal = itens.reduce((sum, item) => sum + Number(item.total), 0)
      const desconto = 0 // Pode implementar lógica de desconto aqui
      const total = subtotal - desconto

      // Atualizar venda com totais
      await supabase
        .from('vendas')
        .update({
          subtotal,
          desconto,
          total
        })
        .eq('id', venda.id)

      // Atualizar sessão para checkout
      await supabase
        .from('totem_sessions')
        .update({ status: 'checkout' })
        .eq('id', totemSession.id)

      console.log('✅ Checkout iniciado com sucesso - Venda:', venda.id, 'Sessão:', totemSession.id, 'Total:', total)

      return new Response(
        JSON.stringify({
          success: true,
          venda_id: venda.id,
          session_id: totemSession.id,
          resumo: {
            original_service: {
              nome: agendamento.servico.nome,
              preco: agendamento.servico.preco
            },
            extra_services: itens.slice(1).map(i => ({
              nome: i.nome,
              preco: i.preco_unit
            })),
            subtotal,
            discount: desconto,
            total
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ==================== ACTION: FINISH ====================
    if (action === 'finish') {
      console.log('🎯 Finalizando checkout - venda:', venda_id, 'session:', session_id, 'payment:', payment_id)

      if (!venda_id || !session_id || !payment_id) {
        console.error('❌ Dados insuficientes:', { venda_id, session_id, payment_id })
        throw new Error('Dados insuficientes para finalizar checkout')
      }

      // 🔒 Validar que o pagamento existe e está completo
      const { data: payment, error: paymentError } = await supabase
        .from('totem_payments')
        .select('*')
        .eq('id', payment_id)
        .single()

      if (paymentError || !payment) {
        console.error('❌ Pagamento não encontrado:', payment_id)
        throw new Error('Pagamento não encontrado. Gere o pagamento antes de finalizar.')
      }

      if (payment.status !== 'completed' && payment.status !== 'paid') {
        console.error('❌ Pagamento não está completo:', payment.status)
        throw new Error('Pagamento ainda não foi confirmado. Complete o pagamento primeiro.')
      }

      console.log('✅ Pagamento validado:', payment.id, 'Status:', payment.status)

      // Buscar venda
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .select('*, barbeiro_id, agendamento_id')
        .eq('id', venda_id)
        .single()

      if (vendaError || !venda) {
        console.error('❌ Venda não encontrada:', venda_id)
        throw new Error('Venda não encontrada')
      }

      // Verificar se venda já foi finalizada
      if (venda.status === 'PAGA' || venda.status === 'FINALIZADA') {
        console.log('⚠️ Venda já foi finalizada anteriormente')
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Checkout já foi finalizado anteriormente',
            already_completed: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ Venda encontrada:', venda.id, 'Agendamento:', venda.agendamento_id)

      // Buscar sessão
      const { data: session, error: sessionError } = await supabase
        .from('totem_sessions')
        .select('appointment_id')
        .eq('id', session_id)
        .single()

      if (sessionError || !session) {
        console.error('❌ Sessão não encontrada:', session_id)
        throw new Error('Sessão não encontrada')
      }

      console.log('✅ Sessão encontrada:', session.id)

      // Buscar agendamento
      const { data: agendamento, error: agendError } = await supabase
        .from('painel_agendamentos')
        .select('barbeiro_id, status')
        .eq('id', venda.agendamento_id)
        .single()

      if (agendError || !agendamento) {
        console.error('❌ Agendamento não encontrado:', venda.agendamento_id)
        throw new Error('Agendamento não encontrado')
      }

      console.log('✅ Agendamento encontrado:', venda.agendamento_id, 'Status atual:', agendamento.status)

      // 1. Atualizar pagamento com confirmação
      console.log('💳 Confirmando pagamento...')
      await supabase
        .from('totem_payments')
        .update({ 
          paid_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', payment_id)

      // 2. Atualizar sessão totem para completed
      console.log('🔄 Finalizando sessão...')
      await supabase
        .from('totem_sessions')
        .update({ 
          status: 'completed',
          check_out_time: new Date().toISOString()
        })
        .eq('id', session_id)

      // 3. Atualizar venda para PAGA
      console.log('💰 Marcando venda como PAGA...')
      await supabase
        .from('vendas')
        .update({ 
          status: 'PAGA',
          updated_at: new Date().toISOString()
        })
        .eq('id', venda_id)

      // 4. Atualizar agendamento para CONCLUÍDO (trigger automático cria financeiro)
      console.log('✅ Finalizando agendamento...')
      const { error: updateError } = await supabase
        .from('painel_agendamentos')
        .update({ 
          status: 'concluido',
          status_totem: 'FINALIZADO',
          updated_at: new Date().toISOString()
        })
        .eq('id', venda.agendamento_id)
      
      if (updateError) {
        console.error('❌ Erro ao atualizar agendamento:', updateError)
        throw new Error('Erro ao finalizar agendamento: ' + updateError.message)
      }

      console.log('✅ Agendamento atualizado para CONCLUÍDO - Trigger criará registros financeiros')

      // 5. Notificar barbeiro via Realtime
      console.log('📢 Notificando barbeiro...')
      const channel = supabase.channel(`barbearia:${agendamento.barbeiro_id}`)
      await channel.send({
        type: 'broadcast',
        event: 'FINALIZADO',
        payload: {
          tipo: 'FINALIZADO',
          agendamento_id: venda.agendamento_id,
          venda_id: venda_id,
          total: venda.total,
          timestamp: new Date().toISOString()
        }
      })

      console.log('✅ Checkout finalizado com sucesso!')
      console.log('   💰 Venda:', venda.id)
      console.log('   📅 Agendamento:', venda.agendamento_id)
      console.log('   💳 Pagamento:', payment.id)
      console.log('   💵 Total:', venda.total)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Checkout finalizado com sucesso',
          data: {
            venda_id: venda.id,
            agendamento_id: venda.agendamento_id,
            total: venda.total,
            payment_id: payment.id
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Action inválida
    return new Response(
      JSON.stringify({ error: 'Action inválida' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Erro no checkout:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
