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

    const { agendamento_id, extras, products, action, venda_id, session_id, payment_method, tipAmount, transaction_data, combo_discount, combo_name } = await req.json()

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

      let venda: any = null
      let vendaId = vendaExistente?.venda_id

      if (vendaId) {
        // Buscar venda existente
        const { data: vendaData } = await supabase
          .from('vendas')
          .select('*')
          .eq('id', vendaId)
          .single()

        // Se já foi paga, não mexe
        if (vendaData && vendaData.status !== 'pago') {
          venda = vendaData
          console.log('✅ Venda existente encontrada:', venda.id)
        } else if (vendaData) {
          console.log('⚠️ Venda já paga encontrada, não será alterada:', vendaData.id)
          venda = vendaData
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

      // Se a venda já estiver paga, só retorna (idempotente)
      if (venda?.status === 'pago') {
        return new Response(
          JSON.stringify({
            success: true,
            venda_id: venda.id,
            session_id,
            resumo: null,
            message: 'Venda já paga - start idempotente'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Buscar itens atuais (para reconciliar sem “delete-all”)
      const { data: existingItems } = await supabase
        .from('vendas_itens')
        .select('*')
        .eq('venda_id', venda.id)

      const existingByKey = new Map<string, any>()
      for (const it of existingItems || []) {
        existingByKey.set(`${it.tipo}:${it.item_id}`, it)
      }

      // Preparar itens desejados - Serviço principal
      const desired: any[] = [{
        venda_id: venda.id,
        tipo: 'SERVICO',
        item_id: agendamento.servico_id,
        nome: agendamento.servico.nome,
        quantidade: 1,
        preco_unitario: agendamento.servico.preco,
        subtotal: agendamento.servico.preco,
        barbeiro_id: agendamento.barbeiro_id,
      }]

      // Serviços extras
      if (extras && extras.length > 0) {
        console.log('📦 Processando serviços extras do frontend:', extras.length)
        for (const extra of extras) {
          const { data: servicoExtra } = await supabase
            .from('painel_servicos')
            .select('id, nome, preco')
            .eq('id', extra.id)
            .single()

          if (servicoExtra) {
            desired.push({
              venda_id: venda.id,
              tipo: 'SERVICO_EXTRA',
              item_id: servicoExtra.id,
              nome: servicoExtra.nome,
              quantidade: 1,
              preco_unitario: servicoExtra.preco,
              subtotal: servicoExtra.preco,
              barbeiro_id: agendamento.barbeiro_id,
            })
          }
        }
      }

      // Produtos
      if (products && products.length > 0) {
        console.log('📦 Processando produtos do frontend:', products.length)
        for (const product of products) {
          const { data: produto } = await supabase
            .from('painel_produtos')
            .select('id, nome, preco')
            .eq('id', product.id)
            .single()

          if (produto) {
            const qty = product.quantidade || 1
            desired.push({
              venda_id: venda.id,
              tipo: 'PRODUTO',
              item_id: produto.id,
              nome: produto.nome,
              quantidade: qty,
              preco_unitario: produto.preco,
              subtotal: produto.preco * qty,
              barbeiro_id: agendamento.barbeiro_id,
            })
          }
        }
      }

      // 1) Upsert/update itens desejados
      for (const item of desired) {
        const key = `${item.tipo}:${item.item_id}`
        const existing = existingByKey.get(key)

        if (existing?.id) {
          await supabase
            .from('vendas_itens')
            .update({
              nome: item.nome,
              quantidade: item.quantidade,
              preco_unitario: item.preco_unitario,
              subtotal: item.subtotal,
              barbeiro_id: item.barbeiro_id,
            })
            .eq('id', existing.id)
        } else {
          await supabase.from('vendas_itens').insert(item)
        }
      }

      // 2) Remover itens que não estão mais no carrinho (somente extras/produtos)
      const desiredKeys = new Set(desired.map((d) => `${d.tipo}:${d.item_id}`))
      const toDelete = (existingItems || [])
        .filter((it: any) => (it.tipo === 'SERVICO_EXTRA' || it.tipo === 'PRODUTO'))
        .filter((it: any) => !desiredKeys.has(`${it.tipo}:${it.item_id}`))

      if (toDelete.length > 0) {
        await supabase
          .from('vendas_itens')
          .delete()
          .in('id', toDelete.map((d: any) => d.id))
      }

      // Calcular total (com desconto de combo se aplicável)
      const rawTotal = desired.reduce((sum, item) => sum + Number(item.subtotal), 0)
      const comboDiscountAmount = Number(combo_discount) || 0
      const total = Math.max(0, rawTotal - comboDiscountAmount)

      if (comboDiscountAmount > 0) {
        console.log(`🏷️ Combo detectado: "${combo_name}" - Desconto: R$ ${comboDiscountAmount.toFixed(2)}`)
      }

      // Atualizar venda com total e desconto
      await supabase
        .from('vendas')
        .update({ valor_total: total, desconto: comboDiscountAmount })
        .eq('id', venda.id)

      console.log('✅ Checkout iniciado - Venda:', venda.id, 'Total: R$', total, comboDiscountAmount > 0 ? `(Combo: -R$ ${comboDiscountAmount})` : '')

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
            extra_services: desired.filter(i => i.tipo === 'SERVICO_EXTRA').map(i => ({
              nome: i.nome,
              preco: i.preco_unitario
            })),
            products: desired.filter(i => i.tipo === 'PRODUTO').map(i => ({
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
      const alreadyPaid = venda.status === 'pago'
      if (alreadyPaid) {
        console.log('⚠️ Venda já está paga - garantindo status do agendamento e ERP (idempotente)')
      }


      // Buscar agendamento vinculado (tentar por venda_id primeiro, depois por agendamento_id se fornecido)
      let agendamento: any = null

      // 1) Tentar buscar por venda_id
      const { data: agendamentoByVenda } = await supabase
        .from('painel_agendamentos')
        .select('*, barbeiro:painel_barbeiros(*)')
        .eq('venda_id', venda_id)
        .maybeSingle()

      agendamento = agendamentoByVenda

      // 2) Se não encontrou, tentar pelo agendamento_id recebido no body
      if (!agendamento && agendamento_id) {
        const { data: agendamentoById } = await supabase
          .from('painel_agendamentos')
          .select('*, barbeiro:painel_barbeiros(*)')
          .eq('id', agendamento_id)
          .maybeSingle()

        agendamento = agendamentoById

        // Vincular venda ao agendamento se encontrou
        if (agendamento) {
          await supabase
            .from('painel_agendamentos')
            .update({ venda_id: venda_id })
            .eq('id', agendamento.id)
          console.log('🔗 Venda vinculada ao agendamento:', agendamento.id)
        }
      }


      if (!agendamento) {
        console.error('❌ Agendamento não encontrado para venda:', venda_id)
        throw new Error('Agendamento não encontrado')
      }
      
      console.log('✅ Agendamento encontrado:', agendamento.id, 'Status atual:', agendamento.status)

      // Buscar itens da venda
      let { data: vendaItens } = await supabase
        .from('vendas_itens')
        .select('*')
        .eq('venda_id', venda_id)

      // Fallback crítico: se a venda estiver sem itens, reconstruir (para não perder migração ERP)
      if (!vendaItens || vendaItens.length === 0) {
        console.log('⚠️ Venda sem itens - reconstruindo itens antes de migrar para ERP...')

        const { data: servicoPrincipal, error: servicoError } = await supabase
          .from('painel_servicos')
          .select('id, nome, preco')
          .eq('id', agendamento.servico_id)
          .maybeSingle()

        if (servicoError || !servicoPrincipal) {
          console.error('❌ Não foi possível buscar serviço principal para reconstrução:', servicoError)
        } else {
          const rebuild: any[] = [{
            venda_id,
            tipo: 'SERVICO',
            item_id: servicoPrincipal.id,
            nome: servicoPrincipal.nome,
            quantidade: 1,
            preco_unitario: servicoPrincipal.preco,
            subtotal: servicoPrincipal.preco,
            barbeiro_id: agendamento.barbeiro_id,
          }]

          // Extras (snapshot do frontend, se vier)
          if (extras && extras.length > 0) {
            for (const extra of extras) {
              const { data: servicoExtra } = await supabase
                .from('painel_servicos')
                .select('id, nome, preco')
                .eq('id', extra.id)
                .maybeSingle()

              if (servicoExtra) {
                rebuild.push({
                  venda_id,
                  tipo: 'SERVICO_EXTRA',
                  item_id: servicoExtra.id,
                  nome: servicoExtra.nome,
                  quantidade: 1,
                  preco_unitario: servicoExtra.preco,
                  subtotal: servicoExtra.preco,
                  barbeiro_id: agendamento.barbeiro_id,
                })
              }
            }
          }

          // Produtos (snapshot do frontend, se vier)
          if (products && products.length > 0) {
            for (const product of products) {
              const { data: produto } = await supabase
                .from('painel_produtos')
                .select('id, nome, preco')
                .eq('id', product.id)
                .maybeSingle()

              if (produto) {
                const qty = product.quantidade || 1
                rebuild.push({
                  venda_id,
                  tipo: 'PRODUTO',
                  item_id: produto.id,
                  nome: produto.nome,
                  quantidade: qty,
                  preco_unitario: produto.preco,
                  subtotal: produto.preco * qty,
                  barbeiro_id: agendamento.barbeiro_id,
                })
              }
            }
          }

          await supabase.from('vendas_itens').insert(rebuild)

          // Refetch
          const { data: refetched } = await supabase
            .from('vendas_itens')
            .select('*')
            .eq('venda_id', venda_id)

          vendaItens = refetched || []
        }
      }

      // Calcular total com gorjeta
      const subtotal = vendaItens?.reduce((sum, item) => sum + Number(item.subtotal), 0) || 0
      const gorjeta = tipAmount || 0
      const totalFinal = subtotal + gorjeta

      console.log('💰 Subtotal:', subtotal, 'Gorjeta:', gorjeta, 'Total:', totalFinal)

      // Atualizar venda para PAGA (somente se ainda não estiver paga)
      if (!alreadyPaid) {
        await supabase
          .from('vendas')
          .update({
            status: 'pago',
            valor_total: totalFinal,
            gorjeta: gorjeta,
            forma_pagamento: payment_method || 'CARTAO',
            updated_at: new Date().toISOString(),
          })
          .eq('id', venda_id)
      }


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
      // Sempre invocar (idempotente) para garantir migração completa
      const isSubscriptionCredit = payment_method === 'subscription_credit'
      console.log('💰 Garantindo registros financeiros (idempotente)...', { isSubscriptionCredit })

      // Se for crédito de assinatura, buscar valor unitário do plano
      let subscriptionCreditUnitValue = 0
      if (isSubscriptionCredit && agendamento?.cliente_id) {
        const { data: activeSub } = await supabase
          .from('client_subscriptions')
          .select('plan_id, credits_total')
          .eq('client_id', agendamento.cliente_id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (activeSub) {
          const { data: plan } = await supabase
            .from('subscription_plans')
            .select('price')
            .eq('id', activeSub.plan_id)
            .single()

          if (plan && activeSub.credits_total > 0) {
            subscriptionCreditUnitValue = Number((plan.price / activeSub.credits_total).toFixed(2))
            console.log('💰 Valor unitário do crédito:', subscriptionCreditUnitValue)
          }
        }
      }

      // Preparar itens para ERP
      // Se for crédito de assinatura: preço zerado na receita (já foi pago na aquisição do combo)
      // mas a comissão será calculada sobre o valor unitário do crédito
      const erpItems = (vendaItens || []).map((item: any) => ({
        type: item.tipo === 'PRODUTO' ? 'product' : 'service',
        id: item.item_id,
        name: item.nome,
        quantity: Number(item.quantidade || 1),
        price: isSubscriptionCredit ? 0 : Number(item.preco_unitario || 0),
        discount: 0,
        isExtra: item.tipo === 'SERVICO_EXTRA',
      }))

      // Extrair transaction_id do PayGo (NSU ou confirmationId)
      let transactionId: string | null = null
      if (transaction_data) {
        transactionId = transaction_data.nsu || transaction_data.confirmationId || null
        console.log('💳 Transaction ID do PayGo:', transactionId)
      }
      if (!transactionId) {
        transactionId = `INT-${venda_id.substring(0, 8)}-${Date.now()}`
        console.log('💳 Transaction ID gerado internamente:', transactionId)
      }

      // Notas para o ERP
      const erpNotes = isSubscriptionCredit 
        ? `Uso de crédito assinatura - Checkout Totem - Venda ${venda_id}`
        : `Checkout Totem - Venda ${venda_id}`

      const { data: erpResult, error: erpError } = await supabase.functions.invoke(
        'create-financial-transaction',
        {
          body: {
            appointment_id: agendamento.id,
            client_id: venda.cliente_id,
            barber_id: agendamento.barbeiro_id,
            reference_id: venda_id,
            reference_type: isSubscriptionCredit ? 'totem_subscription_usage' : 'totem_venda',
            items: erpItems,
            payment_method: isSubscriptionCredit ? 'subscription_credit' : (payment_method || 'credit_card'),
            discount_amount: Number(venda.desconto) || 0,
            notes: erpNotes,
            tip_amount: isSubscriptionCredit ? 0 : gorjeta,
            transaction_id: transactionId,
            is_subscription_usage: isSubscriptionCredit, // Comissão REAL para barbeiro atendente
            subscription_credit_unit_value: subscriptionCreditUnitValue, // Valor unitário para cálculo
          },
        }
      )

      if (erpError) {
        console.error('❌ Erro ao integrar com ERP:', erpError)
      } else {
        console.log('✅ ERP integrado com sucesso:', erpResult)
      }

      // ==================== REGISTRO DE USO DA ASSINATURA (admin) ====================
      if (isSubscriptionCredit && agendamento_id) {
        console.log('📋 Registrando uso de crédito da assinatura no admin...')
        // O frontend já registrou subscription_usage e incrementou credits_used
        // Aqui garantimos que o subscription_usage tem o appointment_id correto
        const { error: usageUpdateError } = await supabase
          .from('subscription_usage')
          .update({ appointment_id: agendamento.id })
          .eq('appointment_id', agendamento.id)
        
        if (usageUpdateError) {
          console.warn('⚠️ Erro ao atualizar subscription_usage:', usageUpdateError)
        }
      }


      // SEMPRE atualizar sessão do totem para 'completed' (dispara realtime no admin)
      // Usar agendamento.id para garantir que todas as sessões vinculadas sejam atualizadas
      const { error: sessionUpdateError } = await supabase
        .from('appointment_totem_sessions')
        .update({ status: 'completed' })
        .eq('appointment_id', agendamento.id)
      
      if (sessionUpdateError) {
        console.warn('⚠️ Erro ao atualizar sessão do totem:', sessionUpdateError)
      } else {
        console.log('✅ Sessão do totem atualizada para completed')
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
