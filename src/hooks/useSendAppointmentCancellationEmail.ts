import { supabase } from '@/integrations/supabase/client';

export interface AppointmentCancellationEmailData {
  appointmentId: string;
  cancelledBy: 'client' | 'admin' | 'barber';
  cancellationReason?: string;
}

/**
 * Envia e-mail de cancelamento de agendamento
 * Busca os dados do agendamento do banco e envia o e-mail
 */
export const sendAppointmentCancellationEmail = async (
  data: AppointmentCancellationEmailData
): Promise<boolean> => {
  console.log('📧 [CancellationEmail] ========================================');
  console.log('📧 [CancellationEmail] sendAppointmentCancellationEmail INICIADO');
  console.log('📧 [CancellationEmail] Appointment ID:', data.appointmentId);
  console.log('📧 [CancellationEmail] Cancelado por:', data.cancelledBy);
  console.log('📧 [CancellationEmail] ========================================');

  try {
    // Buscar dados do agendamento
    const { data: appointment, error: appointmentError } = await supabase
      .from('painel_agendamentos')
      .select(`
        id,
        data,
        hora,
        cliente_id,
        barbeiro_id,
        servico_id,
        painel_clientes!inner(nome, email),
        painel_barbeiros!inner(nome),
        painel_servicos!inner(nome, preco, duracao)
      `)
      .eq('id', data.appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error('❌ [CancellationEmail] Erro ao buscar agendamento:', appointmentError);
      return false;
    }

    const clientEmail = (appointment as any).painel_clientes?.email;
    
    if (!clientEmail) {
      console.log('⚠️ [CancellationEmail] Cliente sem e-mail, pulando envio');
      return false;
    }

    // Normalizar hora (remover segundos)
    const hora = appointment.hora?.substring(0, 5) || appointment.hora;

    const emailPayload = {
      clientName: (appointment as any).painel_clientes?.nome,
      clientEmail: clientEmail,
      serviceName: (appointment as any).painel_servicos?.nome,
      staffName: (appointment as any).painel_barbeiros?.nome,
      appointmentDate: appointment.data,
      appointmentTime: hora,
      servicePrice: (appointment as any).painel_servicos?.preco,
      cancelledBy: data.cancelledBy,
      cancellationReason: data.cancellationReason
    };

    console.log('📧 [CancellationEmail] Payload:', JSON.stringify(emailPayload, null, 2));

    const { data: responseData, error: invokeError } = await supabase.functions.invoke('send-appointment-cancellation-email', {
      body: emailPayload
    });

    if (invokeError) {
      console.error('❌ [CancellationEmail] Erro ao invocar edge function:', invokeError);
      return false;
    }

    console.log('✅ [CancellationEmail] E-mail de cancelamento enviado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ [CancellationEmail] Erro geral:', error);
    return false;
  }
};

/**
 * Versão direta que recebe todos os dados já prontos
 */
export const sendAppointmentCancellationEmailDirect = async (params: {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  staffName: string;
  appointmentDate: string;
  appointmentTime: string;
  servicePrice: number;
  cancelledBy: 'client' | 'admin' | 'barber';
  cancellationReason?: string;
}): Promise<boolean> => {
  console.log('📧 [CancellationEmailDirect] Enviando e-mail...');

  if (!params.clientEmail) {
    console.log('⚠️ [CancellationEmailDirect] Sem e-mail, pulando envio');
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-appointment-cancellation-email', {
      body: params
    });

    if (error) {
      console.error('❌ [CancellationEmailDirect] Erro:', error);
      return false;
    }

    console.log('✅ [CancellationEmailDirect] E-mail enviado!');
    return true;
  } catch (error) {
    console.error('❌ [CancellationEmailDirect] Erro geral:', error);
    return false;
  }
};
