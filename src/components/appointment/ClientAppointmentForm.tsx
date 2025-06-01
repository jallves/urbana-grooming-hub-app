
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

interface ClientAppointmentFormProps {
  clientId: string;
}

export default function ClientAppointmentForm({ clientId }: ClientAppointmentFormProps) {
  const navigate = useNavigate();
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
    finalServicePrice,
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
    try {
      // Here we would call the appointment creation function
      // For now, just navigate back to dashboard
      navigate('/cliente/dashboard');
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
    }
  };

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
