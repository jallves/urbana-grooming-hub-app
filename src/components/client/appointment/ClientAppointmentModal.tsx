
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useClientAppointmentForm } from './useClientAppointmentForm';
import { useClientAppointmentSubmit } from './useClientAppointmentSubmit';
import ServiceSelect from '@/components/admin/appointments/form/ServiceSelect';
import ClientStaffSelect from './ClientStaffSelect';
import ClientDateTimePicker from './ClientDateTimePicker';
import NotesField from '@/components/admin/appointments/form/NotesField';
import AppointmentFormActions from '@/components/admin/appointments/form/AppointmentFormActions';
import { useClientAuth } from '@/contexts/ClientAuthContext';

interface ClientAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
  appointmentId?: string;
}

const ClientAppointmentModal: React.FC<ClientAppointmentModalProps> = ({ 
  isOpen, 
  onClose,
  defaultDate = new Date(),
  appointmentId
}) => {
  const { client } = useClientAuth();
  
  const {
    form,
    isLoading: isFormLoading,
    services,
    staffMembers,
    selectedService
  } = useClientAppointmentForm(defaultDate, appointmentId);
  
  const { handleSubmit, isLoading: isSubmitLoading } = useClientAppointmentSubmit({
    appointmentId,
    onClose,
    clientId: client?.id || ''
  });
  
  const isLoading = isFormLoading || isSubmitLoading;
  
  const onSubmit = async (data: any) => {
    if (!client) {
      console.error('Cliente não autenticado');
      return;
    }
    
    await handleSubmit(data, selectedService);
  };

  // Get form values for StaffSelect
  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');
  const selectedStaffId = form.watch('staff_id');
  
  if (!client) {
    return null;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {appointmentId ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
          <p className="text-sm text-gray-700 mb-1">Cliente:</p>
          <p className="font-semibold text-gray-900 text-lg">{client.name}</p>
          {client.phone && (
            <p className="text-sm text-gray-600 mt-1">📱 {client.phone}</p>
          )}
          {client.email && (
            <p className="text-sm text-gray-600">✉️ {client.email}</p>
          )}
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ServiceSelect services={services} form={form} />
            
            <ClientDateTimePicker 
              form={form}
              barberId={selectedStaffId}
              serviceDuration={selectedService?.duration}
            />
            
            <ClientStaffSelect 
              staffMembers={staffMembers} 
              form={form} 
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              serviceDuration={selectedService?.duration}
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

export default ClientAppointmentModal;
