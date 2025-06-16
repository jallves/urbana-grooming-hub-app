
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
import { Loader } from '@/components/ui/loader';
import { Service } from '@/types/service';
import { Barber } from '@/types/barber';

interface AppointmentInitialData {
  serviceId: string;
  staffId: string;
  date: Date;
  notes: string;
}

interface ClientAppointmentFormProps {
  clientId: string;
  appointmentId?: string;
  initialData?: AppointmentInitialData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ClientAppointmentForm: React.FC<ClientAppointmentFormProps> = ({ 
  clientId, 
  appointmentId, 
  initialData,
  onSuccess,
  onCancel
}) => {
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
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader size="lg" />
        <p className="text-white text-center">
          Carregando dados do agendamento...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="text-red-500 text-center">
          <p className="font-medium">Erro ao carregar dados</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
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

          <FormSection 
            title="Serviço"
            loading={!selectedService && services.length === 0}
            loadingMessage="Carregando serviços..."
          >
            <ServiceSelectionField
              control={form.control}
              services={services}
              selectedService={selectedService}
              setSelectedService={setSelectedService}
              setFinalServicePrice={setFinalServicePrice}
            />
          </FormSection>

          <FormSection 
            title="Data e Horário"
            loading={!availableTimes}
            loadingMessage="Carregando horários disponíveis..."
          >
            <DateTimeSelectionFields
              control={form.control}
              disabledDays={disabledDays}
              availableTimes={availableTimes}
              fetchAvailableTimes={fetchAvailableTimes}
              selectedService={selectedService}
              getFieldValue={form.getValues}
            />
          </FormSection>

          <FormSection 
            title="Barbeiro"
            loading={barbers.length === 0}
            loadingMessage="Carregando barbeiros..."
          >
            <BarberSelectionField
              control={form.control}
              barbers={barbers}
              barberAvailability={barberAvailability}
              isCheckingAvailability={isCheckingAvailability}
              getFieldValue={form.getValues}
              checkBarberAvailability={checkBarberAvailability}
            />
          </FormSection>

          <FormSection title="Cupom de Desconto">
            <CouponField
              appliedCoupon={appliedCoupon}
              isApplyingCoupon={isApplyingCoupon}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={removeCoupon}
              servicePrice={selectedService?.price || 0}
            />
          </FormSection>

          <FormSection title="Observações" optional>
            <Textarea
              {...form.register('notes')}
              placeholder="Alguma preferência especial ou observação..."
              className="bg-stone-700 border-stone-600 text-white placeholder:text-stone-400"
              aria-label="Observações opcionais"
            />
          </FormSection>

          {selectedService && (
            <FormSection title="Resumo do Agendamento">
              <AppointmentSummary
                selectedService={selectedService}
                appliedCoupon={appliedCoupon}
                finalServicePrice={finalServicePrice}
              />
            </FormSection>
          )}

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
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-3 disabled:opacity-50"
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
};

// Componente auxiliar para seções do formulário
interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  optional?: boolean;
  loading?: boolean;
  loadingMessage?: string;
}

const FormSection: React.FC<FormSectionProps> = ({ 
  title, 
  children, 
  optional, 
  loading, 
  loadingMessage 
}) => (
  <section className="space-y-4">
    <h3 className="text-lg font-medium text-white flex items-center gap-2">
      {title}
      {optional && (
        <span className="text-sm text-stone-400">(Opcional)</span>
      )}
      {loading && (
        <Loader size="sm" />
      )}
    </h3>
    {loading && loadingMessage ? (
      <p className="text-sm text-amber-400">{loadingMessage}</p>
    ) : (
      <div className="space-y-4">
        {children}
      </div>
    )}
  </section>
);