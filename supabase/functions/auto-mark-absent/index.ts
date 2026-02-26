import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Edge Function: auto-mark-absent
 * 
 * Executada via pg_cron a cada 15 minutos.
 * Marca como "ausente" agendamentos que passaram 3 horas do horário
 * agendado sem que o cliente tenha feito check-in (status_totem != 'CHEGOU').
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: 'public' }
    })

    // Calcular o horário limite: agora - 3 horas em Brasília (UTC-3)
    // Agendamentos com data+hora anterior a este limite devem ser marcados como ausente
    const now = new Date()
    // Converter para horário de Brasília
    const brasiliaOffset = -3 * 60 // -3 horas em minutos
    const brasiliaTime = new Date(now.getTime() + (brasiliaOffset + now.getTimezoneOffset()) * 60000)
    const threeHoursAgo = new Date(brasiliaTime.getTime() - 3 * 60 * 60 * 1000)
    
    const today = brasiliaTime.toISOString().split('T')[0]
    const yesterday = new Date(brasiliaTime.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const cutoffTime = `${threeHoursAgo.getHours().toString().padStart(2, '0')}:${threeHoursAgo.getMinutes().toString().padStart(2, '0')}:00`

    console.log('🔍 [auto-mark-absent] Verificando agendamentos...')
    console.log(`   Brasília agora: ${brasiliaTime.toISOString()}`)
    console.log(`   Cutoff (3h atrás): ${threeHoursAgo.toISOString()}`)
    console.log(`   Hoje: ${today}, Ontem: ${yesterday}, Hora corte: ${cutoffTime}`)

    // Buscar agendamentos de hoje e ontem que estão como 'agendado' ou 'confirmado'
    // e que NÃO fizeram check-in (status_totem é null ou diferente de 'CHEGOU')
    const { data: staleAppointments, error: fetchError } = await supabase
      .from('painel_agendamentos')
      .select('id, data, hora, status, status_totem, cliente_id, barbeiro_id')
      .in('data', [today, yesterday])
      .in('status', ['agendado', 'confirmado'])
      .or('status_totem.is.null,status_totem.neq.CHEGOU')

    if (fetchError) {
      console.error('❌ Erro ao buscar agendamentos:', fetchError)
      throw fetchError
    }

    if (!staleAppointments || staleAppointments.length === 0) {
      console.log('✅ Nenhum agendamento para marcar como ausente.')
      return new Response(
        JSON.stringify({ success: true, marked: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filtrar: só marcar se data+hora do agendamento é anterior a 3h atrás
    const toMark = staleAppointments.filter(apt => {
      const [y, m, d] = apt.data.split('-').map(Number)
      const [h, min] = apt.hora.split(':').map(Number)
      const aptTime = new Date(y, m - 1, d, h, min)
      const diffMs = brasiliaTime.getTime() - aptTime.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      return diffHours >= 3
    })

    if (toMark.length === 0) {
      console.log('✅ Nenhum agendamento ultrapassou o limite de 3 horas.')
      return new Response(
        JSON.stringify({ success: true, marked: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`⚠️ Marcando ${toMark.length} agendamento(s) como ausente...`)

    const ids = toMark.map(a => a.id)
    const { error: updateError } = await supabase
      .from('painel_agendamentos')
      .update({ status: 'ausente' })
      .in('id', ids)

    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError)
      throw updateError
    }

    console.log(`✅ ${toMark.length} agendamento(s) marcado(s) como ausente.`)
    toMark.forEach(a => {
      console.log(`   - ID: ${a.id} | Data: ${a.data} ${a.hora}`)
    })

    return new Response(
      JSON.stringify({ success: true, marked: toMark.length, ids }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Erro no auto-mark-absent:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
