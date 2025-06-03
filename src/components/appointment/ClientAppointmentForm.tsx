
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
import { Calendar, Clock, Scissors, User } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-playfair">
            Agendar Horário
          </h1>
          <p className="text-gray-300 text-lg">
            Reserve seu momento de cuidado pessoal
          </p>
        </div>

        {/* Modern Form Card */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Service Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Scissors className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Escolha seu Serviço</h3>
                </div>
                <ServiceSelectionField 
                  control={form.control} 
                  services={services}
                  onServiceSelect={setSelectedService}
                />
              </div>

              {/* Date and Time Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Data e Horário</h3>
                </div>
                <DateTimeSelectionFields
                  control={form.control}
                  selectedService={selectedService}
                  availableTimes={availableTimes}
                  disabledDays={disabledDays}
                  getFieldValue={form.getValues}
                  fetchAvailableTimes={fetchAvailableTimes}
                />
              </div>

              {/* Barber Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <User className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Escolha seu Barbeiro</h3>
                </div>
                <BarberSelectionField
                  control={form.control}
                  barbers={barbers}
                  barberAvailability={barberAvailability}
                  isCheckingAvailability={isCheckingAvailability}
                  getFieldValue={form.getValues}
                  checkBarberAvailability={checkBarberAvailability}
                />
              </div>

              {/* Coupon Field */}
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

              {/* Notes */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Observações</h3>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Informe detalhes adicionais sobre o seu agendamento (opcional)" 
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-amber-400 focus:ring-amber-400/20 resize-none min-h-[100px]" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Appointment Summary */}
              <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20 rounded-xl p-6">
                <AppointmentSummary
                  selectedService={selectedService}
                  selectedDate={form.getValues('date')}
                  selectedTime={form.getValues('time')}
                  appliedCoupon={appliedCoupon}
                  finalPrice={finalPrice}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/cliente/dashboard')}
                  className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/30 h-12"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold h-12 shadow-lg shadow-amber-500/25"
                  disabled={loading || isSending || !form.formState.isValid}
                >
                  {loading || isSending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black animate-spin rounded-full" />
                      Agendando...
                    </div>
                  ) : (
                    "Confirmar Agendamento"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
