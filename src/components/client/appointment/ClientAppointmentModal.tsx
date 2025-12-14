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
import { CalendarIcon, User, Scissors } from 'lucide-react';

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

  // Get form values for components
  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');
  const selectedStaffId = form.watch('staff_id');
  const selectedServiceId = form.watch('service_id');
  
  if (!client) {
    return null;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {appointmentId ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>
        
        {/* Card do Cliente */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{client.name}</p>
              <div className="flex gap-3 text-sm text-muted-foreground">
                {client.phone && <span>📱 {client.phone}</span>}
                {client.email && <span>✉️ {client.email}</span>}
              </div>
            </div>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* 1. Seleção de Barbeiro PRIMEIRO */}
            <div className="space-y-2">
              <ClientStaffSelect 
                staffMembers={staffMembers} 
                form={form} 
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                serviceDuration={selectedService?.duration}
                appointmentId={appointmentId}
              />
            </div>
            
            {/* 2. Seleção de Serviço */}
            <ServiceSelect services={services} form={form} />
            
            {/* 3. Seleção de Data e Horário (depende do barbeiro e serviço) */}
            <ClientDateTimePicker 
              form={form}
              barberId={selectedStaffId}
              serviceDuration={selectedService?.duration}
              appointmentId={appointmentId}
            />
            
            {/* 4. Notas */}
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
