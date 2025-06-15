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

  // Agora: barbeiros possuem id (UUID, string), então sem necessidade de mapeamento extra.
  // Removi a conversão detalhada (pois já é feita no hook).
  const mappedBarbers = barbers;

  const finalPrice = selectedService
    ? appliedCoupon
      ? Math.max(0, selectedService.price - appliedCoupon.discountAmount)
      : selectedService.price
    : 0;

  const onSubmit = async (data: any) => {
    // Validação visual melhorada
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

      // Montar dados do agendamento
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

      // Supabase: criar novo agendamento
      const { error } = await (window as any).supabase
        .from('appointments')
        .insert([appointmentData]);

      if (error) {
        throw new Error(error.message || "Não foi possível salvar o agendamento.");
      }

      // Mensagem de sucesso detalhada
      const formattedDate = format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const formattedTime = format(selectedDate, "HH:mm", { locale: ptBR });
      toast({
        title: "🎉 Agendamento Confirmado!",
        description: `Seu agendamento de ${selectedService.name} foi confirmado para ${formattedDate} às ${formattedTime}.`,
        duration: 8000,
      });

      setTimeout(() => {
        navigate('/cliente/dashboard');
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Erro ao agendar",
        description: error.message || "Erro ao salvar o agendamento. Tente novamente.",
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

  return (
    <div className="max-w-3xl mx-auto bg-zinc-900/90 border border-zinc-700 rounded-2xl p-5 md:p-8 shadow-2xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* Passo 1: Escolha do Serviço */}
          <section className="space-y-1 pb-4 border-b border-zinc-700">
            <div className="flex items-center gap-2 mb-1">
              <Scissors className="h-4 w-4 text-urbana-gold" />
              <h3 className="font-semibold text-lg text-white">Escolha seu Serviço</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-2">
              Selecione o tipo de corte ou serviço desejado.
            </p>
            <ServiceSelectionField
              control={form.control}
              services={services}
              onServiceSelect={setSelectedService}
            />
          </section>

          {/* Passo 2: Data e Horário */}
          <section className="space-y-1 pb-4 border-b border-zinc-700">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-blue-400" />
              <h3 className="font-semibold text-lg text-white">Data & Horário</h3>
            </div>
            <DateTimeSelectionFields
              control={form.control}
              selectedService={selectedService}
              availableTimes={availableTimes}
              disabledDays={disabledDays}
              getFieldValue={form.getValues}
              fetchAvailableTimes={fetchAvailableTimes}
            />
          </section>

          {/* Passo 3: Barbeiro */}
          <section className="space-y-1 pb-4 border-b border-zinc-700">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-green-400" />
              <h3 className="font-semibold text-lg text-white">Escolha o Barbeiro</h3>
            </div>
            <BarberSelectionField
              control={form.control}
              barbers={mappedBarbers}
              barberAvailability={barberAvailability}
              isCheckingAvailability={isCheckingAvailability}
              getFieldValue={form.getValues}
              checkBarberAvailability={checkBarberAvailability}
            />
          </section>

          {/* Passo 4: Cupom de Desconto */}
          {selectedService && (
            <section className="space-y-1 pb-4 border-b border-zinc-700">
              <h3 className="font-semibold text-lg text-white">Cupom de Desconto</h3>
              <CouponField
                form={form}
                servicePrice={selectedService.price}
                appliedCoupon={appliedCoupon}
                isApplyingCoupon={isApplyingCoupon}
                finalPrice={finalPrice}
                onApplyCoupon={applyCoupon}
                onRemoveCoupon={removeCoupon}
              />
            </section>
          )}

          {/* Passo 5: Observação */}
          <section className="space-y-1">
            <h3 className="font-semibold text-lg text-white mb-1">Observação (Opcional)</h3>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Alguma observação ou pedido especial?"
                      className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-urbana-gold focus:ring-urbana-gold/20 resize-none min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Passo 6: Resumo */}
          <div className="bg-gradient-to-r from-urbana-gold/10 to-urbana-gold/20 border border-urbana-gold/30 rounded-xl p-5 mt-4">
            <AppointmentSummary
              selectedService={selectedService}
              selectedDate={form.getValues('date')}
              selectedTime={form.getValues('time')}
              appliedCoupon={appliedCoupon}
              finalPrice={finalPrice}
            />
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col md:flex-row gap-4 pt-6">
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
              className="flex-1 bg-gradient-to-r from-urbana-gold to-urbana-gold/90 hover:from-urbana-gold/90 hover:to-urbana-gold text-black font-semibold h-12 shadow-lg shadow-urbana-gold/25"
              disabled={loading || isSending || !form.formState.isValid}
            >
              {(loading || isSending) ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black animate-spin rounded-full" />
                  {appointmentId ? 'Atualizando...' : 'Agendando...'}
                </div>
              ) : (
                appointmentId ? "Atualizar Agendamento" : "Confirmar Agendamento"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

// O arquivo está ficando extenso! Considere pedir um refactor para dividi-lo em subcomponentes se quiser facilitar futuras manutenções.
