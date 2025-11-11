import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

/**
 * Edge Function: monitor-failed-transactions
 * Monitora e reprocessa automaticamente transações financeiras que falharam
 * - Executa a cada hora via cron
 * - Identifica agendamentos sem registros financeiros
 * - Tenta reprocessar automaticamente
 * - Envia notificações de falhas críticas
 */

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🔍 Iniciando monitoramento de transações falhadas...')

    // 1. Buscar agendamentos sem registros financeiros
    const { data: failedAppointments, error: queryError } = await supabase
      .from('vw_agendamentos_sem_financeiro')
      .select('*')
      .order('agendamento_data', { ascending: false })

    if (queryError) {
      throw new Error(`Erro ao buscar agendamentos: ${queryError.message}`)
    }

    console.log(`📊 Encontrados ${failedAppointments?.length || 0} agendamentos sem registros financeiros`)

    const results = {
      total_found: failedAppointments?.length || 0,
      reprocessed: 0,
      failed: 0,
      details: [] as any[]
    }

    // 2. Processar cada agendamento
    for (const appointment of failedAppointments || []) {
      console.log(`🔄 Processando agendamento ${appointment.agendamento_id}...`)

      try {
        // Chamar função de reprocessamento
        const { data: reprocessData, error: reprocessError } = await supabase
          .rpc('reprocess_failed_appointment', {
            p_agendamento_id: appointment.agendamento_id
          })

        if (reprocessError) {
          throw reprocessError
        }

        if (!reprocessData.success) {
          throw new Error(reprocessData.error || 'Erro desconhecido ao reprocessar')
        }

        // Chamar edge function create-financial-transaction
        const { data: transactionResult, error: transactionError } = await supabase.functions.invoke(
          'create-financial-transaction',
          {
            body: reprocessData.data
          }
        )

        if (transactionError) {
          throw transactionError
        }

        if (transactionResult?.success) {
          results.reprocessed++
          results.details.push({
            appointment_id: appointment.agendamento_id,
            status: 'success',
            message: 'Reprocessado com sucesso'
          })
          console.log(`✅ Agendamento ${appointment.agendamento_id} reprocessado com sucesso`)
        } else {
          throw new Error(transactionResult?.error || 'Falha ao criar transação')
        }

      } catch (error: any) {
        results.failed++
        results.details.push({
          appointment_id: appointment.agendamento_id,
          status: 'failed',
          error: error.message
        })
        console.error(`❌ Falha ao reprocessar ${appointment.agendamento_id}:`, error.message)

        // Incrementar contador de retry no log de erro
        const { data: errorLogs } = await supabase
          .from('integration_error_logs')
          .select('id')
          .eq('appointment_id', appointment.agendamento_id)
          .eq('status', 'pending')
          .limit(1)
          .single()

        if (errorLogs) {
          await supabase.rpc('increment_retry_count', { p_error_log_id: errorLogs.id })
        }
      }
    }

    // 3. Buscar erros que atingiram max_retries para notificação
    const { data: criticalErrors } = await supabase
      .from('integration_error_logs')
      .select('*')
      .eq('status', 'failed')
      .gte('retry_count', 3)
      .is('resolved_at', null)

    if (criticalErrors && criticalErrors.length > 0) {
      console.log(`⚠️ ${criticalErrors.length} erros críticos encontrados (máximo de tentativas atingido)`)
      results.details.push({
        critical_errors: criticalErrors.length,
        message: 'Erros que requerem atenção manual'
      })
    }

    console.log('✅ Monitoramento concluído:', results)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Monitoramento de transações concluído',
        data: results
      }),
      { 
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('❌ Erro no monitoramento:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido no monitoramento',
        details: error
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
