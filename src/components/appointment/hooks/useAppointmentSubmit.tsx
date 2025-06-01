
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Service } from '@/types/appointment';
import { FormData } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UseFormReturn } from 'react-hook-form';

export const useAppointmentSubmit = (
  clientId: string,
  selectedService: Service | null,
  appliedCoupon: { code: string; discountAmount: number } | null,
  form: UseFormReturn<FormData>,
  setSelectedService: (service: Service | null) => void,
  removeCoupon: () => void
) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormData) => {
    if (!selectedService) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um serviço.",
        variant: "destructive",
      });
      return;
    }

    if (!data.date || !data.time) {
      toast({
        title: "Erro", 
        description: "Por favor, selecione uma data e horário.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const [hours, minutes] = data.time.split(':').map(Number);
      const selectedDate = new Date(data.date);
      selectedDate.setHours(hours, minutes, 0, 0);

      const appointmentData = {
        client_id: clientId,
        service_id: data.service_id,
        staff_id: data.staff_id || null,
        start_time: selectedDate.toISOString(),
        end_time: new Date(selectedDate.getTime() + selectedService.duration * 60000).toISOString(),
        notes: data.notes || null,
        coupon_code: data.couponCode || null,
        discount_amount: appliedCoupon ? appliedCoupon.discountAmount : 0,
        status: 'scheduled',
      };

      console.log('Creating appointment with data:', appointmentData);

      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData]);

      if (error) {
        console.error("Erro ao criar agendamento:", error);
        throw new Error(error.message || "Não foi possível criar o agendamento.");
      }

      // Show success message
      toast({
        title: "🎉 Agendamento Confirmado!",
        description: `Seu agendamento de ${selectedService.name} foi confirmado com sucesso para ${format(new Date(data.date), "dd/MM/yyyy", { locale: ptBR })} às ${data.time}.`,
        duration: 6000,
      });

      // Reset form after successful submission
      form.reset({
        service_id: '',
        date: undefined,
        time: '',
        staff_id: '',
        notes: '',
        couponCode: '',
        discountAmount: 0,
      });

      // Clear selected service and applied coupon
      setSelectedService(null);
      removeCoupon();

    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro ao agendar",
        description: error.message || "Não foi possível criar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    isSending: loading,
    onSubmit,
  };
};
