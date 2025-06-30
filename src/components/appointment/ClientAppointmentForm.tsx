
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
}

const ClientAppointmentForm: React.FC<ClientAppointmentFormProps> = ({ isOpen, onClose }) => {
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
  const { handleSubmit, submitting } = useClientFormSubmit(onClose);

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
    await handleSubmit(formData);
    
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
            handleInputChange={handleInputChange} 
          />
          
          <ClientServiceSelect
            services={services}
            selectedService={formData.service}
            onServiceChange={(value) => handleSelectChange(value, 'service')}
          />
          
          <BarbershopStaffSelect
            staff={staffList}
            selectedStaff={formData.barber}
            onStaffChange={(value) => handleSelectChange(value, 'barber')}
          />
          
          <DateTimePicker
            selectedDate={formData.date}
            selectedTime={formData.time}
            onDateChange={(value) => handleInputChange(value, 'date')}
            onTimeChange={(value) => handleInputChange(value, 'time')}
          />
          
          <NotesField 
            formData={formData} 
            handleInputChange={handleInputChange} 
          />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientAppointmentForm;
