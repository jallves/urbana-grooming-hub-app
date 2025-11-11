import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Edge Function: migrate-old-product-sales
 * Migra vendas de produtos antigas que não foram registradas no ERP financeiro
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    console.log('🔍 Buscando vendas de produtos sem registros no ERP...')

    // Buscar vendas de produtos que estão PAGA mas não têm agendamento (vendas diretas)
    const { data: vendas, error: vendasError } = await supabase
      .from('vendas')
      .select('id, cliente_id, total, updated_at')
      .is('agendamento_id', null)
      .is('barbeiro_id', null)
      .eq('status', 'PAGA')
      .order('updated_at', { ascending: false })

    if (vendasError) {
      console.error('❌ Erro ao buscar vendas:', vendasError)
      throw vendasError
    }

    console.log(`📦 Encontradas ${vendas?.length || 0} vendas de produtos`)

    const results = []
    let migrated = 0
    let skipped = 0
    let failed = 0

    for (const venda of vendas || []) {
      try {
        // Verificar se já tem registros no ERP
        const { data: existingRecords, error: checkError } = await supabase
          .from('financial_records')
          .select('id')
          .eq('category', 'products')
          .eq('metadata->>venda_id', venda.id)
          .limit(1)

        if (checkError) {
          console.error(`⚠️ Erro ao verificar venda ${venda.id}:`, checkError)
          continue
        }

        if (existingRecords && existingRecords.length > 0) {
          console.log(`⏭️ Venda ${venda.id} já tem registros no ERP - pulando`)
          skipped++
          continue
        }

        console.log(`🔄 Migrando venda ${venda.id}...`)

        // Buscar itens da venda (sem relacionamento, vamos buscar produtos separadamente)
        const { data: itens, error: itensError } = await supabase
          .from('vendas_itens')
          .select('*')
          .eq('venda_id', venda.id)
          .eq('tipo', 'PRODUTO')

        if (itensError || !itens || itens.length === 0) {
          console.error(`❌ Erro ao buscar itens da venda ${venda.id}:`, itensError)
          failed++
          continue
        }

        // Buscar pagamento (se existir)
        const { data: payments } = await supabase
          .from('totem_payments')
          .select('payment_method')
          .eq('amount', venda.total)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)

        const paymentMethod = payments?.[0]?.payment_method || 'cash'

        // Buscar informações dos produtos para cada item
        const productIds = itens.map((item: any) => item.ref_id)
        const { data: produtos } = await supabase
          .from('painel_produtos')
          .select('id, nome')
          .in('id', productIds)

        const productMap = new Map(produtos?.map(p => [p.id, p.nome]) || [])

        const transactionItems = itens.map((item: any) => ({
          type: 'product',
          id: item.ref_id,
          name: productMap.get(item.ref_id) || item.nome || 'Produto',
          quantity: item.quantidade,
          price: item.preco_unit,
          discount: 0
        }))

        console.log(`💰 Criando registros no ERP para venda ${venda.id}`)

        // Chamar edge function para criar registros no ERP
        const { data: erpResult, error: erpError } = await supabase.functions.invoke(
          'create-financial-transaction',
          {
            body: {
              client_id: venda.cliente_id,
              barber_id: null,
              items: transactionItems,
              payment_method: paymentMethod,
              discount_amount: 0,
              notes: `Migração de venda direta de produtos - Venda ID: ${venda.id}`,
              transaction_date: venda.updated_at.split('T')[0],
              transaction_datetime: venda.updated_at
            }
          }
        )

        if (erpError) {
          console.error(`❌ Erro ao criar registros no ERP para venda ${venda.id}:`, erpError)
          failed++
          results.push({
            venda_id: venda.id,
            status: 'failed',
            error: erpError.message
          })
          continue
        }

        console.log(`✅ Venda ${venda.id} migrada com sucesso`)
        migrated++
        results.push({
          venda_id: venda.id,
          status: 'migrated',
          total: venda.total
        })

      } catch (error: any) {
        console.error(`❌ Erro ao processar venda ${venda.id}:`, error)
        failed++
        results.push({
          venda_id: venda.id,
          status: 'failed',
          error: error.message
        })
      }
    }

    const summary = {
      total_found: vendas?.length || 0,
      migrated,
      skipped,
      failed,
      details: results
    }

    console.log('📊 Resumo da migração:', summary)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Migração concluída',
        summary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('❌ Erro na migração:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
