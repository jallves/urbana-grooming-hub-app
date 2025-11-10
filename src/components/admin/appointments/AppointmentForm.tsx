
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
import CouponField from './form/CouponField';
import AppointmentFormActions from './form/AppointmentFormActions';

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
  appointmentId?: string;
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

  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');
  const selectedStaffId = form.watch('staff_id');
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {appointmentId ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ClientSelect clients={clients} form={form} />
            
            <ServiceSelect services={services} form={form} />
            
            <DateTimePicker 
              form={form}
              barberId={selectedStaffId}
              serviceDuration={selectedService?.duration}
            />
            
            <StaffSelect 
              staffMembers={staffMembers} 
              form={form} 
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              serviceDuration={selectedService?.duration}
              appointmentId={appointmentId}
            />
            
            <NotesField form={form} />
            
            {appointmentId && (
              <CouponField 
                form={form} 
                appointmentId={appointmentId}
                servicePrice={selectedService?.price}
              />
            )}
            
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
