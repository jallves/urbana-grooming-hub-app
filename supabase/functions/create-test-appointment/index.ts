import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AppointmentResult {
  success: boolean;
  data?: {
    appointment: any;
    horario: string;
    cliente: string;
    servico: string;
    barbeiro: string;
  };
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📅 Criando agendamento de teste...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Buscar cliente criado
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('id, name')
      .eq('email', 'joao.silva@example.com')
      .single();

    if (clientError || !client) {
      throw new Error('Cliente de teste não encontrado');
    }
    console.log('✅ Cliente encontrado:', client.name);

    // Buscar serviço criado (usando painel_servicos mas preciso do ID da tabela services)
    const { data: service, error: serviceError } = await supabaseClient
      .from('painel_servicos')
      .select('id, nome, duracao, preco')
      .eq('nome', 'Corte Premium')
      .single();

    if (serviceError || !service) {
      throw new Error('Serviço de teste não encontrado');
    }
    console.log('✅ Serviço encontrado:', service.nome);

    // Buscar o serviço correspondente na tabela services através do mapeamento
    const { data: serviceMapping } = await supabaseClient
      .from('service_id_mapping')
      .select('services_id')
      .eq('painel_servicos_id', service.id)
      .single();

    const serviceIdForAppointment = serviceMapping?.services_id || service.id;

    // Buscar barbeiro criado
    const { data: barber, error: barberError } = await supabaseClient
      .from('staff')
      .select('id, name')
      .eq('email', 'carlos.barbosa@barbershop.com')
      .single();

    if (barberError || !barber) {
      throw new Error('Barbeiro de teste não encontrado');
    }
    console.log('✅ Barbeiro encontrado:', barber.name);

    // Criar horário para hoje às 14:00
    const today = new Date();
    const startTime = new Date(today);
    startTime.setHours(14, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + (service.duracao || 45));

    console.log('🕐 Horário do agendamento:', startTime.toISOString());

    // Criar agendamento
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .insert({
        client_id: client.id,
        service_id: serviceIdForAppointment,
        staff_id: barber.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        notes: 'Agendamento de teste criado automaticamente para validação de fluxo',
      })
      .select()
      .single();

    if (appointmentError) {
      console.error('❌ Erro ao criar agendamento:', appointmentError);
      throw new Error(`Erro ao criar agendamento: ${appointmentError.message}`);
    }

    console.log('✅ Agendamento criado com sucesso:', appointment.id);

    const result: AppointmentResult = {
      success: true,
      data: {
        appointment,
        horario: `${startTime.toLocaleDateString('pt-BR')} às ${startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        cliente: client.name,
        servico: service.nome,
        barbeiro: barber.name,
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('💥 Erro ao criar agendamento:', error);
    
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
