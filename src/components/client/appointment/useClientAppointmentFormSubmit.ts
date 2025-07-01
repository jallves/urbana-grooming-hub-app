import { useState } from 'react';
import { ClientFormValues } from './useClientAppointmentFormData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Service } from '@/types/appointment';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UseClientAppointmentFormSubmitProps {
  onClose: () => void;
}

export const useClientAppointmentFormSubmit = ({ 
  onClose 
}: UseClientAppointmentFormSubmitProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (data: ClientFormValues & { client_id: string }, selectedService: Service | null) => {
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
      
      // Format the date and time
      const [hours, minutes] = data.time.split(':').map(Number);
      const startDate = new Date(data.date);
      startDate.setHours(hours, minutes, 0, 0);
      
      // Calculate end time based on service duration
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + selectedService.duration);
      
      const appointmentData = {
        client_id: data.client_id,
        service_id: data.service_id,
        staff_id: data.staff_id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        status: 'scheduled',
        notes: data.notes || null,
      };
      
      // Log the data being saved for debugging
      console.log('Saving client appointment with data:', appointmentData);
      
      // Insert appointment
      const { error } = await supabase
        .from('appointments')
        .insert(appointmentData);
        
      if (error) throw error;
      
      toast({
        title: "🎉 Agendamento Criado!",
        description: `Seu agendamento de ${selectedService.name} foi marcado para ${format(startDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`,
        duration: 5000,
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving client appointment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o agendamento.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return { handleSubmit, isLoading };
};