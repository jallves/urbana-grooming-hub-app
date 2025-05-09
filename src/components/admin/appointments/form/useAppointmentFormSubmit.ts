
import { useState } from 'react';
import { FormValues } from './useAppointmentFormData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Service } from '@/types/appointment';

interface UseAppointmentFormSubmitProps {
  appointmentId?: string;
  onClose: () => void;
}

export const useAppointmentFormSubmit = ({ 
  appointmentId, 
  onClose 
}: UseAppointmentFormSubmitProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (data: FormValues, selectedService: Service | null) => {
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
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        status: 'scheduled', // Using 'scheduled' instead of 'agendado'
        notes: data.notes || null,
      };
      
      // Insert or update appointment
      if (appointmentId) {
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointmentId);
          
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Agendamento atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert(appointmentData);
          
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Agendamento criado com sucesso.",
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving appointment:', error);
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
