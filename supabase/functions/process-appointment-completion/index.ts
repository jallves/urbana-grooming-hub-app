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

    const { agendamento_id, source, completed_by } = await req.json()

    console.log('🎯 Finalizando agendamento:', agendamento_id, 'Fonte:', source)

    // 1. Buscar agendamento completo
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

    console.log('✅ Agendamento encontrado:', {
      id: agendamento.id,
      cliente: agendamento.cliente?.nome,
      barbeiro: agendamento.barbeiro?.nome,
      servico: agendamento.servico?.nome,
      preco: agendamento.servico?.preco
    })

    // 2. Buscar staff_id do barbeiro
    const { data: barbeiro } = await supabase
      .from('painel_barbeiros')
      .select('staff_id')
      .eq('id', agendamento.barbeiro_id)
      .single()

    if (!barbeiro?.staff_id) {
      throw new Error('Barbeiro não encontrado no sistema')
    }

    const staff_id = barbeiro.staff_id
    console.log('👤 Staff ID do barbeiro:', staff_id)

    // 3. Buscar taxa de comissão do staff
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('commission_rate')
      .eq('id', staff_id)
      .single()

    if (staffError) {
      console.error('❌ Erro ao buscar staff:', staffError)
      throw new Error('Erro ao buscar dados do barbeiro')
    }

    const commission_rate = staff?.commission_rate || 50
    const service_price = agendamento.servico?.preco || 0
    const commission_amount = service_price * (commission_rate / 100)

    console.log('💰 Cálculo de comissão:', {
      service_price,
      commission_rate,
      commission_amount
    })

    // 4. Buscar serviços extras (se houver)
    const { data: extras } = await supabase
      .from('appointment_extra_services')
      .select(`
        service_id,
        painel_servicos!inner (
          id,
          nome,
          preco
        )
      `)
      .eq('appointment_id', agendamento_id)

    let total_extras = 0
    if (extras && extras.length > 0) {
      total_extras = extras.reduce((sum: number, extra: any) => 
        sum + (extra.painel_servicos?.preco || 0), 0
      )
      console.log('📦 Serviços extras:', extras.length, 'Total extras:', total_extras)
    }

    const total_amount = service_price + total_extras
    const total_commission = total_amount * (commission_rate / 100)

    console.log('💵 Total final:', {
      servico_principal: service_price,
      extras: total_extras,
      total: total_amount,
      comissao_total: total_commission
    })

    // 5. Atualizar status do agendamento para CONCLUÍDO (trigger automático cria financeiro)
    const { error: updateError } = await supabase
      .from('painel_agendamentos')
      .update({ 
        status: 'concluido', // Status correto para trigger de financeiro
        status_totem: 'FINALIZADO',
        updated_at: new Date().toISOString()
      })
      .eq('id', agendamento_id)

    if (updateError) {
      console.error('❌ Erro ao atualizar agendamento:', updateError)
      throw new Error('Erro ao atualizar status do agendamento')
    }

    console.log('✅ Status atualizado para CONCLUÍDO (trigger criará registros financeiros)')

    // 6-7. Trigger automático já cria comissões e transações financeiras
    // quando status é atualizado para 'concluido' - comissão fixa de 40%
    console.log('✅ Trigger automático criará registros financeiros com comissão de 40%')

    // 9. Notificar barbeiro via Realtime
    const channel = supabase.channel(`barbearia:${agendamento.barbeiro_id}`)
    await channel.send({
      type: 'broadcast',
      event: 'APPOINTMENT_COMPLETED',
      payload: {
        tipo: 'FINALIZADO',
        agendamento_id: agendamento_id,
        cliente_nome: agendamento.cliente?.nome,
        servico_nome: agendamento.servico?.nome,
        total: total_amount,
        comissao: total_commission,
        timestamp: new Date().toISOString()
      }
    })

    console.log('✅ Notificação enviada ao barbeiro')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Agendamento finalizado com sucesso',
        data: {
          agendamento_id,
          total_amount,
          commission_amount: total_commission,
          status: 'FINALIZADO'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro ao processar finalização:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
