
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientFormData } from './client/hooks/useClientFormData';
import { useClientFormSubmit } from './client/hooks/useClientFormSubmit';
import PersonalInfoFields from './PersonalInfoFields';
import { AppointmentFormData } from '@/types/appointment';
import BarbershopStaffSelect from './client/BarbershopStaffSelect';
import ClientServiceSelect from './client/ClientServiceSelect';
import DateTimePicker from './client/DateTimePicker';
import NotesField from './NotesField';

interface ClientAppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ClientAppointmentForm: React.FC<ClientAppointmentFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<AppointmentFormData>({
    name: '',
    phone: '',
    email: '',
    whatsapp: '',
    service: '',
    barber: '',
    date: '',
    time: '',
    notes: ''
  });

  const { services, staffList, loading } = useClientFormData();
  const { handleSubmit, isLoading } = useClientFormSubmit({ 
    clientId: 'temp-client-id', // This should be passed as a prop
    onSuccess: () => {
      onSuccess?.();
      onClose();
    }
  });

  const handleInputChange = (value: string, field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedService = services.find(s => s.id === formData.service);
    if (!selectedService) {
      console.error('Selected service not found');
      return;
    }

    // Convert formData to match the expected format
    const submitData = {
      service_id: formData.service,
      staff_id: formData.barber,
      date: new Date(formData.date),
      time: formData.time,
      notes: formData.notes
    };

    await handleSubmit(submitData, selectedService);
    
    // Reset form after successful submission
    setFormData({
      name: '',
      phone: '',
      email: '',
      whatsapp: '',
      service: '',
      barber: '',
      date: '',
      time: '',
      notes: ''
    });
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="p-6 text-center">Carregando...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar Serviço</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-6">
          <PersonalInfoFields 
            formData={formData} 
            handleInputChange={(e) => handleInputChange(e.target.value, e.target.id)} 
          />
          
          <ClientServiceSelect
            services={services}
            form={undefined}
            onServiceChange={(value) => handleSelectChange(value, 'service')}
          />
          
          <BarbershopStaffSelect
            staffMembers={staffList}
            form={undefined}
          />
          
          <DateTimePicker
            form={undefined}
            availableTimes={[]}
            onDateChange={(date) => handleInputChange(date.toISOString().split('T')[0], 'date')}
          />
          
          <NotesField 
            formData={formData} 
            handleInputChange={(e) => handleInputChange(e.target.value, e.target.id)} 
          />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Agendando...' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientAppointmentForm;
