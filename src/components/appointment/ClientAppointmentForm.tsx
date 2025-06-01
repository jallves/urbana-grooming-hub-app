
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useClientAppointmentForm } from './hooks/useClientAppointmentForm';
import { ServiceSelectionField } from './components/ServiceSelectionField';
import { DateTimeSelectionFields } from './components/DateTimeSelectionFields';
import { BarberSelectionField } from './components/BarberSelectionField';
import { AppointmentSummary } from './components/AppointmentSummary';
import { CouponField } from './components/CouponField';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientAppointmentFormProps {
  clientId: string;
}

export default function ClientAppointmentForm({ clientId }: ClientAppointmentFormProps) {
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
  } = useClientAppointmentForm(clientId);

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
      console.log('Creating appointment for client:', clientId);
      console.log('Form data:', data);
      console.log('Selected service:', selectedService);

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

      console.log('Appointment data to insert:', appointmentData);

      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData]);

      if (error) {
        console.error("Erro ao criar agendamento:", error);
        throw new Error(error.message || "Não foi possível criar o agendamento.");
      }

      // Saudação de confirmação personalizada
      const formattedDate = format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const formattedTime = format(selectedDate, "HH:mm", { locale: ptBR });
      
      toast({
        title: "🎉 Parabéns! Agendamento Confirmado",
        description: `Seu agendamento de ${selectedService.name} foi confirmado com sucesso para ${formattedDate} às ${formattedTime}. Nos vemos em breve!`,
        duration: 8000,
      });

      // Navigate back to dashboard after successful submission
      setTimeout(() => {
        navigate('/cliente/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro ao agendar",
        description: error.message || "Não foi possível criar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-urbana-gold"></div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Service Selection */}
        <ServiceSelectionField 
          control={form.control} 
          services={services}
          onServiceSelect={setSelectedService}
        />

        {/* Date and Time Selection */}
        <DateTimeSelectionFields
          control={form.control}
          selectedService={selectedService}
          availableTimes={availableTimes}
          disabledDays={disabledDays}
          getFieldValue={form.getValues}
          fetchAvailableTimes={fetchAvailableTimes}
        />

        {/* Barber Selection with Availability Indicator */}
        <BarberSelectionField
          control={form.control}
          barbers={barbers}
          barberAvailability={barberAvailability}
          isCheckingAvailability={isCheckingAvailability}
          getFieldValue={form.getValues}
          checkBarberAvailability={checkBarberAvailability}
        />

        {/* Coupon Field */}
        {selectedService && (
          <CouponField
            form={form}
            servicePrice={selectedService.price}
            appliedCoupon={appliedCoupon}
            isApplyingCoupon={isApplyingCoupon}
            finalPrice={finalPrice}
            onApplyCoupon={applyCoupon}
            onRemoveCoupon={removeCoupon}
          />
        )}

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Informe detalhes adicionais sobre o seu agendamento" 
                  className="resize-none" 
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Appointment Summary */}
        <AppointmentSummary
          selectedService={selectedService}
          selectedDate={form.getValues('date')}
          selectedTime={form.getValues('time')}
          appliedCoupon={appliedCoupon}
          finalPrice={finalPrice}
        />

        <div className="flex gap-4">
          <Button 
            type="button"
            variant="outline"
            onClick={() => navigate('/cliente/dashboard')}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="flex-1 bg-urbana-gold hover:bg-urbana-gold/90 text-white"
            disabled={loading || isSending || !form.formState.isValid}
          >
            {loading || isSending ? "Agendando..." : "Confirmar Agendamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
