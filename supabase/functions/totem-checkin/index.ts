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
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public'
      }
    })

    const { agendamento_id, qr_token, modo, table_source = 'painel' } = await req.json()

    console.log('🔍 Check-in iniciado - ID:', agendamento_id, 'Origem:', table_source)

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

    // 🔒 SUPORTE UNIFICADO: Buscar em ambas as tabelas
    let agendamento
    let agendError
    let barbeiro_id
    let cliente_id
    
    // Tentar buscar em painel_agendamentos primeiro
    const painelResult = await supabase
      .from('painel_agendamentos')
      .select(`
        *,
        cliente:painel_clientes(*),
        barbeiro:painel_barbeiros(*),
        servico:painel_servicos(*)
      `)
      .eq('id', agendamento_id)
      .maybeSingle()

    if (painelResult.data) {
      console.log('✅ Agendamento encontrado em painel_agendamentos')
      agendamento = painelResult.data
      barbeiro_id = agendamento.barbeiro_id
      cliente_id = agendamento.cliente_id
      
      // Atualizar status para CHEGOU usando RPC para bypass RLS
      try {
        // Tentativa 1: Update direto
        const { data: updateData, error: updateError } = await supabase
          .from('painel_agendamentos')
          .update({ status_totem: 'CHEGOU', status: 'confirmado' })
          .eq('id', agendamento_id)
          .select()
        
        if (updateError) {
          console.error('❌ Erro ao atualizar status_totem (tentativa 1):', updateError)
          
          // Tentativa 2: Usar rpc direto
          const { error: rpcError } = await supabase.rpc('update_agendamento_status_totem', {
            p_agendamento_id: agendamento_id,
            p_status_totem: 'CHEGOU',
            p_status: 'confirmado'
          })
          
          if (rpcError) {
            console.error('❌ Erro ao atualizar status via RPC:', rpcError)
          } else {
            console.log('✅ Status atualizado via RPC')
          }
        } else {
          console.log('✅ Status do agendamento atualizado para CHEGOU:', updateData)
        }
      } catch (updateErr) {
        console.error('❌ Exceção ao atualizar status:', updateErr)
      }
    } else {
      // Tentar em appointments (painel cliente)
      console.log('⚠️ Não encontrado em painel_agendamentos, buscando em appointments...')
      const appointmentsResult = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(*),
          staff:staff(*),
          service:services(*)
        `)
        .eq('id', agendamento_id)
        .maybeSingle()

      if (appointmentsResult.data) {
        console.log('✅ Agendamento encontrado em appointments')
        const apt = appointmentsResult.data
        
        // Normalizar estrutura
        agendamento = {
          id: apt.id,
          cliente_id: apt.client_id,
          barbeiro_id: apt.staff_id,
          servico_id: apt.service_id,
          data: apt.start_time?.split('T')[0],
          hora: apt.start_time?.split('T')[1]?.substring(0, 5),
          status: apt.status,
          cliente: {
            id: apt.client?.id,
            nome: apt.client?.name,
            whatsapp: apt.client?.phone
          },
          barbeiro: {
            id: apt.staff?.id,
            nome: apt.staff?.name
          },
          servico: {
            id: apt.service?.id,
            nome: apt.service?.name,
            preco: apt.service?.price,
            duracao: apt.service?.duration
          }
        }
        
        barbeiro_id = apt.staff_id
        cliente_id = apt.client_id
        
        // Atualizar status
        await supabase
          .from('appointments')
          .update({ status: 'confirmed' })
          .eq('id', agendamento_id)
      } else {
        agendError = appointmentsResult.error
      }
    }

    if (!agendamento) {
      return new Response(
        JSON.stringify({ error: 'Agendamento não encontrado em nenhuma tabela' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Verificar se já existe sessão ativa
    const { data: existingSession } = await supabase
      .from('totem_sessions')
      .select('*')
      .eq('appointment_id', agendamento_id)
      .in('status', ['check_in', 'in_service', 'checkout'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let session = existingSession

    // Se não existe sessão ativa, criar nova
    if (!existingSession) {
      const { data: newSession, error: sessionError } = await supabase
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
        throw new Error('Erro ao criar sessão do totem')
      }

      session = newSession
      console.log('Nova sessão criada:', session.id)
    } else {
      console.log('Sessão existente encontrada:', session.id)
    }

    // Publicar evento realtime
    const channel = supabase.channel(`barbearia:${barbeiro_id}`)
    await channel.send({
      type: 'broadcast',
      event: 'CHECKIN',
      payload: {
        tipo: 'CHECKIN',
        agendamento_id: agendamento.id,
        cliente_id: cliente_id,
        barbeiro_id: barbeiro_id,
        cliente_nome: agendamento.cliente?.nome,
        horario: agendamento.hora,
        timestamp: new Date().toISOString()
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        session_id: session?.id,
        session: session, // Incluir objeto session completo
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
