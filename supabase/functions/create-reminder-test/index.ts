import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { clientId, barberId, serviceId, date, time } = body;
    
    console.log('📅 Criando agendamento de teste para lembrete...');
    console.log(`   Data: ${date}, Hora: ${time}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Desabilitar trigger temporariamente e inserir
    // Usar RPC para inserção direta
    const { data: appointment, error: appointmentError } = await supabaseClient
      .rpc('insert_test_appointment', {
        p_cliente_id: clientId,
        p_barbeiro_id: barberId,
        p_servico_id: serviceId,
        p_data: date,
        p_hora: time
      });

    if (appointmentError) {
      console.log('❌ RPC não existe, tentando insert direto...');
      
      // Fallback: tentar inserir diretamente (pode falhar se trigger bloquear)
      const { data: directInsert, error: directError } = await supabaseClient
        .from('painel_agendamentos')
        .insert({
          cliente_id: clientId,
          barbeiro_id: barberId,
          servico_id: serviceId,
          data: date,
          hora: time,
          status: 'agendado',
          status_totem: 'AGENDADO',
        })
        .select(`
          id,
          data,
          hora,
          status,
          cliente:client_profiles!painel_agendamentos_cliente_id_fkey(nome, email),
          barbeiro:painel_barbeiros!painel_agendamentos_barbeiro_id_fkey(nome),
          servico:painel_servicos!painel_agendamentos_servico_id_fkey(nome)
        `)
        .single();

      if (directError) {
        throw new Error(`Erro ao criar agendamento: ${directError.message}`);
      }

      console.log('✅ Agendamento criado com sucesso:', directInsert.id);
      
      return new Response(JSON.stringify({
        success: true,
        appointment: {
          id: directInsert.id,
          data: directInsert.data,
          hora: directInsert.hora,
          cliente: directInsert.cliente?.nome,
          email: directInsert.cliente?.email,
          barbeiro: directInsert.barbeiro?.nome,
          servico: directInsert.servico?.nome,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log('✅ Agendamento criado via RPC:', appointment);

    return new Response(JSON.stringify({
      success: true,
      appointment
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('💥 Erro:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});