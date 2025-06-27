
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Service } from '@/types/appointment';

interface FormData {
  service_id: string;
  staff_id: string;
  date: Date;
  time: string;
  notes?: string;
}

interface UseClientFormSubmitProps {
  clientId: string;
  onSuccess?: () => void;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  message?: string;
}

export const useClientFormSubmit = ({ clientId, onSuccess }: UseClientFormSubmitProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (data: FormData, selectedService: Service | null) => {
    if (!selectedService) {
      toast({
        title: "Erro",
        description: "Selecione um serviço válido.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('[useClientFormSubmit] Starting appointment creation...');

      // Create start and end times
      const [hours, minutes] = data.time.split(':').map(Number);
      const startTime = new Date(data.date);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration);

      console.log('[useClientFormSubmit] Validating appointment...', {
        clientId,
        staffId: data.staff_id,
        serviceId: data.service_id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

      // Validate booking using database function
      const { data: validationResult, error: validationError } = await supabase.rpc(
        'validate_appointment_booking',
        {
          p_client_id: clientId,
          p_staff_id: data.staff_id,
          p_service_id: data.service_id,
          p_start_time: startTime.toISOString(),
          p_end_time: endTime.toISOString()
        }
      );

      if (validationError) {
        throw new Error(`Validation error: ${validationError.message}`);
      }

      // Type assertion to handle the JSON response properly
      const validation = validationResult as ValidationResult;

      if (!validation.valid) {
        toast({
          title: "Agendamento inválido",
          description: validation.error || "Não foi possível validar o agendamento.",
          variant: "destructive",
        });
        return;
      }

      // Create appointment
      const appointmentData = {
        client_id: clientId,
        service_id: data.service_id,
        staff_id: data.staff_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        notes: data.notes || null,
      };

      console.log('[useClientFormSubmit] Creating appointment...', appointmentData);

      const { error: insertError } = await supabase
        .from('appointments')
        .insert([appointmentData]);

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Agendamento criado com sucesso!",
        description: "Seu agendamento foi confirmado.",
      });

      onSuccess?.();

    } catch (error: any) {
      console.error('[useClientFormSubmit] Error:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit, isLoading };
};
