
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useClientFormData } from './client/hooks/useClientFormData';
import { useClientFormSubmit } from './client/hooks/useClientFormSubmit';
import ClientServiceSelect from './client/form/ClientServiceSelect';
import ClientDateTimePicker from './client/form/ClientDateTimePicker';
import ClientNotesField from './client/form/ClientNotesField';
import ClientFormActions from './client/form/ClientFormActions';
import ClientStaffSelect from './client/form/ClientStaffSelect';

const appointmentSchema = z.object({
  service_id: z.string().min(1, 'Selecione um serviço'),
  staff_id: z.string().min(1, 'Selecione um barbeiro'),
  date: z.date({ required_error: 'Selecione uma data' }),
  time: z.string().min(1, 'Selecione um horário'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof appointmentSchema>;

interface ClientAppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  clientId: string;
}

const ClientAppointmentForm: React.FC<ClientAppointmentFormProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  clientId 
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      service_id: '',
      staff_id: '',
      time: '',
      notes: ''
    }
  });

  const { services, staffList, loading } = useClientFormData();
  const { handleSubmit, isLoading } = useClientFormSubmit({ 
    clientId,
    onSuccess: () => {
      onSuccess?.();
      onClose();
      form.reset();
    }
  });

  const selectedService = services.find(s => s.id === form.watch('service_id'));
  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');

  const onSubmit = async (data: FormData) => {
    if (!selectedService) {
      console.error('Selected service not found');
      return;
    }

    const submitData = {
      service_id: data.service_id,
      staff_id: data.staff_id,
      date: data.date,
      time: data.time,
      notes: data.notes || ''
    };

    await handleSubmit(submitData, selectedService);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-stone-900 border-stone-700">
          <div className="p-6 text-center text-white">Carregando...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-stone-900 border-stone-700">
        <DialogHeader>
          <DialogTitle className="text-white">Agendar Serviço</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ClientServiceSelect services={services} form={form} />
            
            <ClientDateTimePicker form={form} />
            
            {selectedDate && selectedTime && (
              <ClientStaffSelect 
                staffMembers={staffList} 
                form={form}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                serviceDuration={selectedService?.duration}
              />
            )}
            
            <ClientNotesField form={form} />
            
            <ClientFormActions 
              isLoading={isLoading} 
              onClose={onClose}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientAppointmentForm;
