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
 */
export const sendAppointmentConfirmationEmail = async (
  appointmentId: string
): Promise<boolean> => {
  console.log('📧 [Email] sendAppointmentConfirmationEmail INICIADO para ID:', appointmentId);
  
  try {
    // Buscar dados completos do agendamento
    console.log('📧 [Email] Buscando dados do agendamento...');
    const { data: appointment, error: appointmentError } = await supabase
      .from('painel_agendamentos')
      .select(`
        id,
        data,
        hora,
        cliente:client_profiles!painel_agendamentos_cliente_id_fkey(id, nome, email),
        servico:painel_servicos!painel_agendamentos_servico_id_fkey(id, nome, preco, duracao),
        barbeiro:painel_barbeiros!painel_agendamentos_barbeiro_id_fkey(id, nome)
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error('❌ [Email] Erro ao buscar agendamento:', appointmentError);
      return false;
    }

    console.log('📧 [Email] Dados do agendamento encontrados:', {
      id: appointment.id,
      data: appointment.data,
      hora: appointment.hora
    });

    const cliente = appointment.cliente as any;
    const servico = appointment.servico as any;
    const barbeiro = appointment.barbeiro as any;

    console.log('📧 [Email] Cliente:', cliente?.nome, '- Email:', cliente?.email);
    console.log('📧 [Email] Serviço:', servico?.nome);
    console.log('📧 [Email] Barbeiro:', barbeiro?.nome);

    // Validar se tem e-mail
    if (!cliente?.email || !cliente.email.includes('@')) {
      console.log('📧 [Email] Cliente sem e-mail válido, pulando envio');
      return false;
    }

    console.log('📧 [Email] Invocando edge function send-email-confirmation...');
    
    const { data: responseData, error } = await supabase.functions.invoke('send-email-confirmation', {
      body: {
        clientName: cliente.nome,
        clientEmail: cliente.email,
        serviceName: servico.nome,
        staffName: barbeiro.nome,
        appointmentDate: appointment.data,
        appointmentTime: appointment.hora,
        servicePrice: servico.preco,
        serviceDuration: servico.duracao.toString()
      }
    });

    if (error) {
      console.error('❌ [Email] Erro ao invocar edge function:', error);
      return false;
    }

    console.log('✅ [Email] Resposta da edge function:', responseData);
    console.log('✅ [Email] Confirmação enviada com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ [Email] Erro inesperado:', error);
    return false;
  }
};
