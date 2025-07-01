import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useClientAppointmentFormData } from './useClientAppointmentFormData';
import { useClientAppointmentFormSubmit } from './useClientAppointmentFormSubmit';
import ServiceSelect from '@/components/admin/appointments/form/ServiceSelect';
import StaffSelect from '@/components/admin/appointments/form/StaffSelect';
import ClientDateTimePicker from './ClientDateTimePicker';
import NotesField from '@/components/admin/appointments/form/NotesField';
import AppointmentFormActions from '@/components/admin/appointments/form/AppointmentFormActions';
import { useClientAuth } from '@/contexts/ClientAuthContext';

interface ClientAppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
}

const ClientAppointmentForm: React.FC<ClientAppointmentFormProps> = ({ 
  isOpen, 
  onClose,
  defaultDate = new Date()
}) => {
  const { client } = useClientAuth();
  
  console.log('👤 Cliente no formulário:', client);
  
  const {
    form,
    isLoading: isFormLoading,
    services,
    staffMembers,
    selectedService
  } = useClientAppointmentFormData(defaultDate, client?.id);
  
  console.log('📋 Dados do formulário:', {
    servicesCount: services.length,
    staffMembersCount: staffMembers.length,
    isFormLoading,
    selectedService
  });
  
  const { handleSubmit, isLoading: isSubmitLoading } = useClientAppointmentFormSubmit({
    onClose
  });
  
  const isLoading = isFormLoading || isSubmitLoading;
  
  const onSubmit = async (data: any) => {
    if (!client) {
      console.error('Cliente não autenticado');
      return;
    }
    
    // Add client_id to the form data
    const appointmentData = {
      ...data,
      client_id: client.id
    };
    
    await handleSubmit(appointmentData, selectedService);
  };

  // Get form values for StaffSelect
  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');
  
  if (!client) {
    return null;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">Cliente:</p>
          <p className="font-medium text-black">{client.name}</p>
          {client.phone && (
            <p className="text-sm text-gray-600">{client.phone}</p>
          )}
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ServiceSelect services={services} form={form} />
            
            <ClientDateTimePicker form={form} />
            
            <StaffSelect 
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
              isEditing={false}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientAppointmentForm;