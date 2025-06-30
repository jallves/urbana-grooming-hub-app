
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PersonalInfoFields from './PersonalInfoFields';
import ServiceSelection from './ServiceSelection';
import AppointmentDateTime from './AppointmentDateTime';
import NotesField from './NotesField';
import { AppointmentFormData } from '@/types/appointment';

interface Staff {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialties?: string;
  is_active: boolean;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FormDataResponse {
  services: Service[];
  staffList: Staff[];
  loading: boolean;
}

const ClientBookingForm: React.FC = () => {
  const { toast } = useToast();
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
  
  const [dataResponse, setDataResponse] = useState<FormDataResponse>({
    services: [],
    staffList: [],
    loading: true
  });
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      setDataResponse(prev => ({ ...prev, loading: true }));

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (servicesError) throw servicesError;

      // Fetch staff (changed from barbers to staff)
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (staffError) throw staffError;

      setDataResponse({
        services: servicesData || [],
        staffList: staffData || [],
        loading: false
      });

    } catch (error) {
      console.error('Error fetching form data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os serviços e profissionais.",
        variant: "destructive",
      });
      setDataResponse(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputChange = (value: string, field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Basic validation
      if (!formData.name || !formData.phone || !formData.service || !formData.date || !formData.time) {
        throw new Error('Por favor, preencha todos os campos obrigatórios.');
      }

      // Create or find client
      let clientId: string;
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', formData.phone)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            whatsapp: formData.whatsapp || null
          })
          .select('id')
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      // Get service details
      const selectedService = dataResponse.services.find(s => s.id === formData.service);
      if (!selectedService) throw new Error('Serviço não encontrado');

      // Create appointment
      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = new Date(startDateTime.getTime() + selectedService.duration * 60000);

      const appointmentData = {
        client_id: clientId,
        service_id: formData.service,
        staff_id: formData.barber === 'any' ? null : formData.barber,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'scheduled' as const,
        notes: formData.notes || null
      };

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentData);

      if (appointmentError) throw appointmentError;

      toast({
        title: "Agendamento realizado!",
        description: "Seu agendamento foi confirmado. Você receberá uma confirmação em breve.",
      });

      // Reset form
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

    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Erro no agendamento",
        description: error instanceof Error ? error.message : "Não foi possível criar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (dataResponse.loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Agendar Serviço</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PersonalInfoFields 
            formData={formData} 
            handleInputChange={handleInputChange} 
          />
          
          <ServiceSelection 
            formData={formData} 
            handleSelectChange={handleSelectChange}
          />
          
          <AppointmentDateTime 
            date={formData.date ? new Date(formData.date) : undefined}
            handleDateChange={(date) => handleInputChange(date ? date.toISOString().split('T')[0] : '', 'date')} 
          />
          
          <NotesField 
            formData={formData} 
            handleInputChange={handleInputChange} 
          />

          <Button 
            type="submit" 
            disabled={submitting} 
            className="w-full"
          >
            {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ClientBookingForm;
