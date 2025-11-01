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
      console.log('Iniciando checkout para agendamento:', agendamento_id)

      // Buscar agendamento completo
      const { data: agendamento, error: agendError } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          cliente:painel_clientes(*),
          barbeiro:painel_barbeiros(*),
          servico:painel_servicos(*)
        `)
        .eq('id', agendamento_id)
        .single()

      if (agendError || !agendamento) {
        throw new Error('Agendamento não encontrado')
      }

      // Buscar sessão totem ativa
      const { data: totemSession, error: sessionError } = await supabase
        .from('totem_sessions')
        .select('*')
        .eq('appointment_id', agendamento_id)
        .in('status', ['check_in', 'in_service', 'checkout'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (sessionError) {
        console.error('Erro ao buscar sessão totem:', sessionError)
        throw new Error('Erro ao buscar sessão do totem')
      }

      if (!totemSession) {
        console.error('Nenhuma sessão encontrada para agendamento:', agendamento_id)
        throw new Error('Sessão não encontrada. Faça check-in primeiro.')
      }

      console.log('Sessão encontrada:', totemSession.id, 'status:', totemSession.status)

      // Buscar barbeiro staff_id
      const { data: barbeiro } = await supabase
        .from('painel_barbeiros')
        .select('staff_id')
        .eq('id', agendamento.barbeiro_id)
        .single()

      // Criar venda
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          agendamento_id: agendamento_id,
          cliente_id: agendamento.cliente_id,
          barbeiro_id: barbeiro?.staff_id,
          status: 'ABERTA'
        })
        .select()
        .single()

      if (vendaError) {
        console.error('Erro detalhado ao criar venda:', vendaError)
        throw new Error(`Erro ao criar venda: ${vendaError.message}`)
      }

      if (!venda) {
        throw new Error('Venda não foi criada')
      }

      console.log('Venda criada:', venda.id)

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
      const { data: servicos_extras } = await supabase
        .from('appointment_extra_services')
        .select(`
          *,
          servico:painel_servicos(*)
        `)
        .eq('appointment_id', agendamento_id)

      if (servicos_extras && servicos_extras.length > 0) {
        servicos_extras.forEach((extra: any) => {
          itens.push({
            venda_id: venda.id,
            tipo: 'SERVICO',
            ref_id: extra.service_id,
            nome: extra.servico.nome,
            quantidade: 1,
            preco_unit: extra.servico.preco,
            total: extra.servico.preco
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

      console.log('Checkout iniciado com sucesso')

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
      console.log('Finalizando checkout - venda:', venda_id, 'session:', session_id)

      if (!venda_id || !session_id || !payment_id) {
        throw new Error('Dados insuficientes para finalizar')
      }

      // Buscar venda
      const { data: venda } = await supabase
        .from('vendas')
        .select('*, barbeiro_id')
        .eq('id', venda_id)
        .single()

      if (!venda) {
        throw new Error('Venda não encontrada')
      }

      // Buscar sessão
      const { data: session } = await supabase
        .from('totem_sessions')
        .select('appointment_id')
        .eq('id', session_id)
        .single()

      if (!session) {
        throw new Error('Sessão não encontrada')
      }

      // Buscar agendamento
      const { data: agendamento } = await supabase
        .from('painel_agendamentos')
        .select('barbeiro_id')
        .eq('id', session.appointment_id)
        .single()

      // 1. Atualizar pagamento
      await supabase
        .from('totem_payments')
        .update({ 
          paid_at: new Date().toISOString()
        })
        .eq('id', payment_id)

      // 2. Atualizar sessão totem
      await supabase
        .from('totem_sessions')
        .update({ 
          status: 'completed',
          check_out_time: new Date().toISOString()
        })
        .eq('id', session_id)

      // 3. Atualizar venda
      await supabase
        .from('vendas')
        .update({ status: 'PAGA' })
        .eq('id', venda_id)

      // 4. Atualizar agendamento
      await supabase
        .from('painel_agendamentos')
        .update({ status: 'FINALIZADO' })
        .eq('id', session.appointment_id)

      // 5. Buscar taxa de comissão do barbeiro
      const { data: barbeiro } = await supabase
        .from('staff')
        .select('commission_rate')
        .eq('id', venda.barbeiro_id)
        .single()

      const commission_rate = barbeiro?.commission_rate || 50

      // 6. Calcular e gerar comissão
      const commission_amount = venda.total * (commission_rate / 100)

      await supabase
        .from('comissoes')
        .insert({
          barbeiro_id: venda.barbeiro_id,
          agendamento_id: session.appointment_id,
          valor: commission_amount,
          percentual: commission_rate,
          data: new Date().toISOString().split('T')[0],
          status: 'gerado'
        })

      // 7. Criar transações financeiras
      // Receita
      await supabase
        .from('finance_transactions')
        .insert({
          tipo: 'receita',
          categoria: 'servico',
          descricao: 'Atendimento finalizado via Totem',
          valor: venda.total,
          data: new Date().toISOString().split('T')[0],
          agendamento_id: session.appointment_id,
          barbeiro_id: venda.barbeiro_id,
          status: 'pago'
        })

      // Despesa (comissão)
      await supabase
        .from('finance_transactions')
        .insert({
          tipo: 'despesa',
          categoria: 'comissao',
          descricao: `Comissão ${commission_rate}% - Atendimento`,
          valor: commission_amount,
          data: new Date().toISOString().split('T')[0],
          agendamento_id: session.appointment_id,
          barbeiro_id: venda.barbeiro_id,
          status: 'pago'
        })

      // 8. Notificar barbeiro via Realtime
      const channel = supabase.channel(`barbearia:${agendamento.barbeiro_id}`)
      await channel.send({
        type: 'broadcast',
        event: 'FINALIZADO',
        payload: {
          tipo: 'FINALIZADO',
          agendamento_id: session.appointment_id,
          venda_id: venda_id,
          total: venda.total,
          timestamp: new Date().toISOString()
        }
      })

      console.log('Checkout finalizado com sucesso')

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Checkout finalizado com sucesso'
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
