import { supabase } from '@/integrations/supabase/client';

export interface AppointmentUpdateEmailData {
  appointmentId: string;
  previousData?: {
    date?: string;
    time?: string;
    staffName?: string;
    serviceName?: string;
  };
  updateType: 'reschedule' | 'change_barber' | 'change_service' | 'general';
  updatedBy: 'client' | 'admin' | 'barber';
}

/**
 * Envia e-mail de atualização de agendamento
 * Busca os dados atualizados do banco e envia o e-mail
 */
export const sendAppointmentUpdateEmail = async (
  data: AppointmentUpdateEmailData
): Promise<boolean> => {
  console.log('📧 [UpdateEmail] ========================================');
  console.log('📧 [UpdateEmail] sendAppointmentUpdateEmail INICIADO');
  console.log('📧 [UpdateEmail] Appointment ID:', data.appointmentId);
  console.log('📧 [UpdateEmail] Tipo:', data.updateType, 'Por:', data.updatedBy);
  console.log('📧 [UpdateEmail] ========================================');

  try {
    // Buscar dados atualizados do agendamento
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
      console.error('❌ [UpdateEmail] Erro ao buscar agendamento:', appointmentError);
      return false;
    }

    const clientEmail = (appointment as any).painel_clientes?.email;
    
    if (!clientEmail) {
      console.log('⚠️ [UpdateEmail] Cliente sem e-mail, pulando envio');
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
      serviceDuration: String((appointment as any).painel_servicos?.duracao || 30),
      previousDate: data.previousData?.date,
      previousTime: data.previousData?.time,
      previousStaffName: data.previousData?.staffName,
      previousServiceName: data.previousData?.serviceName,
      updateType: data.updateType,
      updatedBy: data.updatedBy
    };

    console.log('📧 [UpdateEmail] Payload:', JSON.stringify(emailPayload, null, 2));

    const { data: responseData, error: invokeError } = await supabase.functions.invoke('send-appointment-update-email', {
      body: emailPayload
    });

    if (invokeError) {
      console.error('❌ [UpdateEmail] Erro ao invocar edge function:', invokeError);
      return false;
    }

    console.log('✅ [UpdateEmail] E-mail de atualização enviado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ [UpdateEmail] Erro geral:', error);
    return false;
  }
};

/**
 * Versão direta que recebe todos os dados já prontos
 */
export const sendAppointmentUpdateEmailDirect = async (params: {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  staffName: string;
  appointmentDate: string;
  appointmentTime: string;
  servicePrice: number;
  serviceDuration: string;
  previousDate?: string;
  previousTime?: string;
  previousStaffName?: string;
  previousServiceName?: string;
  updateType: 'reschedule' | 'change_barber' | 'change_service' | 'general';
  updatedBy: 'client' | 'admin' | 'barber';
}): Promise<boolean> => {
  console.log('📧 [UpdateEmailDirect] Enviando para:', params.clientEmail);

  if (!params.clientEmail) {
    console.log('⚠️ [UpdateEmailDirect] Sem e-mail, pulando envio');
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-appointment-update-email', {
      body: params
    });

    if (error) {
      console.error('❌ [UpdateEmailDirect] Erro:', error);
      return false;
    }

    console.log('✅ [UpdateEmailDirect] E-mail enviado!');
    return true;
  } catch (error) {
    console.error('❌ [UpdateEmailDirect] Erro geral:', error);
    return false;
  }
};
