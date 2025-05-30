import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/service';
import { Staff } from '@/types/staff';

interface AppointmentFormData {
  name: string;
  phone: string;
  email?: string;
  serviceId: string;
  staffId: string;
  date: Date;
  time: string;
  notes?: string;
}

import { sanitizeInput } from '@/lib/security';

export const useClientAppointmentForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchAvailableTimes = async (date: Date, serviceId: string, staffId: string) => {
    try {
      const day = date.toISOString().split('T')[0];
      const { data, error } = await supabase.rpc('get_available_times', {
        selected_date: day,
        selected_service_id: serviceId,
        selected_staff_id: staffId,
      });

      if (error) {
        throw error;
      }

      if (data) {
        setAvailableTimes(data);
      } else {
        setAvailableTimes([]);
      }
    } catch (error: any) {
      console.error('Error fetching available times:', error);
      toast({
        title: 'Erro ao buscar horários',
        description: 'Não foi possível carregar os horários disponíveis. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Form data being submitted:', data);
      
      // Sanitize all text inputs
      const sanitizedData = {
        ...data,
        name: sanitizeInput(data.name),
        phone: sanitizeInput(data.phone),
        email: data.email ? sanitizeInput(data.email) : undefined,
        notes: data.notes ? sanitizeInput(data.notes) : undefined,
      };
      
      if (!sanitizedData.serviceId || !sanitizedData.staffId || !sanitizedData.date || !sanitizedData.time) {
        throw new Error('Por favor, preencha todos os campos obrigatórios');
      }

      const startTime = new Date(sanitizedData.date);
      const [hours, minutes] = sanitizedData.time.split(':').map(Number);
      startTime.setHours(hours, minutes, 0, 0);

      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', sanitizedData.serviceId)
        .single();

      if (serviceError) {
        console.error('Error fetching service:', serviceError);
        throw new Error('Erro ao buscar serviço. Tente novamente.');
      }

      const service = serviceData as Service;
      const endTime = new Date(startTime.getTime() + service.duration * 60000);

      // Check if client exists, if not create
      const { data: clientData, error: clientError } = await supabase.rpc('create_public_client', {
        client_name: sanitizedData.name,
        client_phone: sanitizedData.phone,
        client_email: sanitizedData.email || null
      });

      if (clientError) {
        console.error('Error creating client:', clientError);
        throw new Error('Erro ao criar cliente. Tente novamente.');
      }

      const clientId = clientData as string;

      // Create the appointment with sanitized data
      const appointmentData = {
        client_id: clientId,
        service_id: sanitizedData.serviceId,
        staff_id: sanitizedData.staffId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        notes: sanitizedData.notes || null
      };

      const { data: appointmentResult, error: appointmentError } = await supabase.rpc('create_public_appointment', {
        p_client_id: clientId,
        p_service_id: sanitizedData.serviceId,
        p_staff_id: sanitizedData.staffId,
        p_start_time: startTime.toISOString(),
        p_end_time: endTime.toISOString(),
        p_notes: sanitizedData.notes || null
      });

      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError);
        throw new Error('Erro ao agendar. Tente novamente.');
      }

      toast({
        title: 'Agendamento realizado com sucesso!',
        description: 'Seu agendamento foi realizado com sucesso.',
      });
    } catch (error: any) {
      console.error('Error submitting appointment:', error);
      setError(error.message || 'Erro ao agendar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    onSubmit,
    availableTimes,
    fetchAvailableTimes,
  };
};
