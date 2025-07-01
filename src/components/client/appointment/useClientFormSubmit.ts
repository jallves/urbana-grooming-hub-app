
import { useState } from 'react';
import { ClientFormValues } from './useClientFormData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Service } from '@/types/appointment';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UseClientFormSubmitProps {
  onClose: () => void;
  clientId: string;
}

export const useClientFormSubmit = ({ onClose, clientId }: UseClientFormSubmitProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (data: ClientFormValues, selectedService: Service | null) => {
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
        client_id: clientId,
        service_id: data.service_id,
        staff_id: data.staff_id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        status: 'scheduled',
        notes: data.notes || null,
      };
      
      // Insert appointment
      const { error } = await supabase
        .from('appointments')
        .insert(appointmentData);
        
      if (error) throw error;
      
      toast({
        title: "✅ Agendamento Concluído!",
        description: `Seu agendamento de ${selectedService.name} foi marcado para ${format(startDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}. Agradecemos sua preferência!`,
        duration: 6000,
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
