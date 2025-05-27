
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle, Dialog } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useAppointmentFormData } from './form/useAppointmentFormData';
import { useAppointmentFormSubmit } from './form/useAppointmentFormSubmit';
import ClientSelect from './form/ClientSelect';
import ServiceSelect from './form/ServiceSelect';
import StaffSelect from './form/StaffSelect';
import DateTimePicker from './form/DateTimePicker';
import NotesField from './form/NotesField';
import AppointmentFormActions from './form/AppointmentFormActions';

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
  appointmentId?: string; // For editing existing appointments
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  isOpen, 
  onClose,
  defaultDate = new Date(),
  appointmentId
}) => {
  const {
    form,
    isLoading: isFormLoading,
    services,
    staffMembers,
    clients,
    selectedService
  } = useAppointmentFormData(appointmentId, defaultDate);
  
  const { handleSubmit, isLoading: isSubmitLoading } = useAppointmentFormSubmit({
    appointmentId,
    onClose
  });
  
  const isLoading = isFormLoading || isSubmitLoading;
  
  const onSubmit = async (data: any) => {
    await handleSubmit(data, selectedService);
  };

  // Obter valores do formulário para passar para StaffSelect
  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {appointmentId ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ClientSelect clients={clients} form={form} />
            
            <ServiceSelect services={services} form={form} />
            
            <DateTimePicker form={form} />
            
            <StaffSelect 
              staffMembers={staffMembers} 
              form={form} 
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              serviceDuration={selectedService?.duration}
              appointmentId={appointmentId}
            />
            
            <NotesField form={form} />
            
            <AppointmentFormActions 
              isLoading={isLoading} 
              onClose={onClose} 
              isEditing={!!appointmentId} 
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentForm;
