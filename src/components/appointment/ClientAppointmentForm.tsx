
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { LoaderPage } from '@/components/ui/loader-page';
import { Loader } from '@/components/ui/loader';
import { useClientFormData } from './client/hooks/useClientFormData';
import { useAppointmentSubmit } from './hooks/useAppointmentSubmit';
import { useAvailability } from './hooks/useAvailability';
import ClientSelect from './client/ClientSelect';
import ServiceSelect from './client/ServiceSelect';
import DateTimePicker from './client/DateTimePicker';
import StaffSelect from './client/StaffSelect';
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
  } = useClientFormData('Cliente'); // Você pode buscar o nome real do cliente aqui

  const {
    barberAvailability,
    isCheckingAvailability,
    checkBarberAvailability,
    fetchAvailableTimes,
    availableTimes,
  } = useAvailability();

  const { loading: submitLoading, onSubmit } = useAppointmentSubmit(
    clientId,
    selectedService,
    null, // appliedCoupon - pode ser implementado depois
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
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar seu agendamento',
        variant: 'destructive',
      });
    }
  };

  const handleServiceChange = (serviceId: string) => {
    // Reset staff selection when service changes
    form.setValue('staff_id', '');
    
    // Fetch available times for the selected service
    const selectedDate = form.getValues('date');
    if (selectedDate) {
      fetchAvailableTimes(selectedDate, serviceId);
    }
  };

  const handleDateChange = (date: Date) => {
    const serviceId = form.getValues('service_id');
    const time = form.getValues('time');
    
    if (serviceId) {
      fetchAvailableTimes(date, serviceId);
      
      // Check barber availability if time is also selected
      if (time) {
        checkBarberAvailability(date, time, serviceId, staffMembers);
      }
    }
  };

  // Check barber availability when time changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'time' && value.time && value.date && value.service_id) {
        checkBarberAvailability(value.date, value.time, value.service_id, staffMembers);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, checkBarberAvailability, staffMembers]);

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
    <div className="max-w-3xl mx-auto px-4">
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(handleSubmit)} 
          className="space-y-6"
        >
          <ClientSelect form={form} clientName="Cliente" />
          
          <ServiceSelect 
            services={services} 
            form={form} 
            onServiceChange={handleServiceChange}
          />
          
          <DateTimePicker 
            form={form} 
            availableTimes={availableTimes}
            onDateChange={handleDateChange}
          />
          
          <StaffSelect 
            staffMembers={staffMembers} 
            form={form} 
            barberAvailability={barberAvailability}
            isCheckingAvailability={isCheckingAvailability}
          />
          
          <NotesField form={form} />
          
          {selectedService && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Resumo do Agendamento</h3>
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
