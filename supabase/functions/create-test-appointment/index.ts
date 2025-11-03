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

    const { cliente_id, barbeiro_id, servico_id, data, hora } = await req.json()

    console.log('📝 Criando agendamento teste:', { cliente_id, barbeiro_id, servico_id, data, hora })

    // Inserir agendamento usando service role (bypassa RLS)
    const { data: agendamento, error } = await supabase
      .from('painel_agendamentos')
      .insert({
        cliente_id,
        barbeiro_id,
        servico_id,
        data,
        hora,
        status: 'confirmado'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar agendamento:', error)
      throw error
    }

    console.log('✅ Agendamento criado com sucesso:', agendamento.id)

    return new Response(
      JSON.stringify({
        success: true,
        agendamento
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Erro na função:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
