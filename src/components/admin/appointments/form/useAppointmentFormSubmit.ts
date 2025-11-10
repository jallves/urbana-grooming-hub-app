
import { useState } from 'react';
import { FormValues } from './useAppointmentFormData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Service } from '@/types/appointment';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointmentValidation } from '@/hooks/useAppointmentValidation';

interface UseAppointmentFormSubmitProps {
  appointmentId?: string;
  onClose: () => void;
}

export const useAppointmentFormSubmit = ({ 
  appointmentId, 
  onClose 
}: UseAppointmentFormSubmitProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { validateAppointment, extractDatabaseError } = useAppointmentValidation();
  
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
      
      // Corrigir lógica de data para evitar problemas de timezone
      const [hours, minutes] = data.time.split(':').map(Number);
      
      // Criar data local sem conversão de timezone
      const startDate = new Date(data.date);
      startDate.setHours(hours, minutes, 0, 0);
      
      // Calculate end time based on service duration
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + selectedService.duration);
      
      // Converter para formato ISO local
      const startTimeISO = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString();
      const endTimeISO = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString();
      
      const appointmentData = {
        client_id: data.client_id,
        service_id: data.service_id,
        staff_id: data.staff_id,
        start_time: startTimeISO,
        end_time: endTimeISO,
        status: 'scheduled',
        notes: data.notes || null,
        coupon_code: data.couponCode || null,
        discount_amount: data.discountAmount || 0,
      };
      
      // Log the data being saved for debugging
      console.log('Saving appointment with data:', appointmentData);
      console.log('Original date:', data.date, 'Original time:', data.time);
      console.log('Converted startDate:', startDate);
      console.log('Start time ISO:', startTimeISO);
      
      // Validar disponibilidade antes de salvar
      const validation = await validateAppointment(
        data.staff_id,
        data.date,
        data.time,
        selectedService.duration,
        appointmentId // Excluir o próprio agendamento se for edição
      );

      if (!validation.valid) {
        // Erro já foi mostrado pelo hook
        setIsLoading(false);
        return;
      }
      
      // Insert or update appointment
      if (appointmentId) {
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointmentId);
          
        if (error) {
          // Tratar erro do banco de dados
          const errorMessage = extractDatabaseError(error);
          toast({
            variant: "destructive",
            title: "Erro ao Atualizar",
            description: errorMessage,
          });
          setIsLoading(false);
          return;
        }
        
        toast({
          title: "✅ Agendamento Atualizado!",
          description: `Agendamento de ${selectedService.name} atualizado para ${format(startDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`,
          duration: 5000,
        });
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert(appointmentData);
          
        if (error) {
          // Tratar erro do banco de dados
          const errorMessage = extractDatabaseError(error);
          toast({
            variant: "destructive",
            title: "Erro ao Criar",
            description: errorMessage,
          });
          setIsLoading(false);
          return;
        }
        
        // Também inserir no painel_agendamentos para sincronização
        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('id', data.client_id)
          .single();

        const { data: staffData } = await supabase
          .from('painel_barbeiros')
          .select('id')
          .eq('staff_id', data.staff_id)
          .single();

        if (clientData && staffData) {
          const painelData = {
            cliente_id: data.client_id,
            barbeiro_id: staffData.id,
            servico_id: data.service_id,
            data: format(startDate, 'yyyy-MM-dd'),
            hora: format(startDate, 'HH:mm'),
            status: 'confirmado'
          };

          await supabase
            .from('painel_agendamentos')
            .insert(painelData);
        }
        
        toast({
          title: "🎉 Agendamento Criado!",
          description: `Novo agendamento de ${selectedService.name} criado para ${format(startDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`,
          duration: 5000,
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
