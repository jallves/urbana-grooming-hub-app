import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Edge Function: fix-cash-payment-method
 * Corrige registros financeiros que usam 'cash' como método de pagamento
 * Atualiza para 'pix' (assumindo que foi o método real usado)
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    console.log('🔍 Buscando registros com payment_method = cash...')

    // 1. Buscar payment_records com 'cash'
    const { data: cashPayments, error: paymentsError } = await supabase
      .from('payment_records')
      .select('id, payment_number, financial_record_id, amount')
      .eq('payment_method', 'cash')

    if (paymentsError) {
      console.error('❌ Erro ao buscar payment_records:', paymentsError)
      throw paymentsError
    }

    console.log(`📦 Encontrados ${cashPayments?.length || 0} registros com cash`)

    if (!cashPayments || cashPayments.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum registro com cash encontrado',
          updated: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    const results = []
    let updated = 0
    let failed = 0

    // 2. Atualizar cada registro para 'pix'
    for (const payment of cashPayments) {
      try {
        console.log(`🔄 Atualizando payment ${payment.id} para pix...`)

        const { error: updateError } = await supabase
          .from('payment_records')
          .update({ 
            payment_method: 'pix',
            metadata: {
              ...payment.metadata,
              original_method: 'cash',
              fixed_at: new Date().toISOString(),
              fixed_reason: 'Sistema não aceita pagamento em dinheiro - assumido como PIX'
            }
          })
          .eq('id', payment.id)

        if (updateError) {
          console.error(`❌ Erro ao atualizar payment ${payment.id}:`, updateError)
          failed++
          results.push({
            id: payment.id,
            status: 'failed',
            error: updateError.message
          })
          continue
        }

        // 3. Também atualizar metadata do financial_record correspondente
        if (payment.financial_record_id) {
          const { data: record } = await supabase
            .from('financial_records')
            .select('metadata')
            .eq('id', payment.financial_record_id)
            .single()

          if (record) {
            const updatedMetadata = {
              ...(record.metadata || {}),
              payment_method: 'pix',
              original_payment_method: 'cash',
              fixed_at: new Date().toISOString()
            }

            await supabase
              .from('financial_records')
              .update({ metadata: updatedMetadata })
              .eq('id', payment.financial_record_id)
          }
        }

        console.log(`✅ Payment ${payment.id} atualizado com sucesso`)
        updated++
        results.push({
          id: payment.id,
          payment_number: payment.payment_number,
          status: 'updated',
          old_method: 'cash',
          new_method: 'pix'
        })

      } catch (error: any) {
        console.error(`❌ Erro ao processar payment ${payment.id}:`, error)
        failed++
        results.push({
          id: payment.id,
          status: 'failed',
          error: error.message
        })
      }
    }

    const summary = {
      total_found: cashPayments.length,
      updated,
      failed,
      details: results
    }

    console.log('📊 Resumo da correção:', summary)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Correção concluída',
        summary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('❌ Erro na correção:', error)
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
