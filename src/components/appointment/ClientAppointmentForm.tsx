
import React from 'react';
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
  const {
    form,
    loading,
    services,
    barbers,
    selectedService,
    availableTimes,
    barberAvailability,
    isCheckingAvailability,
    isSending,
    disabledDays,
    appliedCoupon,
    isApplyingCoupon,
    finalServicePrice,
    onSubmit,
    onApplyCoupon,
    onRemoveCoupon,
  } = useClientAppointmentForm(clientId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Service Selection */}
        <ServiceSelectionField control={form.control} services={services} />

        {/* Date and Time Selection */}
        <DateTimeSelectionFields
          control={form.control}
          selectedService={selectedService}
          availableTimes={availableTimes}
          disabledDays={disabledDays}
          getFieldValue={form.getValues}
        />

        {/* Barber Selection with Availability Indicator */}
        <BarberSelectionField
          control={form.control}
          barbers={barbers}
          barberAvailability={barberAvailability}
          isCheckingAvailability={isCheckingAvailability}
          getFieldValue={form.getValues}
        />

        {/* Coupon Field */}
        {selectedService && (
          <CouponField
            form={form}
            servicePrice={selectedService.price}
            appliedCoupon={appliedCoupon}
            isApplyingCoupon={isApplyingCoupon}
            finalPrice={finalServicePrice}
            onApplyCoupon={onApplyCoupon}
            onRemoveCoupon={onRemoveCoupon}
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
          finalPrice={finalServicePrice}
        />

        <Button 
          type="submit" 
          className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-white py-6"
          disabled={loading || isSending || !form.formState.isValid}
        >
          {loading || isSending ? "Agendando..." : "Confirmar Agendamento"}
        </Button>
      </form>
    </Form>
  );
}
