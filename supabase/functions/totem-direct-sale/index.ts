import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getBrazilDateTime, toBrazilISOString } from '../_shared/brazilDateTime.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, venda_id, payment_id, payment_method, transaction_data, subscription_plan_id, client_id, barber_id } = await req.json()

    // ========================================================================
    // ACTION: START - Criar registro de pagamento pendente
    // ========================================================================
    if (action === 'start') {
      console.log('🚀 [PRODUCT-SALE] Iniciando venda de produtos:', venda_id)
      console.log('💳 [PRODUCT-SALE] Método de pagamento:', payment_method)

      // Verificar se já existe um totem_payments para esta venda (idempotência)
      const { data: existingPayment, error: checkError } = await supabase
        .from('totem_payments')
        .select('id')
        .eq('venda_id', venda_id)
        .maybeSingle()

      if (checkError) {
        console.error('❌ Erro ao verificar pagamento existente:', checkError)
      }

      if (existingPayment) {
        console.log('⚠️ [PRODUCT-SALE] Pagamento já existe, retornando ID existente:', existingPayment.id)
        return new Response(
          JSON.stringify({ 
            success: true,
            payment_id: existingPayment.id,
            message: 'Pagamento já iniciado'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      // Buscar valor total da venda
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .select('valor_total')
        .eq('id', venda_id)
        .single()

      if (vendaError || !venda) {
        console.error('❌ Erro ao buscar venda:', vendaError)
        throw new Error('Venda não encontrada')
      }

      // Criar registro de pagamento pendente
      const { data: paymentData, error: paymentError } = await supabase
        .from('totem_payments')
        .insert({
          venda_id: venda_id,
          amount: venda.valor_total,
          payment_method: payment_method,
          status: 'pending'
        })
        .select('id')
        .single()

      if (paymentError) {
        console.error('❌ Erro ao criar pagamento:', paymentError)
        throw new Error('Erro ao criar registro de pagamento')
      }

      console.log('✅ [PRODUCT-SALE] Pagamento pendente criado:', paymentData.id)

      return new Response(
        JSON.stringify({ 
          success: true,
          payment_id: paymentData.id,
          message: 'Pagamento iniciado com sucesso'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // ========================================================================
    // ACTION: FINISH - Finalizar venda após aprovação do PayGo
    // ========================================================================
    if (action === 'finish') {
      console.log('🎯 [PRODUCT-SALE] Finalizando venda de produtos:', venda_id)
      console.log('💳 [PRODUCT-SALE] Payment ID:', payment_id)
      console.log('📊 [PRODUCT-SALE] Transaction Data:', transaction_data)

      // Se payment_id não foi fornecido, criar o registro de pagamento agora
      // Isso permite que o frontend chame finish diretamente sem precisar de start
      let resolvedPaymentId = payment_id

      if (!resolvedPaymentId && venda_id) {
        // Verificar se já existe um pagamento para esta venda
        const { data: existingPayment } = await supabase
          .from('totem_payments')
          .select('id')
          .eq('venda_id', venda_id)
          .maybeSingle()

        if (existingPayment) {
          resolvedPaymentId = existingPayment.id
          console.log('📋 [PRODUCT-SALE] Pagamento existente encontrado:', resolvedPaymentId)
        } else {
          // Buscar valor da venda para criar o registro
          const { data: vendaForPayment } = await supabase
            .from('vendas')
            .select('valor_total')
            .eq('id', venda_id)
            .single()

          if (vendaForPayment) {
            const { data: newPayment } = await supabase
              .from('totem_payments')
              .insert({
                venda_id: venda_id,
                amount: vendaForPayment.valor_total,
                payment_method: payment_method || 'credit_card',
                status: 'completed',
                transaction_id: transaction_data?.nsu || null
              })
              .select('id')
              .single()

            resolvedPaymentId = newPayment?.id
            console.log('✅ [PRODUCT-SALE] Pagamento criado no finish:', resolvedPaymentId)
          }
        }
      }

      // 1. Atualizar pagamento para completed (se existir)
      if (resolvedPaymentId) {
        const updateData: any = { 
          status: 'completed',
          updated_at: toBrazilISOString()
        }
        
        if (transaction_data?.nsu) {
          updateData.transaction_id = transaction_data.nsu
        }

        const { error: paymentError } = await supabase
          .from('totem_payments')
          .update(updateData)
          .eq('id', resolvedPaymentId)

        if (paymentError) {
          console.error('❌ Erro ao atualizar pagamento:', paymentError)
        } else {
          console.log('✅ [PRODUCT-SALE] Pagamento atualizado para completed')
        }
      }

      // 2. Atualizar venda para PAGA
      const { error: vendaError } = await supabase
        .from('vendas')
        .update({ 
          status: 'PAGA',
          forma_pagamento: payment_method || 'CARTAO',
          updated_at: toBrazilISOString()
        })
        .eq('id', venda_id)

      if (vendaError) {
        console.error('❌ Erro ao atualizar venda:', vendaError)
        // Não falhar - continuar
      } else {
        console.log('✅ [PRODUCT-SALE] Venda atualizada para PAGA')
      }

      // 3. Buscar itens da venda (produtos)
      const { data: itens, error: itensError } = await supabase
        .from('vendas_itens')
        .select('*')
        .eq('venda_id', venda_id)
        .eq('tipo', 'PRODUTO')

      if (itensError) {
        console.error('❌ Erro ao buscar itens da venda:', itensError)
        // Não falhar
      }

      console.log('📦 [PRODUCT-SALE] Itens encontrados:', itens?.length || 0)

      // 4. Buscar informações da venda
      const { data: venda, error: vendaFetchError } = await supabase
        .from('vendas')
        .select('barbeiro_id, cliente_id')
        .eq('id', venda_id)
        .single()

      if (vendaFetchError) {
        console.error('❌ Erro ao buscar venda:', vendaFetchError)
      }

      console.log('📋 [PRODUCT-SALE] Venda:', venda)

      // 5. Preparar itens para o ERP
      const transactionItems = (itens || []).map((item: any) => ({
        type: 'product',
        id: item.item_id,
        name: item.nome,
        quantity: item.quantidade,
        price: item.preco_unitario,
        discount: 0
      }))

      // 6. Chamar create-financial-transaction para ERP + Comissões
      if (transactionItems.length > 0 && venda) {
        const brazilTime = getBrazilDateTime()
        console.log('📅 [PRODUCT-SALE] Horário Brasil:', brazilTime)

        try {
          const { data: erpResult, error: erpError } = await supabase.functions.invoke(
            'create-financial-transaction',
            {
              body: {
                client_id: venda.cliente_id,
                barber_id: venda.barbeiro_id,
                reference_id: venda_id,
                reference_type: 'totem_product_sale',
                items: transactionItems,
                payment_method: payment_method,
                discount_amount: 0,
                notes: `Venda de Produtos - Totem - ID: ${venda_id}`,
                transaction_id: transaction_data?.nsu || null,
                transaction_date: brazilTime.date,
                transaction_datetime: brazilTime.datetime
              }
            }
          )

          if (erpError) {
            console.error('❌ [PRODUCT-SALE] Erro ERP:', erpError)
          } else {
            console.log('✅ [PRODUCT-SALE] ERP integrado:', erpResult)
          }
        } catch (erpException) {
          console.error('❌ [PRODUCT-SALE] Exceção ERP:', erpException)
        }
      }

      // 7. Atualizar estoque dos produtos
      if (itens && itens.length > 0) {
        console.log('📦 [PRODUCT-SALE] Atualizando estoque de', itens.length, 'produtos')
        
        for (const item of itens) {
          const productId = item.item_id
          const quantity = item.quantidade
          
          console.log('📦 [PRODUCT-SALE] Decrementando estoque:', productId, 'x', quantity)
          
          try {
            const { error: stockError } = await supabase.rpc('decrease_product_stock', {
              p_product_id: productId,
              p_quantity: quantity
            })
            
            if (stockError) {
              console.error('❌ Erro ao atualizar estoque:', productId, stockError)
            } else {
              console.log('✅ Estoque atualizado:', productId)
            }
          } catch (stockException) {
            console.error('❌ Exceção ao atualizar estoque:', productId, stockException)
          }
        }
      }

      // 8. Se for venda de assinatura, criar/ativar a subscription
      if (venda) {
        const { data: vendaItensCheck } = await supabase
          .from('vendas_itens')
          .select('*')
          .eq('venda_id', venda_id)
          .eq('tipo', 'ASSINATURA')
          .maybeSingle()

        if (vendaItensCheck) {
          const planId = vendaItensCheck.item_id
          console.log('👑 [PRODUCT-SALE] Ativando assinatura para plano:', planId)

          // Verificar se já existe assinatura ativa
          const { data: existingSub } = await supabase
            .from('client_subscriptions')
            .select('id')
            .eq('client_id', venda.cliente_id)
            .eq('plan_id', planId)
            .eq('status', 'active')
            .maybeSingle()

          if (existingSub) {
            // Renovar: resetar créditos
            await supabase
              .from('client_subscriptions')
              .update({
                credits_used: 0,
                next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                updated_at: toBrazilISOString()
              })
              .eq('id', existingSub.id)
            console.log('✅ [PRODUCT-SALE] Assinatura renovada:', existingSub.id)
          } else {
            // Criar nova assinatura
            const nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            await supabase
              .from('client_subscriptions')
              .insert({
                client_id: venda.cliente_id,
                plan_id: planId,
                status: 'active',
                credits_total: 4,
                credits_used: 0,
                start_date: new Date().toISOString().split('T')[0],
                next_billing_date: nextBilling,
                payment_method: payment_method || 'credit_card',
                notes: `Ativado via Totem - Venda ${venda_id}`
              })
            console.log('✅ [PRODUCT-SALE] Nova assinatura criada')
          }

          // Gerar comissão do barbeiro sobre o valor do plano
          if (venda.barbeiro_id) {
            const { data: barberData } = await supabase
              .from('painel_barbeiros')
              .select('nome, commission_rate, taxa_comissao')
              .eq('id', venda.barbeiro_id)
              .single()

            if (barberData) {
              const commRate = (barberData.commission_rate || barberData.taxa_comissao || 50) / 100
              const commValue = vendaItensCheck.subtotal * commRate
              console.log('💰 [PRODUCT-SALE] Comissão assinatura:', commValue, 'Taxa:', commRate * 100, '%')

              await supabase.from('barber_commissions').insert({
                barber_id: venda.barbeiro_id,
                barber_name: barberData.nome,
                valor: commValue,
                amount: commValue,
                commission_rate: commRate * 100,
                tipo: 'assinatura',
                status: 'pending',
                venda_id: venda_id,
                appointment_source: 'totem_subscription'
              })

              // Contas a pagar para o barbeiro
              await supabase.from('contas_pagar').insert({
                descricao: `Comissão Assinatura - ${barberData.nome}`,
                valor: commValue,
                data_vencimento: new Date().toISOString().split('T')[0],
                status: 'pendente',
                categoria: 'Comissão',
                fornecedor: barberData.nome,
                observacoes: `Comissão de assinatura - Venda ${venda_id}`
              })

              console.log('✅ [PRODUCT-SALE] Comissão e contas_pagar criados')
            }
          }
        }
      }

      console.log('✅ [PRODUCT-SALE] Venda finalizada com sucesso!')

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Venda finalizada com sucesso'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida. Use start ou finish.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error: any) {
    console.error('❌ Erro na função:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
