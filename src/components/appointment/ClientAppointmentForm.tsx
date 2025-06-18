
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { LoaderPage } from '@/components/ui/loader-page';
import { useClientFormData } from './client/hooks/useClientFormData';
import { useAppointmentSubmit } from './hooks/useAppointmentSubmit';
import { useAdvancedAvailability } from '@/hooks/useAdvancedAvailability';
import ClientSelect from './client/ClientSelect';
import ServiceSelect from './client/ServiceSelect';
import EnhancedDateTimePicker from './client/EnhancedDateTimePicker';
import BarbershopStaffSelect from './client/BarbershopStaffSelect';
import NotesField from './client/NotesField';
import AppointmentFormActions from './client/AppointmentFormActions';
import { AppointmentSummary } from './components/AppointmentSummary';

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
    isLoading: isFormLoading,
    services,
    staffMembers,
    selectedService,
  } = useClientFormData('Cliente');

  const {
    barberAvailability,
    isLoading: isCheckingAvailability,
    checkBarberAvailability,
  } = useAdvancedAvailability();

  const { loading: submitLoading, onSubmit } = useAppointmentSubmit(
    clientId,
    selectedService,
    null, // appliedCoupon
    form as any,
    () => {}, // setSelectedService
    () => {} // setAppliedCoupon
  );

  const isLoading = isFormLoading || submitLoading;

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data);
      toast({
        title: 'Sucesso',
        description: appointmentId 
          ? 'Agendamento atualizado com sucesso!' 
          : 'Agendamento realizado com sucesso!',
      });
      onSuccess?.();
    } catch (err) {
      console.error('[ClientAppointmentForm] Erro ao submeter:', err);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar seu agendamento',
        variant: 'destructive',
      });
    }
  };

  const handleServiceChange = (serviceId: string) => {
    // Reset staff and time selection when service changes
    form.setValue('staff_id', '');
    form.setValue('time', '');
  };

  const handleDateChange = (date: Date) => {
    // Reset time when date changes
    form.setValue('time', '');
  };

  const handleTimeChange = (time: string) => {
    const serviceId = form.getValues('service_id');
    const date = form.getValues('date');
    
    if (serviceId && date && time) {
      checkBarberAvailability(date, time, serviceId, staffMembers);
    }
  };

  if (isFormLoading) {
    return (
      <LoaderPage 
        fullScreen 
        text="Carregando dados do agendamento..." 
        className="bg-stone-900"
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(handleSubmit)} 
          className="space-y-8"
        >
          <ClientSelect form={form} clientName="Cliente" />
          
          <ServiceSelect 
            services={services} 
            form={form} 
            onServiceChange={handleServiceChange}
          />
          
          <EnhancedDateTimePicker 
            form={form}
            selectedServiceId={form.watch('service_id')}
            selectedStaffId={form.watch('staff_id')}
            onDateChange={handleDateChange}
            onTimeChange={handleTimeChange}
          />
          
          <BarbershopStaffSelect 
            staffMembers={staffMembers} 
            form={form} 
            barberAvailability={barberAvailability}
            isCheckingAvailability={isCheckingAvailability}
          />
          
          <NotesField form={form} />
          
          {selectedService && (
            <div className="space-y-4 p-6 bg-stone-800/50 rounded-lg border border-stone-700">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                ✨ Resumo do Agendamento
              </h3>
              <AppointmentSummary
                selectedService={selectedService}
                appliedCoupon={null}
                finalServicePrice={selectedService.price}
              />
            </div>
          )}
          
          <AppointmentFormActions 
            isLoading={submitLoading} 
            onCancel={onCancel ?? (() => navigate(-1))} 
            isEditing={!!appointmentId} 
          />
        </form>
      </Form>
    </div>
  );
}
