
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConfirmationData {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceName: string;
  staffName: string;
  appointmentDate: Date;
  servicePrice: string;
  serviceDuration: number;
  preferredMethod: 'email' | 'whatsapp';
}

export const useAppointmentConfirmation = () => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const sendConfirmation = async (data: ConfirmationData) => {
    setIsSending(true);
    
    try {
      const formattedDate = format(data.appointmentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const formattedTime = format(data.appointmentDate, "HH:mm", { locale: ptBR });

      const confirmationData = {
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone || '',
        serviceName: data.serviceName,
        staffName: data.staffName,
        appointmentDate: formattedDate,
        appointmentTime: formattedTime,
        servicePrice: data.servicePrice,
        serviceDuration: data.serviceDuration.toString(),
      };

      if (data.preferredMethod === 'whatsapp' && data.clientPhone) {
        // Tentar enviar via WhatsApp
        const { data: whatsappResult, error: whatsappError } = await supabase.functions.invoke(
          'send-whatsapp-confirmation',
          { body: confirmationData }
        );

        if (whatsappError) {
          console.error('WhatsApp error:', whatsappError);
          // Fallback para email
          await sendEmailConfirmation(confirmationData);
          toast({
            title: "Confirmação enviada por email",
            description: "Não foi possível enviar via WhatsApp, mas enviamos por email.",
          });
        } else {
          // Abrir WhatsApp em nova aba
          window.open(whatsappResult.whatsappUrl, '_blank');
          toast({
            title: "Agendamento confirmado!",
            description: "O WhatsApp foi aberto para envio da confirmação.",
          });
        }
      } else {
        // Enviar por email
        await sendEmailConfirmation(confirmationData);
        toast({
          title: "Agendamento confirmado!",
          description: "Confirmação enviada por email com sucesso.",
        });
      }
    } catch (error) {
      console.error('Confirmation error:', error);
      toast({
        title: "Erro ao enviar confirmação",
        description: "O agendamento foi criado, mas não foi possível enviar a confirmação.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const sendEmailConfirmation = async (data: any) => {
    const { error } = await supabase.functions.invoke(
      'send-email-confirmation',
      { body: data }
    );

    if (error) {
      throw error;
    }
  };

  return {
    sendConfirmation,
    isSending,
  };
};
