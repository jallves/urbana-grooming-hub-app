import { supabase } from '@/integrations/supabase/client';

interface AppointmentEmailData {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  staffName: string;
  appointmentDate: string;
  appointmentTime: string;
}

/**
 * Hook para enviar e-mail de confirmação de agendamento
 */
export const useSendAppointmentEmail = () => {
  
  const sendConfirmationEmail = async (data: AppointmentEmailData): Promise<boolean> => {
    try {
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
 * Usa painel_clientes em vez de client_profiles
 */
export const sendAppointmentConfirmationEmail = async (
  appointmentId: string
): Promise<boolean> => {
  console.log('📧 [Email] sendAppointmentConfirmationEmail INICIADO');
  console.log('📧 [Email] Appointment ID:', appointmentId);
  
  try {
    // STEP 1: Buscar dados básicos do agendamento
    const { data: appointment, error: appointmentError } = await supabase
      .from('painel_agendamentos')
      .select('id, data, hora, cliente_id, servico_id, barbeiro_id')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error('❌ [Email] Erro ao buscar agendamento:', appointmentError);
      return false;
    }

    // STEP 2: Buscar dados do cliente (usando painel_clientes)
    const { data: cliente, error: clienteError } = await supabase
      .from('painel_clientes')
      .select('id, nome, email')
      .eq('id', appointment.cliente_id)
      .single();

    if (clienteError) {
      console.error('❌ [Email] Erro ao buscar cliente:', clienteError);
      return false;
    }

    if (!cliente?.email || !cliente.email.includes('@')) {
      console.log('📧 [Email] Cliente sem e-mail válido, pulando envio');
      return false;
    }

    // STEP 3: Buscar dados do serviço
    const { data: servico, error: servicoError } = await supabase
      .from('painel_servicos')
      .select('id, nome, preco, duracao')
      .eq('id', appointment.servico_id)
      .single();

    if (servicoError) {
      console.error('❌ [Email] Erro ao buscar serviço:', servicoError);
      return false;
    }

    // STEP 4: Buscar dados do barbeiro
    const { data: barbeiro, error: barbeiroError } = await supabase
      .from('painel_barbeiros')
      .select('id, nome')
      .eq('id', appointment.barbeiro_id)
      .single();

    if (barbeiroError) {
      console.error('❌ [Email] Erro ao buscar barbeiro:', barbeiroError);
      return false;
    }

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

    console.log('📧 [Email] Payload do e-mail preparado:', emailPayload);

    // STEP 6: Invocar edge function
    const { data: responseData, error: invokeError } = await supabase.functions.invoke('send-email-confirmation', {
      body: emailPayload
    });

    if (invokeError) {
      console.error('❌ [Email] Erro ao invocar edge function:', invokeError);
      return false;
    }

    console.log('✅ [Email] E-MAIL ENVIADO COM SUCESSO!');
    return true;
  } catch (error) {
    console.error('❌ [Email] ERRO INESPERADO:', error);
    return false;
  }
};

/**
 * Função para enviar e-mail com dados já conhecidos
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
  console.log('📧 [Email Direct] Enviando e-mail direto para:', data.clientEmail);
  
  try {
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
