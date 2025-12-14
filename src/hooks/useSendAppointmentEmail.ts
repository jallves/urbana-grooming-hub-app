import { supabase } from '@/integrations/supabase/client';

interface AppointmentEmailData {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  staffName: string;
  appointmentDate: string; // formato yyyy-MM-dd
  appointmentTime: string; // formato HH:mm
}

/**
 * Hook para enviar e-mail de confirmação de agendamento
 * Usado por todos os fluxos: Totem, Painel Cliente e Painel Admin
 */
export const useSendAppointmentEmail = () => {
  
  const sendConfirmationEmail = async (data: AppointmentEmailData): Promise<boolean> => {
    try {
      // Validar se tem e-mail
      if (!data.clientEmail || !data.clientEmail.includes('@')) {
        console.log('📧 [Email] Cliente sem e-mail válido, pulando envio');
        return false;
      }

      console.log('📧 [Email] Enviando confirmação para:', data.clientEmail);

      const { error } = await supabase.functions.invoke('send-email-confirmation', {
        body: {
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          serviceName: data.serviceName,
          staffName: data.staffName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          servicePrice: data.servicePrice,
          serviceDuration: data.serviceDuration.toString()
        }
      });

      if (error) {
        console.error('❌ [Email] Erro ao enviar:', error);
        return false;
      }

      console.log('✅ [Email] Confirmação enviada com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ [Email] Erro inesperado:', error);
      return false;
    }
  };

  return { sendConfirmationEmail };
};

/**
 * Função utilitária para buscar dados completos e enviar e-mail
 * Pode ser usada diretamente após criar um agendamento
 * 
 * IMPORTANTE: Usa queries separadas para garantir robustez
 */
export const sendAppointmentConfirmationEmail = async (
  appointmentId: string
): Promise<boolean> => {
  console.log('📧 [Email] ========================================');
  console.log('📧 [Email] sendAppointmentConfirmationEmail INICIADO');
  console.log('📧 [Email] Appointment ID:', appointmentId);
  console.log('📧 [Email] ========================================');
  
  try {
    // STEP 1: Buscar dados básicos do agendamento
    console.log('📧 [Email] STEP 1: Buscando agendamento...');
    const { data: appointment, error: appointmentError } = await supabase
      .from('painel_agendamentos')
      .select('id, data, hora, cliente_id, servico_id, barbeiro_id')
      .eq('id', appointmentId)
      .single();

    if (appointmentError) {
      console.error('❌ [Email] Erro ao buscar agendamento:', appointmentError);
      return false;
    }

    if (!appointment) {
      console.error('❌ [Email] Agendamento não encontrado');
      return false;
    }

    console.log('📧 [Email] Agendamento encontrado:', {
      id: appointment.id,
      data: appointment.data,
      hora: appointment.hora,
      cliente_id: appointment.cliente_id,
      servico_id: appointment.servico_id,
      barbeiro_id: appointment.barbeiro_id
    });

    // STEP 2: Buscar dados do cliente
    console.log('📧 [Email] STEP 2: Buscando cliente...');
    const { data: cliente, error: clienteError } = await supabase
      .from('client_profiles')
      .select('id, nome, email')
      .eq('id', appointment.cliente_id)
      .single();

    if (clienteError) {
      console.error('❌ [Email] Erro ao buscar cliente:', clienteError);
      return false;
    }

    console.log('📧 [Email] Cliente encontrado:', {
      id: cliente?.id,
      nome: cliente?.nome,
      email: cliente?.email
    });

    // Validar e-mail antes de continuar
    if (!cliente?.email || !cliente.email.includes('@')) {
      console.log('📧 [Email] Cliente sem e-mail válido, pulando envio');
      console.log('📧 [Email] E-mail recebido:', cliente?.email);
      return false;
    }

    // STEP 3: Buscar dados do serviço
    console.log('📧 [Email] STEP 3: Buscando serviço...');
    const { data: servico, error: servicoError } = await supabase
      .from('painel_servicos')
      .select('id, nome, preco, duracao')
      .eq('id', appointment.servico_id)
      .single();

    if (servicoError) {
      console.error('❌ [Email] Erro ao buscar serviço:', servicoError);
      return false;
    }

    console.log('📧 [Email] Serviço encontrado:', {
      id: servico?.id,
      nome: servico?.nome,
      preco: servico?.preco,
      duracao: servico?.duracao
    });

    // STEP 4: Buscar dados do barbeiro
    console.log('📧 [Email] STEP 4: Buscando barbeiro...');
    const { data: barbeiro, error: barbeiroError } = await supabase
      .from('painel_barbeiros')
      .select('id, nome')
      .eq('id', appointment.barbeiro_id)
      .single();

    if (barbeiroError) {
      console.error('❌ [Email] Erro ao buscar barbeiro:', barbeiroError);
      return false;
    }

    console.log('📧 [Email] Barbeiro encontrado:', {
      id: barbeiro?.id,
      nome: barbeiro?.nome
    });

    // STEP 5: Preparar dados para o e-mail
    const emailPayload = {
      clientName: cliente.nome,
      clientEmail: cliente.email,
      serviceName: servico?.nome || 'Serviço',
      staffName: barbeiro?.nome || 'Barbeiro',
      appointmentDate: appointment.data,
      appointmentTime: appointment.hora,
      servicePrice: servico?.preco || 0,
      serviceDuration: (servico?.duracao || 30).toString()
    };

    console.log('📧 [Email] STEP 5: Payload do e-mail preparado:', emailPayload);

    // STEP 6: Invocar edge function
    console.log('📧 [Email] STEP 6: Invocando edge function send-email-confirmation...');
    
    const { data: responseData, error: invokeError } = await supabase.functions.invoke('send-email-confirmation', {
      body: emailPayload
    });

    if (invokeError) {
      console.error('❌ [Email] Erro ao invocar edge function:', invokeError);
      console.error('❌ [Email] Detalhes do erro:', JSON.stringify(invokeError, null, 2));
      return false;
    }

    console.log('✅ [Email] ========================================');
    console.log('✅ [Email] Resposta da edge function:', responseData);
    console.log('✅ [Email] E-MAIL ENVIADO COM SUCESSO!');
    console.log('✅ [Email] ========================================');
    return true;
  } catch (error) {
    console.error('❌ [Email] ========================================');
    console.error('❌ [Email] ERRO INESPERADO:', error);
    console.error('❌ [Email] Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('❌ [Email] ========================================');
    return false;
  }
};

/**
 * Função para enviar e-mail com dados já conhecidos (sem buscar no banco)
 * Útil quando já temos todos os dados disponíveis no contexto
 */
export const sendConfirmationEmailDirect = async (data: {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  staffName: string;
  appointmentDate: string;
  appointmentTime: string;
  servicePrice: number;
  serviceDuration: number;
}): Promise<boolean> => {
  console.log('📧 [Email Direct] ========================================');
  console.log('📧 [Email Direct] Enviando e-mail direto para:', data.clientEmail);
  
  try {
    // Validar e-mail
    if (!data.clientEmail || !data.clientEmail.includes('@')) {
      console.log('📧 [Email Direct] E-mail inválido, pulando envio');
      return false;
    }

    const { data: responseData, error } = await supabase.functions.invoke('send-email-confirmation', {
      body: {
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        serviceName: data.serviceName,
        staffName: data.staffName,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        servicePrice: data.servicePrice,
        serviceDuration: data.serviceDuration.toString()
      }
    });

    if (error) {
      console.error('❌ [Email Direct] Erro ao enviar:', error);
      return false;
    }

    console.log('✅ [Email Direct] Enviado com sucesso:', responseData);
    return true;
  } catch (error) {
    console.error('❌ [Email Direct] Erro inesperado:', error);
    return false;
  }
};
