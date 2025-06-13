
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useClientAppointmentForm } from '@/hooks/useClientAppointmentForm';
import { ServiceSelectionField } from '@/components/ServiceSelectionField';
import { DateTimeSelectionFields } from '@/components/DateTimeSelectionFields';
import { BarberSelectionField } from '@/components/BarberSelectionField';
import { BarberDebugInfo } from '@/components/BarberDebugInfo';
import { AppointmentSummary } from '@/components/AppointmentSummary';
import { CouponField } from '@/components/CouponField';
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

  const { control, getValues, handleSubmit, formState } = form;
  const selectedDate = getValues('date');
  const selectedTime = getValues('time');

  const finalPrice = selectedService 
    ? appliedCoupon 
      ? Math.max(0, selectedService.price - appliedCoupon.discountAmount)
      : selectedService.price
    : 0;

  const onSubmit = async (data: any) => {
    if (!selectedService) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um serviço.',
        variant: 'destructive',
      });
      return;
    }

    if (!data.date || !data.time) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma data e horário.',
        variant: 'destructive',
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

      let result;
      if (appointmentId) {
        result = await supabase.from('appointments').update(appointmentData).eq('id', appointmentId);
      } else {
        result = await supabase.from('appointments').insert([appointmentData]);
      }

      if (result.error) {
        const detailed = result.error.details || result.error.message;
        throw new Error(detailed || 'Não foi possível salvar o agendamento.');
      }

      const formattedDate = format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const formattedTime = format(selectedDate, 'HH:mm', { locale: ptBR });

      toast({
        title: appointmentId ? '🎉 Agendamento Atualizado!' : '🎉 Parabéns! Agendamento Confirmado',
        description: `${appointmentId ? 'Seu agendamento de' : 'Seu agendamento de'} ${selectedService.name} foi ${appointmentId ? 'atualizado' : 'confirmado'} com sucesso para ${formattedDate} às ${formattedTime}. Nos vemos em breve!`,
        duration: 8000,
      });

      setTimeout(() => {
        navigate('/cliente/dashboard');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Erro ao agendar',
        description: error.message || 'Não foi possível salvar o agendamento. Tente novamente.',
        variant: 'destructive',
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

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-playfair">
          {appointmentId ? 'Editar Agendamento' : 'Agendar Horário'}
        </h1>
        <p className="text-gray-300 text-lg">
          {appointmentId ? 'Modifique os detalhes do seu agendamento' : 'Reserve seu momento de cuidado pessoal'}
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 md:p-8 shadow-2xl">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-urbana-gold/20 rounded-lg">
                  <Scissors className="h-5 w-5 text-urbana-gold" />
                </div>
                <h3 className="text-xl font-semibold text-white">Escolha seu Serviço</h3>
              </div>
              <ServiceSelectionField control={control} services={services} onServiceSelect={setSelectedService} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Data e Horário</h3>
              </div>
              <DateTimeSelectionFields
                control={control}
                selectedService={selectedService}
                availableTimes={availableTimes}
                disabledDays={disabledDays}
                getFieldValue={getValues}
                fetchAvailableTimes={fetchAvailableTimes}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <User className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Escolha seu Barbeiro</h3>
              </div>
              <BarberSelectionField
                control={control}
                barbers={barbers}
                barberAvailability={barberAvailability}
                isCheckingAvailability={isCheckingAvailability}
                getFieldValue={getValues}
                checkBarberAvailability={checkBarberAvailability}
              />
              <BarberDebugInfo barbers={barbers} barberAvailability={barberAvailability} isCheckingAvailability={isCheckingAvailability} />
            </div>

            {selectedService && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Cupom de Desconto</h3>
                <CouponField
                  form={form}
                  servicePrice={selectedService.price}
                  appliedCoupon={appliedCoupon}
                  isApplyingCoupon={isApplyingCoupon}
                  finalPrice={finalPrice}
                  onApplyCoupon={applyCoupon}
                  onRemoveCoupon={removeCoupon}
                />
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Observações</h3>
              <FormField
                control={control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Informe detalhes adicionais sobre o seu agendamento (opcional)"
                        className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-urbana-gold focus:ring-urbana-gold/20 resize-none min-h-[100px]"
                        aria-describedby="notes-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-gradient-to-r from-urbana-gold/10 to-urbana-gold/20 border border-urbana-gold/30 rounded-xl p-6">
              <AppointmentSummary
                selectedService={selectedService}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                appliedCoupon={appliedCoupon}
                finalPrice={finalPrice}
              />
              {selectedService && (
                <p className="text-zinc-300 mt-2">
                  Duração estimada: <strong>{selectedService.duration} minutos</strong>
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/cliente/dashboard')}
                className="flex-1 bg-transparent border-zinc-600 text-white hover:bg-zinc-800 hover:border-zinc-500 h-12"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                aria-label={appointmentId ? 'Atualizar agendamento' : 'Confirmar agendamento'}
                className="flex-1 bg-gradient-to-r from-urbana-gold to-urbana-gold/90 hover:from-urbana-gold/90 hover:to-urbana-gold text-black font-semibold h-12 shadow-lg shadow-urbana-gold/25"
                disabled={loading || isSending || !formState.isValid || formState.isSubmitting}
              >
                {loading || isSending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black animate-spin rounded-full" />
                    {appointmentId ? 'Atualizando...' : 'Agendando...'}
                  </div>
                ) : (
                  appointmentId ? 'Atualizar Agendamento' : 'Confirmar Agendamento'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
