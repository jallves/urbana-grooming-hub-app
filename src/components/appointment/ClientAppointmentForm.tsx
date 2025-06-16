import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { ServiceSelectionField } from './components/ServiceSelectionField';
import { DateTimeSelectionFields } from './components/DateTimeSelectionFields';
import { BarberSelectionField } from './components/BarberSelectionField';
import { AppointmentSummary } from './components/AppointmentSummary';
import { CouponField } from './components/CouponField';
import { useToast } from '@/hooks/use-toast';
import { useClientAppointmentForm } from './hooks/useClientAppointmentForm';
import { LoaderPage } from '@/components/ui/loader-page';
import { Loader } from '@/components/ui/loader';

interface ClientAppointmentFormProps {
  clientId: string;
  appointmentId?: string;
  initialData?: {
    serviceId: string;
    staffId: string;
    date: Date;
    notes: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ClientAppointmentForm({ 
  clientId, 
  appointmentId, 
  initialData,
  onSuccess,
  onCancel
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
    error,
  } = useClientAppointmentForm(clientId, initialData, onSuccess);

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data);
      toast({
        title: 'Sucesso',
        description: appointmentId 
          ? 'Agendamento atualizado com sucesso!' 
          : 'Agendamento realizado com sucesso!',
        variant: 'success',
      });
      onSuccess?.();
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar seu agendamento',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <LoaderPage 
        fullScreen 
        text="Carregando dados do agendamento..." 
        className="bg-stone-900"
      />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <div className="text-red-500 text-center">
          <p className="font-medium">Erro ao carregar dados</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="text-urbana-gold border-urbana-gold"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4">
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(handleSubmit)} 
          className="space-y-8"
          aria-labelledby="form-title"
        >
          <h2 id="form-title" className="sr-only">
            Formulário de Agendamento
          </h2>

          {/* Seção de Seleção de Serviço */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-white">
              Serviço
              {!selectedService && services.length === 0 && (
                <Loader size="sm" className="ml-2 inline-block" />
              )}
            </h3>
            
            {services.length === 0 ? (
              <p className="text-sm text-amber-400">
                Carregando serviços... Se não aparecer nada, entre em contato conosco.
              </p>
            ) : (
              <ServiceSelectionField
                control={form.control}
                services={services}
                selectedService={selectedService}
                setSelectedService={setSelectedService}
                setFinalServicePrice={setFinalServicePrice}
              />
            )}
          </section>

          {/* Seção de Data e Horário */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-white">
              Data e Horário
              {!availableTimes && (
                <Loader size="sm" className="ml-2 inline-block" />
              )}
            </h3>
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
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-white">
              Barbeiro
              {isCheckingAvailability && (
                <Loader size="sm" className="ml-2 inline-block" />
              )}
            </h3>
            <BarberSelectionField
              control={form.control}
              barbers={barbers}
              barberAvailability={barberAvailability}
              isCheckingAvailability={isCheckingAvailability}
              getFieldValue={form.getValues}
              checkBarberAvailability={checkBarberAvailability}
            />
            {barbers.length === 0 && (
              <p className="text-sm text-amber-400">
                Carregando barbeiros... Se não aparecer nada, entre em contato conosco.
              </p>
            )}
          </section>

          {/* Seção de Cupom */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-white">
              Cupom de Desconto
              {isApplyingCoupon && (
                <Loader size="sm" className="ml-2 inline-block" />
              )}
            </h3>
            <CouponField
              appliedCoupon={appliedCoupon}
              isApplyingCoupon={isApplyingCoupon}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={removeCoupon}
              servicePrice={selectedService?.price || 0}
            />
          </section>

          {/* Seção de Observações */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-white">
              Observações <span className="text-sm text-stone-400">(Opcional)</span>
            </h3>
            <Textarea
              {...form.register('notes')}
              placeholder="Alguma preferência especial ou observação..."
              className="bg-stone-700 border-stone-600 text-white placeholder:text-stone-400"
              aria-label="Observações opcionais"
            />
          </section>

          {/* Resumo do Agendamento */}
          {selectedService && (
            <section className="space-y-4">
              <h3 className="text-lg font-medium text-white">Resumo do Agendamento</h3>
              <AppointmentSummary
                selectedService={selectedService}
                appliedCoupon={appliedCoupon}
                finalServicePrice={finalServicePrice}
              />
            </section>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-between gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel ?? (() => navigate(-1))}
              className="text-white border-stone-600 hover:bg-stone-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSending || !selectedService}
              className="bg-urbana-gold hover:bg-urbana-600 text-black font-semibold px-8 py-3 disabled:opacity-50"
              aria-disabled={isSending || !selectedService}
            >
              {isSending ? (
                <span className="flex items-center gap-2">
                  <Loader size="sm" />
                  {appointmentId ? 'Atualizando...' : 'Agendando...'}
                </span>
              ) : (
                appointmentId ? 'Atualizar Agendamento' : 'Confirmar Agendamento'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}