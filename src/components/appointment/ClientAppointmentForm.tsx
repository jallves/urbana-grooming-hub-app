import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useBarberData } from './hooks/useBarberData';
import { ServiceSelectionField } from './components/ServiceSelectionField';
import { DateTimeSelectionFields } from './components/DateTimeSelectionFields';
import { BarberSelectionField } from './components/BarberSelectionField';
import { AppointmentSummary } from './components/AppointmentSummary';
import { CouponField } from './components/CouponField';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ClientAppointmentForm({ clientId }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { barbers, loading: barbersLoading } = useBarberData();

  // ... outros estados e hooks

  const onSubmit = async (data: any) => {
    // ... validações
    
    try {
      // Converter para UTC
      const [hours, minutes] = data.time.split(':').map(Number);
      const utcDate = new Date(data.date);
      utcDate.setUTCHours(hours, minutes, 0, 0);
      
      // Criar objeto de agendamento
      const appointmentData = {
        client_id: clientId,
        service_id: data.service_id,
        staff_id: data.staff_id || null,
        start_time: utcDate.toISOString(),
        end_time: new Date(utcDate.getTime() + selectedService.duration * 60000).toISOString(),
        notes: data.notes || null,
        status: 'scheduled',
      };

      // Inserir no banco de dados
      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData]);

      if (error) throw error;
      
      // Feedback de sucesso
      toast({
        title: "Agendamento Confirmado!",
        description: `Seu agendamento foi confirmado.`,
      });

      navigate('/cliente/dashboard');
    } catch (error: any) {
      toast({
        title: "Erro ao agendar",
        description: error.message || "Erro ao salvar o agendamento",
        variant: "destructive",
      });
    }
  };

  if (barbersLoading) {
    return <div>Carregando barbeiros...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Seção de Seleção de Barbeiro */}
          <section>
            <BarberSelectionField
              control={form.control}
              barbers={barbers}
              barberAvailability={barberAvailability}
              isCheckingAvailability={isCheckingAvailability}
              getFieldValue={form.getValues}
              checkBarberAvailability={checkBarberAvailability}
            />
          </section>

          {/* ... outras seções */}
        </form>
      </Form>
    </div>
  );
}