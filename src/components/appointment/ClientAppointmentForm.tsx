
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useAppointmentData } from './hooks/useAppointmentData';
import { ServiceSelectionField } from './components/ServiceSelectionField';
import { DateTimeSelectionFields } from './components/DateTimeSelectionFields';
import { BarberSelectionField } from './components/BarberSelectionField';
import { AppointmentSummary } from './components/AppointmentSummary';
import { CouponField } from './components/CouponField';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useClientAppointmentForm } from './hooks/useClientAppointmentForm';

interface ClientAppointmentFormProps {
  clientId: string;
  appointmentId?: string;
  initialData?: {
    serviceId: string;
    staffId: string;
    date: Date;
    notes: string;
  };
}

export default function ClientAppointmentForm({ 
  clientId, 
  appointmentId, 
  initialData 
}: ClientAppointmentFormProps) {
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
    finalServicePrice,
    setFinalServicePrice,
    onSubmit,
    fetchAvailableTimes,
    checkBarberAvailability,
    applyCoupon,
    removeCoupon,
  } = useClientAppointmentForm(clientId, initialData);

  console.log('[ClientAppointmentForm] Estado atual:', {
    loading,
    barbersCount: barbers.length,
    servicesCount: services.length,
    selectedService,
    barberAvailability,
    appointmentId,
    initialData
  });

  if (loading) {
    return <div className="text-white">Carregando dados do agendamento...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Seção de Seleção de Serviço */}
          <section>
            <ServiceSelectionField
              control={form.control}
              services={services}
              selectedService={selectedService}
              setSelectedService={setSelectedService}
              setFinalServicePrice={setFinalServicePrice}
            />
          </section>

          {/* Seção de Data e Horário */}
          <section>
            <DateTimeSelectionFields
              control={form.control}
              disabledDays={disabledDays}
              availableTimes={availableTimes}
              fetchAvailableTimes={fetchAvailableTimes}
              selectedService={selectedService}
              getFieldValue={form.getValues}
            />
          </section>

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

          {/* Seção de Cupom */}
          <section>
            <CouponField
              appliedCoupon={appliedCoupon}
              isApplyingCoupon={isApplyingCoupon}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={removeCoupon}
              servicePrice={selectedService?.price || 0}
            />
          </section>

          {/* Seção de Observações */}
          <section>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Observações (Opcional)
              </label>
              <Textarea
                {...form.register('notes')}
                placeholder="Alguma preferência especial ou observação..."
                className="bg-stone-700 border-stone-600 text-white"
              />
            </div>
          </section>

          {/* Resumo do Agendamento */}
          <section>
            <AppointmentSummary
              selectedService={selectedService}
              appliedCoupon={appliedCoupon}
              finalServicePrice={finalServicePrice}
            />
          </section>

          {/* Botão de Confirmação */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSending || !selectedService}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-3"
            >
              {isSending ? 'Agendando...' : (appointmentId ? 'Atualizar Agendamento' : 'Confirmar Agendamento')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
