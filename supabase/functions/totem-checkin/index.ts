import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const QR_SECRET = Deno.env.get('QR_SECRET') || 'your-secret-key-change-this'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { agendamento_id, qr_token, modo } = await req.json()

    // Validar QR se fornecido
    if (modo === 'QRCODE' && qr_token) {
      const { data: isValid } = await supabase.rpc('validate_qr_checkin', {
        p_qr_token: qr_token,
        p_secret: QR_SECRET
      })

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'QR Code inválido ou expirado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Buscar agendamento
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
      return new Response(
        JSON.stringify({ error: 'Agendamento não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Atualizar status para CHEGOU
    const { error: updateError } = await supabase
      .from('painel_agendamentos')
      .update({ status_totem: 'CHEGOU' })
      .eq('id', agendamento_id)

    if (updateError) {
      throw updateError
    }

    // Criar sessão do totem
    const { data: session, error: sessionError } = await supabase
      .from('totem_sessions')
      .insert({
        appointment_id: agendamento_id,
        status: 'check_in',
        check_in_time: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Erro ao criar sessão:', sessionError)
      // Não falha o check-in se a sessão não for criada
    }

    // Publicar evento realtime
    const channel = supabase.channel(`barbearia:${agendamento.barbeiro_id}`)
    await channel.send({
      type: 'broadcast',
      event: 'CHECKIN',
      payload: {
        tipo: 'CHECKIN',
        agendamento_id: agendamento.id,
        cliente_id: agendamento.cliente_id,
        barbeiro_id: agendamento.barbeiro_id,
        cliente_nome: agendamento.cliente?.nome,
        horario: agendamento.hora,
        timestamp: new Date().toISOString()
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        session_id: session?.id,
        agendamento: {
          id: agendamento.id,
          cliente: agendamento.cliente?.nome,
          barbeiro: agendamento.barbeiro?.nome,
          servico: agendamento.servico?.nome,
          horario: agendamento.hora,
          status: 'CHEGOU'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro no check-in:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
