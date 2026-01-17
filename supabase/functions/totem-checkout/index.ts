import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { toBrazilISOString } from '../_shared/brazilDateTime.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { agendamento_id, extras, products, action, venda_id, session_id, payment_method, tipAmount } = await req.json()

    // ==================== ACTION: START ====================
    if (action === 'start') {
      console.log('🛒 Iniciando checkout para agendamento:', agendamento_id)
      console.log('📦 Extras recebidos:', extras?.length || 0)
      console.log('📦 Produtos recebidos:', products?.length || 0)

      // Buscar agendamento em painel_agendamentos
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
        console.error('❌ Agendamento não encontrado:', agendamento_id, agendError)
        throw new Error('Agendamento não encontrado')
      }

      console.log('✅ Agendamento encontrado:', agendamento.id, 'Cliente:', agendamento.cliente?.nome)

      // Verificar se já existe venda para este agendamento
      const { data: vendaExistente } = await supabase
        .from('painel_agendamentos')
        .select('venda_id')
        .eq('id', agendamento_id)
        .single()

      let venda
      let vendaId = vendaExistente?.venda_id

      if (vendaId) {
        // Buscar venda existente
        const { data: vendaData } = await supabase
          .from('vendas')
          .select('*')
          .eq('id', vendaId)
          .single()

        if (vendaData && vendaData.status !== 'pago') {
          venda = vendaData
          console.log('✅ Venda existente encontrada:', venda.id)

          // Limpar itens para recalcular
          await supabase
            .from('vendas_itens')
            .delete()
            .eq('venda_id', venda.id)
        }
      }

      // Se não existe venda, criar nova
      if (!venda) {
        console.log('➕ Criando nova venda...')
        const { data: novaVenda, error: vendaError } = await supabase
          .from('vendas')
          .insert({
            cliente_id: agendamento.cliente_id,
            barbeiro_id: agendamento.barbeiro_id,
            valor_total: 0,
            status: 'pendente'
          })
          .select()
          .single()

        if (vendaError) {
          console.error('❌ Erro ao criar venda:', vendaError)
          throw new Error('Erro ao criar venda')
        }

        venda = novaVenda
        console.log('✅ Nova venda criada:', venda.id)

        // Vincular venda ao agendamento
        await supabase
          .from('painel_agendamentos')
          .update({ venda_id: venda.id })
          .eq('id', agendamento_id)
      }

      // Preparar itens - Serviço principal
      const itens = [{
        venda_id: venda.id,
        tipo: 'SERVICO',
        item_id: agendamento.servico_id,
        nome: agendamento.servico.nome,
        quantidade: 1,
        preco_unitario: agendamento.servico.preco,
        subtotal: agendamento.servico.preco,
        barbeiro_id: agendamento.barbeiro_id
      }]

      // Processar serviços extras passados via frontend (parâmetro extras)
      if (extras && extras.length > 0) {
        console.log('📦 Processando serviços extras do frontend:', extras.length)
        for (const extra of extras) {
          // Buscar dados do serviço
          const { data: servicoExtra } = await supabase
            .from('painel_servicos')
            .select('id, nome, preco')
            .eq('id', extra.id)
            .single()

          if (servicoExtra) {
            itens.push({
              venda_id: venda.id,
              tipo: 'SERVICO_EXTRA',
              item_id: servicoExtra.id,
              nome: servicoExtra.nome,
              quantidade: 1,
              preco_unitario: servicoExtra.preco,
              subtotal: servicoExtra.preco,
              barbeiro_id: agendamento.barbeiro_id
            })
          }
        }
      }

      // Processar produtos passados via frontend (parâmetro products)
      if (products && products.length > 0) {
        console.log('📦 Processando produtos do frontend:', products.length)
        for (const product of products) {
          // Buscar dados do produto
          const { data: produto } = await supabase
            .from('painel_produtos')
            .select('id, nome, preco')
            .eq('id', product.id)
            .single()

          if (produto) {
            const qty = product.quantidade || 1
            itens.push({
              venda_id: venda.id,
              tipo: 'PRODUTO',
              item_id: produto.id,
              nome: produto.nome,
              quantidade: qty,
              preco_unitario: produto.preco,
              subtotal: produto.preco * qty,
              barbeiro_id: agendamento.barbeiro_id
            })
          }
        }
      }

      // Inserir itens
      const { error: itensError } = await supabase
        .from('vendas_itens')
        .insert(itens)

      if (itensError) {
        console.error('❌ Erro ao inserir itens:', itensError)
        throw new Error('Erro ao adicionar itens')
      }

      // Calcular total
      const total = itens.reduce((sum, item) => sum + Number(item.subtotal), 0)

      // Atualizar venda com total
      await supabase
        .from('vendas')
        .update({ valor_total: total })
        .eq('id', venda.id)

      console.log('✅ Checkout iniciado - Venda:', venda.id, 'Total: R$', total)

      return new Response(
        JSON.stringify({
          success: true,
          venda_id: venda.id,
          session_id: session_id,
          resumo: {
            original_service: {
              nome: agendamento.servico.nome,
              preco: agendamento.servico.preco
            },
            extra_services: itens.filter(i => i.tipo === 'SERVICO_EXTRA').map(i => ({
              nome: i.nome,
              preco: i.preco_unitario
            })),
            products: itens.filter(i => i.tipo === 'PRODUTO').map(i => ({
              nome: i.nome,
              quantidade: i.quantidade,
              preco: i.preco_unitario
            })),
            subtotal: total,
            discount: 0,
            total: total
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ==================== ACTION: FINISH ====================
    if (action === 'finish') {
      console.log('🎯 Finalizando checkout - venda:', venda_id)

      if (!venda_id) {
        throw new Error('venda_id é obrigatório')
      }

      // Buscar venda
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .select('*')
        .eq('id', venda_id)
        .single()

      if (vendaError || !venda) {
        console.error('❌ Venda não encontrada:', venda_id)
        throw new Error('Venda não encontrada')
      }

      // Verificar se já foi paga (idempotência)
      if (venda.status === 'pago') {
        console.log('⚠️ Venda já foi finalizada')
        return new Response(
          JSON.stringify({ success: true, message: 'Venda já foi finalizada', already_completed: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Buscar agendamento vinculado
      const { data: agendamento } = await supabase
        .from('painel_agendamentos')
        .select('*, barbeiro:painel_barbeiros(*)')
        .eq('venda_id', venda_id)
        .single()

      if (!agendamento) {
        console.error('❌ Agendamento não encontrado para venda:', venda_id)
        throw new Error('Agendamento não encontrado')
      }

      // Buscar itens da venda
      const { data: vendaItens } = await supabase
        .from('vendas_itens')
        .select('*')
        .eq('venda_id', venda_id)

      // Calcular total com gorjeta
      const subtotal = vendaItens?.reduce((sum, item) => sum + Number(item.subtotal), 0) || 0
      const gorjeta = tipAmount || 0
      const totalFinal = subtotal + gorjeta

      console.log('💰 Subtotal:', subtotal, 'Gorjeta:', gorjeta, 'Total:', totalFinal)

      // Atualizar venda para PAGA
      await supabase
        .from('vendas')
        .update({
          status: 'pago',
          valor_total: totalFinal,
          gorjeta: gorjeta,
          forma_pagamento: payment_method || 'CARTAO',
          updated_at: new Date().toISOString()
        })
        .eq('id', venda_id)

      // Atualizar agendamento para CONCLUÍDO
      await supabase
        .from('painel_agendamentos')
        .update({
          status: 'concluido',
          status_totem: 'FINALIZADO',
          updated_at: new Date().toISOString()
        })
        .eq('id', agendamento.id)

      // ==================== INTEGRAÇÃO ERP ====================
      // Verificar se já existem registros financeiros (idempotência)
      const { data: existingRecords } = await supabase
        .from('financial_records')
        .select('id')
        .eq('reference_id', venda_id)
        .limit(1)

      if (!existingRecords || existingRecords.length === 0) {
        console.log('💰 Criando registros financeiros...')

        const barberName = agendamento.barbeiro?.nome || 'Barbeiro'

        // Preparar itens para ERP
        const erpItems = vendaItens?.map(item => ({
          type: item.tipo === 'PRODUTO' ? 'product' : 'service',
          id: item.item_id,
          name: item.nome,
          quantity: item.quantidade,
          price: Number(item.preco_unitario),
          discount: 0,
          isExtra: item.tipo === 'SERVICO_EXTRA'
        })) || []

        // Chamar edge function de transação financeira
        const { data: erpResult, error: erpError } = await supabase.functions.invoke(
          'create-financial-transaction',
          {
            body: {
              appointment_id: agendamento.id,
              client_id: venda.cliente_id,
              // IMPORTANT: financial_records.barber_id referencia painel_barbeiros.id
              barber_id: agendamento.barbeiro_id,
              reference_id: venda_id,
              reference_type: 'totem_venda',
              items: erpItems,
              payment_method: payment_method || 'credit_card',
              discount_amount: Number(venda.desconto) || 0,
              notes: `Checkout Totem - Venda ${venda_id}`,
              tip_amount: gorjeta
            }
          }
        )

        if (erpError) {
          console.error('❌ Erro ao integrar com ERP:', erpError)
        } else {
          console.log('✅ ERP integrado com sucesso:', erpResult)
        }
      } else {
        console.log('⚠️ Registros financeiros já existem - pulando')
      }

      // Atualizar sessão do totem se fornecida
      if (session_id) {
        await supabase
          .from('appointment_totem_sessions')
          .update({ status: 'completed' })
          .eq('appointment_id', agendamento.id)
      }

      // Notificar via Realtime
      const channel = supabase.channel(`barbearia:${agendamento.barbeiro_id}`)
      await channel.send({
        type: 'broadcast',
        event: 'FINALIZADO',
        payload: {
          tipo: 'FINALIZADO',
          agendamento_id: agendamento.id,
          venda_id: venda_id,
          total: totalFinal,
          timestamp: new Date().toISOString()
        }
      })

      console.log('✅ Checkout finalizado com sucesso!')

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Checkout finalizado',
          data: {
            venda_id: venda_id,
            agendamento_id: agendamento.id,
            total: totalFinal,
            gorjeta: gorjeta
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Action inválida. Use: start ou finish' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('❌ Erro no checkout:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
