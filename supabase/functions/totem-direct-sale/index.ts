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

      // 3. Buscar venda para criar transação financeira
      const { data: venda, error: vendaFetchError } = await supabase
        .from('vendas')
        .select('*')
        .eq('id', venda_id)
        .single()

      if (vendaFetchError) throw vendaFetchError

      // 4. Criar transação financeira de receita
      const { error: transactionError } = await supabase
        .from('finance_transactions')
        .insert({
          tipo: 'receita',
          categoria: 'produto',
          descricao: 'Venda direta de produtos no totem',
          valor: venda.total,
          data: new Date().toISOString().split('T')[0],
          status: 'pago',
          agendamento_id: null // Venda direta
        })

      if (transactionError) {
        console.error('❌ Erro ao criar transação:', transactionError)
        // Não falhar a venda por causa disso, apenas logar
      }

      // 5. Atualizar estoque dos produtos
      const { data: itens, error: itensError } = await supabase
        .from('vendas_itens')
        .select('*')
        .eq('venda_id', venda_id)
        .eq('tipo', 'PRODUTO')

      if (!itensError && itens) {
        for (const item of itens) {
          await supabase
            .from('painel_produtos')
            .update({ 
              estoque: supabase.rpc('decrement_estoque', { 
                product_id: item.ref_id, 
                quantity: item.quantidade 
              })
            })
            .eq('id', item.ref_id)
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
