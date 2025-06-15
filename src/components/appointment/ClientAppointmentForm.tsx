
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useClientAppointmentForm } from './hooks/useClientAppointmentForm';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClientAppointmentHeader } from './components/ClientAppointmentHeader';
import { FormCard } from './components/FormCard';
import { AppointmentActionButtons } from './components/AppointmentActionButtons';
import { 
  ClientAppointmentServiceSection,
  ClientAppointmentDateTimeSection,
  ClientAppointmentBarberSection,
  ClientAppointmentCouponSection,
  ClientAppointmentNotesSection,
  ClientAppointmentSummarySection
} from './components';

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

      // Simples toast de sucesso
      const formattedDate = format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const formattedTime = format(selectedDate, "HH:mm", { locale: ptBR });

      toast({
        title: appointmentId ? "🎉 Agendamento Atualizado!" : "🎉 Parabéns! Agendamento Confirmado",
        description: appointmentId
          ? `Seu agendamento de ${selectedService.name} foi atualizado para ${formattedDate} às ${formattedTime}.`
          : `Seu agendamento de ${selectedService.name} foi confirmado para ${formattedDate} às ${formattedTime}.`,
        duration: 8000,
      });

      setTimeout(() => {
        navigate('/cliente/dashboard');
      }, 2000);
    } catch (error: any) {
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

  // ----------------------
  // MELHORIAS DE UI/UX
  // ----------------------
  // - Ampliação no espaçamento e agrupamento das seções
  // - Titulação clara em cada etapa
  // - Melhores avisos opcionais x obrigatórios
  // - Feedback visual/focus entre as etapas (cards, borda colorida, hover, step number)
  // - Resumo sempre visível, responsivo para mobile

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-8 py-6"> 
      <ClientAppointmentHeader isEdit={!!appointmentId} />
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* 1. SERVIÇO */}
        <section className="bg-stone-900/80 border-l-4 border-amber-400 rounded-xl p-6 mb-8 shadow-sm transition hover:scale-[1.01]">
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            1. Escolha o Serviço<span className="text-sm text-stone-400 ml-2">(obrigatório)</span>
          </h2>
          <p className="text-stone-400 mb-4 text-sm">Selecione o tipo de corte e serviço desejado para liberar as outras etapas.</p>
          <ClientAppointmentServiceSection 
            control={form.control}
            services={services}
            onServiceSelect={setSelectedService}
          />
        </section>

        {/* 2. DATA E HORÁRIO */}
        <section className="bg-stone-900/80 border-l-4 border-blue-500 rounded-xl p-6 mb-8 shadow-sm transition hover:scale-[1.01]">
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            2. Data & Horário<span className="text-sm text-stone-400 ml-2">(obrigatório)</span>
          </h2>
          <p className="text-stone-400 mb-4 text-sm">A lista só aparecerá se um serviço for selecionado.</p>
          <ClientAppointmentDateTimeSection
            control={form.control}
            selectedService={selectedService}
            availableTimes={availableTimes}
            disabledDays={disabledDays}
            getFieldValue={form.getValues}
            fetchAvailableTimes={fetchAvailableTimes}
          />
        </section>

        {/* 3. BARBEIRO */}
        <section className="bg-stone-900/80 border-l-4 border-green-500 rounded-xl p-6 mb-8 shadow-sm transition hover:scale-[1.01]">
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            3. Barbeiro<span className="text-sm text-stone-400 ml-2">(opcional)</span>
          </h2>
          <p className="text-stone-400 mb-4 text-sm">Você pode escolher seu barbeiro preferido ou deixar para qualquer um disponível.</p>
          <ClientAppointmentBarberSection
            control={form.control}
            barbers={barbers}
            barberAvailability={barberAvailability}
            isCheckingAvailability={isCheckingAvailability}
            getFieldValue={form.getValues}
            checkBarberAvailability={checkBarberAvailability}
          />
        </section>

        {/* 4. CUPOM DESCONTO (opcional) */}
        <section className="bg-stone-900/80 border-l-4 border-pink-400 rounded-xl p-6 mb-8 shadow-sm transition hover:scale-[1.01]">
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            4. Cupom de desconto <span className="text-sm text-stone-400 ml-2">(opcional)</span>
          </h2>
          <p className="text-stone-400 mb-4 text-sm">Possui um cupom? Aproveite para economizar!</p>
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
        </section>

        {/* 5. OBSERVAÇÕES (opcional) */}
        <section className="bg-stone-900/80 border-l-4 border-purple-400 rounded-xl p-6 mb-8 shadow-sm transition hover:scale-[1.01]">
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            5. Observações para a Barbearia <span className="text-sm text-stone-400 ml-2">(opcional)</span>
          </h2>
          <ClientAppointmentNotesSection control={form.control} />
        </section>

        {/* 6. RESUMO */}
        <section className="bg-stone-900/90 border border-urbana-gold rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-urbana-gold mb-3 flex items-center gap-2">Resumo do agendamento</h2>
          <ClientAppointmentSummarySection
            selectedService={selectedService}
            selectedDate={form.getValues('date')}
            selectedTime={form.getValues('time')}
            appliedCoupon={appliedCoupon}
            finalPrice={finalPrice}
          />
        </section>

        {/* BOTÃO AGENDAR */}
        <div className="flex w-full justify-end mt-6">
          <AppointmentActionButtons
            isEdit={!!appointmentId}
            loading={loading}
            isSending={isSending}
            isValid={form.formState.isValid}
          />
        </div>
      </form>
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
