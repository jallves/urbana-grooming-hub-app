import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
          paid_at: new Date().toISOString(),
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
        .select(`
          *,
          painel_produtos:ref_id (
            id,
            nome,
            preco
          )
        `)
        .eq('venda_id', venda_id)
        .eq('tipo', 'PRODUTO')

      if (itensError) {
        console.error('❌ Erro ao buscar itens da venda:', itensError)
        throw new Error('Erro ao buscar itens da venda')
      }

      // 4. Buscar método de pagamento
      const { data: payment, error: paymentFetchError } = await supabase
        .from('totem_payments')
        .select('payment_method')
        .eq('id', payment_id)
        .single()

      if (paymentFetchError) {
        console.error('❌ Erro ao buscar pagamento:', paymentFetchError)
        throw new Error('Erro ao buscar método de pagamento')
      }

      // 5. Preparar itens para a transação financeira
      const transactionItems = itens.map((item: any) => ({
        type: 'product',
        id: item.ref_id,
        name: item.painel_produtos?.nome || 'Produto',
        quantity: item.quantidade,
        price: item.preco_unitario,
        discount: item.desconto || 0
      }))

      console.log('💰 Criando transação financeira no ERP:', {
        items: transactionItems.length,
        payment_method: payment.payment_method
      })

      // 6. Chamar edge function para criar registros no ERP financeiro
      const { data: erpResult, error: erpError } = await supabase.functions.invoke(
        'create-financial-transaction',
        {
          body: {
            client_id: null, // Venda direta sem cliente
            barber_id: null, // Sem barbeiro
            items: transactionItems,
            payment_method: payment.payment_method,
            discount_amount: 0,
            notes: `Venda direta de produtos no totem - ID: ${venda_id}`,
            transaction_date: new Date().toISOString().split('T')[0],
            transaction_datetime: new Date().toISOString()
          }
        }
      )

      if (erpError) {
        console.error('❌ Erro ao criar transação no ERP:', erpError)
        // Não falhar a venda, apenas logar o erro para retry automático
      } else {
        console.log('✅ Transação financeira criada no ERP:', erpResult)
      }

      // 7. Atualizar estoque dos produtos
      if (itens) {
        for (const item of itens) {
          const { error: stockError } = await supabase.rpc('update_product_stock', {
            product_id: item.ref_id,
            quantity: -item.quantidade
          })
          
          if (stockError) {
            console.error('❌ Erro ao atualizar estoque:', stockError)
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
