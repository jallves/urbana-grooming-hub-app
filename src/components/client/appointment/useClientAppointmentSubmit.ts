
import { useState } from 'react';
import { ClientAppointmentFormValues } from './useClientAppointmentForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Service } from '@/types/appointment';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sendAppointmentConfirmationEmail } from '@/hooks/useSendAppointmentEmail';
import { sendAppointmentUpdateEmail } from '@/hooks/useSendAppointmentUpdateEmail';


interface UseClientAppointmentSubmitProps {
  appointmentId?: string;
  onClose: () => void;
  clientId: string;
}

export const useClientAppointmentSubmit = ({ 
  appointmentId, 
  onClose,
  clientId
}: UseClientAppointmentSubmitProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (data: ClientAppointmentFormValues, selectedService: Service | null) => {
    try {
      setIsLoading(true);
      
      if (!selectedService) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Selecione um serviço válido.",
        });
        return;
      }
      
      // Corrigir lógica de data para evitar problemas de timezone
      const [hours, minutes] = data.time.split(':').map(Number);
      
      // Criar data local sem conversão de timezone
      const startDate = new Date(data.date);
      startDate.setHours(hours, minutes, 0, 0);
      
      // Calculate end time based on service duration
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + selectedService.duration);
      
      console.log('Client appointment - Original date:', data.date, 'Original time:', data.time);
      console.log('Client appointment - Converted startDate:', startDate);
      
      // Inserir diretamente no painel_agendamentos com status confirmado
      const { data: staffData } = await supabase
        .from('painel_barbeiros')
        .select('id')
        .eq('staff_id', data.staff_id)
        .single();

      if (!staffData) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Barbeiro não encontrado.",
        });
        return;
      }

      // Garantir que a data seja formatada sem conversão de timezone
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      const dataLocal = `${year}-${month}-${day}`;

      const painelData = {
        cliente_id: clientId,
        barbeiro_id: staffData.id,
        servico_id: data.service_id,
        data: dataLocal,
        hora: format(startDate, 'HH:mm'),
        status: 'agendado'
      };
      
      console.log('Saving client appointment to painel_agendamentos:', painelData);
      
      // Insert or update appointment
      if (appointmentId) {
        // Buscar dados anteriores para o e-mail
        const { data: previousAppointment } = await supabase
          .from('painel_agendamentos')
          .select(`
            data,
            hora,
            painel_barbeiros(nome),
            painel_servicos(nome)
          `)
          .eq('id', appointmentId)
          .single();

        const { error } = await supabase
          .from('painel_agendamentos')
          .update(painelData)
          .eq('id', appointmentId)
          .eq('cliente_id', clientId); // Ensure client can only update own appointments
          
        if (error) throw error;

        // Enviar e-mail de atualização
        console.log('📧 [Cliente] Enviando e-mail de atualização...');
        try {
          await sendAppointmentUpdateEmail({
            appointmentId,
            previousData: {
              date: previousAppointment?.data,
              time: previousAppointment?.hora?.substring(0, 5),
              staffName: (previousAppointment as any)?.painel_barbeiros?.nome,
              serviceName: (previousAppointment as any)?.painel_servicos?.nome
            },
            updateType: 'reschedule',
            updatedBy: 'client'
          });
        } catch (emailError) {
          console.error('⚠️ Erro ao enviar e-mail de atualização:', emailError);
        }
        
        toast({
          title: "✅ Agendamento Atualizado!",
          description: `Seu agendamento de ${selectedService.name} foi atualizado para ${format(startDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`,
          duration: 5000,
        });
      } else {
        const { data: newAppointment, error } = await supabase
          .from('painel_agendamentos')
          .insert(painelData)
          .select()
          .single();
          
        if (error) throw error;
        
        // Enviar e-mail de confirmação
        if (newAppointment?.id) {
          console.log('📧 [Cliente] Enviando e-mail de confirmação...');
          try {
            await sendAppointmentConfirmationEmail(newAppointment.id);
          } catch (emailError) {
            console.error('⚠️ Erro ao enviar e-mail de confirmação:', emailError);
          }
        }
        
        toast({
          title: "✅ Agendamento Concluído!",
          description: `Seu agendamento de ${selectedService.name} foi marcado para ${format(startDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}. Agradecemos sua preferência!`,
          duration: 6000,
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving client appointment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar o agendamento.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return { handleSubmit, isLoading };
};
