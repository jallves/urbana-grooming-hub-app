import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useClientAppointmentForm } from './hooks/useClientAppointmentForm';
import { ServiceSelectionField } from './components/ServiceSelectionField';
import { DateTimeSelectionFields } from './components/DateTimeSelectionFields';
import { BarberSelectionField } from './components/BarberSelectionField';
import { BarberDebugInfo } from './components/BarberDebugInfo';
import { AppointmentSummary } from './components/AppointmentSummary';
import { CouponField } from './components/CouponField';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Scissors, User } from 'lucide-react';

interface InitialAppointmentData {
  serviceId: string;
  staffId: string;
  date: Date;
  notes: string;
}

interface ClientAppointmentFormProps {
  clientId: string;
  initialData?: InitialAppointmentData;
  appointmentId?: string;
}

import { ClientAppointmentHeader } from './components/ClientAppointmentHeader';
import { FormCard } from './components/FormCard';
import { AppointmentActionButtons } from './components/AppointmentActionButtons';
import { AppointmentNotesField } from './components/AppointmentNotesField';
import { 
  ClientAppointmentServiceSection,
  ClientAppointmentDateTimeSection,
  ClientAppointmentBarberSection,
  ClientAppointmentCouponSection,
  ClientAppointmentNotesSection,
  ClientAppointmentSummarySection
} from './components';

export default function ClientAppointmentForm({ clientId, initialData, appointmentId }: ClientAppointmentFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    form,
    loading,
    services,
    barbers,
    selectedService,
    setSelectedService,
    availableTimes,
    barberAvailability,
    isCheckingAvailability,
    isSending,
    disabledDays,
    appliedCoupon,
    isApplyingCoupon,
    applyCoupon,
    removeCoupon,
    fetchAvailableTimes,
    checkBarberAvailability,
  } = useClientAppointmentForm(clientId, initialData);

  // Fix: mappedBarbers guarantees all required string, non-optional fields for downstream compatibility
  const mappedBarbers = barbers.map(barber => ({
    ...barber,
    id: barber.id.toString(),
    commission_rate: barber.commission_rate ?? 0,
    created_at: barber.created_at ?? '',
    email: barber.email ?? '',
    experience: barber.experience ?? '',
    image_url: barber.image_url ?? '',
    is_active: barber.is_active ?? true,
    name: barber.name ?? '',
    phone: barber.phone ?? '',
    role: barber.role ?? '',
    specialties: barber.specialties ?? '',
    updated_at: barber.updated_at ?? '',
    uuid_id: barber.uuid_id ?? '',
    barber_id: undefined,  // Ignore if not expected by downstream type
  }));

  // Calculate final price correctly
  const finalPrice = selectedService 
    ? appliedCoupon 
      ? selectedService.price - appliedCoupon.discountAmount
      : selectedService.price
    : 0;

  const onSubmit = async (data: any) => {
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

      console.log('Enviando dados do agendamento:', appointmentData);

      let result;
      if (appointmentId) {
        // Update existing appointment
        result = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointmentId);
      } else {
        // Create new appointment
        result = await supabase
          .from('appointments')
          .insert([appointmentData]);
      }

      if (result.error) {
        console.error("Erro ao salvar agendamento:", result.error);
        throw new Error(result.error.message || "Não foi possível salvar o agendamento.");
      }

      // Saudação de confirmação personalizada
      const formattedDate = format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const formattedTime = format(selectedDate, "HH:mm", { locale: ptBR });
      
      const successMessage = appointmentId 
        ? `Seu agendamento de ${selectedService.name} foi atualizado com sucesso para ${formattedDate} às ${formattedTime}.`
        : `Seu agendamento de ${selectedService.name} foi confirmado com sucesso para ${formattedDate} às ${formattedTime}. Nos vemos em breve!`;

      toast({
        title: appointmentId ? "🎉 Agendamento Atualizado!" : "🎉 Parabéns! Agendamento Confirmado",
        description: successMessage,
        duration: 8000,
      });

      // Navigate back to dashboard after successful submission
      setTimeout(() => {
        navigate('/cliente/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
      toast({
        title: "Erro ao agendar",
        description: error.message || "Não foi possível salvar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  // LOG: visualização dos barbeiros recebidos do hook e dos mapeados
  console.log('[ClientAppointmentForm] Barbeiros recebidos:', barbers);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <ClientAppointmentHeader isEdit={!!appointmentId} />

      <FormCard>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <ClientAppointmentServiceSection 
              control={form.control}
              services={services}
              onServiceSelect={setSelectedService}
            />

            <ClientAppointmentDateTimeSection
              control={form.control}
              selectedService={selectedService}
              availableTimes={availableTimes}
              disabledDays={disabledDays}
              getFieldValue={form.getValues}
              fetchAvailableTimes={fetchAvailableTimes}
            />

            <ClientAppointmentBarberSection
              control={form.control}
              barbers={barbers}
              barberAvailability={barberAvailability}
              isCheckingAvailability={isCheckingAvailability}
              getFieldValue={form.getValues}
              checkBarberAvailability={checkBarberAvailability}
            />

            {selectedService && (
              <ClientAppointmentCouponSection
                form={form}
                servicePrice={selectedService.price}
                appliedCoupon={appliedCoupon}
                isApplyingCoupon={isApplyingCoupon}
                finalPrice={finalPrice}
                onApplyCoupon={applyCoupon}
                onRemoveCoupon={removeCoupon}
              />
            )}

            <ClientAppointmentNotesSection control={form.control} />

            <ClientAppointmentSummarySection
              selectedService={selectedService}
              selectedDate={form.getValues('date')}
              selectedTime={form.getValues('time')}
              appliedCoupon={appliedCoupon}
              finalPrice={finalPrice}
            />

            <AppointmentActionButtons
              isEdit={!!appointmentId}
              loading={loading}
              isSending={isSending}
              isValid={form.formState.isValid}
            />
          </form>
        </Form>
      </FormCard>
    </div>
  );
}

// Exporta todos os novos componentes para facilitar os imports acima
export {
  ClientAppointmentServiceSection,
  ClientAppointmentDateTimeSection,
  ClientAppointmentBarberSection,
  ClientAppointmentCouponSection,
  ClientAppointmentNotesSection,
  ClientAppointmentSummarySection,
};
