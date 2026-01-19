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

    const { action, venda_id, payment_id } = await req.json()

    if (action === 'finish') {
      console.log('🎯 Finalizando venda direta de produtos:', venda_id)

      // 1. Atualizar pagamento
      const { error: paymentError } = await supabase
        .from('totem_payments')
        .update({ 
          paid_at: toBrazilISOString(),
          status: 'completed'
        })
        .eq('id', payment_id)

      if (paymentError) {
        console.error('❌ Erro ao atualizar pagamento:', paymentError)
        throw new Error('Erro ao atualizar pagamento')
      }

      // 2. Atualizar venda para PAGA
      const { error: vendaError } = await supabase
        .from('vendas')
        .update({ status: 'PAGA' })
        .eq('id', venda_id)

      if (vendaError) {
        console.error('❌ Erro ao atualizar venda:', vendaError)
        throw new Error('Erro ao atualizar venda')
      }

      // 3. Buscar itens da venda (produtos)
      const { data: itens, error: itensError } = await supabase
        .from('vendas_itens')
        .select('*')
        .eq('venda_id', venda_id)
        .eq('tipo', 'PRODUTO')

      if (itensError) {
        console.error('❌ Erro ao buscar itens da venda:', itensError)
        throw new Error('Erro ao buscar itens da venda')
      }

      console.log('📦 Itens da venda encontrados:', itens?.length || 0)

      // 4. Buscar informações da venda para pegar barbeiro_id
      const { data: venda, error: vendaFetchError } = await supabase
        .from('vendas')
        .select('barbeiro_id, cliente_id')
        .eq('id', venda_id)
        .single()

      if (vendaFetchError) {
        console.error('❌ Erro ao buscar venda:', vendaFetchError)
        throw new Error('Erro ao buscar venda')
      }

      console.log('📋 Venda:', {
        barbeiro_id: venda.barbeiro_id,
        cliente_id: venda.cliente_id
      })

      // 5. Buscar método de pagamento
      const { data: payment, error: paymentFetchError } = await supabase
        .from('totem_payments')
        .select('payment_method')
        .eq('id', payment_id)
        .single()

      if (paymentFetchError) {
        console.error('❌ Erro ao buscar pagamento:', paymentFetchError)
        throw new Error('Erro ao buscar método de pagamento')
      }

      // 6. Preparar itens para a transação financeira
      const transactionItems = itens.map((item: any) => ({
        type: 'product',
        id: item.item_id, // Campo correto: item_id (não ref_id)
        name: item.nome, // Usar nome já salvo em vendas_itens
        quantity: item.quantidade,
        price: item.preco_unitario, // Campo correto: preco_unitario (não preco_unit)
        discount: 0
      }))

      console.log('💰 Criando transação financeira no ERP:', {
        items: transactionItems.length,
        payment_method: payment.payment_method,
        barber_id: venda.barbeiro_id
      })

      // 7. Chamar edge function para criar registros no ERP financeiro (com comissões se houver barbeiro)
      // Usar horário do Brasil para a transação
      const brazilTime = getBrazilDateTime();
      console.log('📅 Usando horário do Brasil:', brazilTime);
      
       const { data: erpResult, error: erpError } = await supabase.functions.invoke(
         'create-financial-transaction',
         {
           body: {
             client_id: venda.cliente_id,
             barber_id: venda.barbeiro_id, // painel_barbeiros.id
             reference_id: venda_id,
             reference_type: 'totem_venda_direta',
             items: transactionItems,
             payment_method: payment.payment_method,
             discount_amount: 0,
             notes: venda.barbeiro_id 
               ? `Venda direta de produtos no totem - ID: ${venda_id} - Com barbeiro`
               : `Venda direta de produtos no totem - ID: ${venda_id}`,
             transaction_date: brazilTime.date,
             transaction_datetime: brazilTime.datetime
           }
         }
       )

      if (erpError) {
        console.error('❌ Erro ao criar transação no ERP:', erpError)
        // Não falhar a venda, apenas logar o erro para retry automático
      } else {
        console.log('✅ Transação financeira criada no ERP:', erpResult)
      }

      // 8. Atualizar estoque dos produtos
      if (itens && itens.length > 0) {
        console.log('📦 Atualizando estoque de', itens.length, 'produtos')
        
        for (const item of itens) {
          console.log('📦 Diminuindo estoque do produto:', item.ref_id, 'Quantidade:', item.quantidade)
          
          const { error: stockError } = await supabase.rpc('decrease_product_stock', {
            p_product_id: item.ref_id,
            p_quantity: item.quantidade
          })
          
          if (stockError) {
            console.error('❌ Erro ao atualizar estoque:', stockError)
            // Continua mesmo com erro de estoque
          } else {
            console.log('✅ Estoque atualizado para produto:', item.ref_id)
          }
        }
      }

      console.log('✅ Venda direta finalizada com sucesso')

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Venda finalizada com sucesso'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )

  } catch (error: any) {
    console.error('❌ Erro na função:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
