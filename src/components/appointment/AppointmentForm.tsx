
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppointmentFormData } from "@/types/appointment";
import PersonalInfoFields from './PersonalInfoFields';
import ServiceSelection from './ServiceSelection';
import AppointmentDateTime from './AppointmentDateTime';
import NotesField from './NotesField';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const AppointmentForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AppointmentFormData>({
    name: '',
    phone: '',
    email: '',
    service: '',
    barber: '',
    date: undefined,
    notes: ''
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, date }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    // Basic validation
    if (!formData.name || !formData.phone || !formData.service || !formData.date) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      console.log('Starting appointment submission process');
      
      // 1. Insert or find client
      let clientId: string;
      
      // First check if client exists with this phone
      const { data: existingClient, error: clientSearchError } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', formData.phone)
        .maybeSingle();
        
      if (clientSearchError) {
        console.error('Error searching for existing client:', clientSearchError);
        throw new Error('Erro ao verificar cliente existente');
      }
      
      if (existingClient) {
        // Update existing client
        clientId = existingClient.id;
        await supabase
          .from('clients')
          .update({
            name: formData.name,
            email: formData.email || null
          })
          .eq('id', clientId);
          
        console.log('Updated existing client:', clientId);
      } else {
        // Create new client
        const { data: newClient, error: newClientError } = await supabase
          .from('clients')
          .insert({
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null
          })
          .select()
          .single();

        if (newClientError) {
          console.error('Error creating new client:', newClientError);
          throw newClientError;
        }
        
        clientId = newClient.id;
        console.log('Created new client:', clientId);
      }

      // Get service details for duration
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', formData.service)
        .single();
        
      if (serviceError) {
        console.error('Error fetching service:', serviceError);
        throw serviceError;
      }
      
      if (!serviceData) {
        console.error('Service not found');
        throw new Error("Serviço não encontrado");
      }

      // Define appointment times
      const startTime = formData.date;
      if (!startTime) throw new Error("Data não selecionada");
      
      // Set end time based on service duration (in minutes)
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + serviceData.duration);
      
      // Prepare appointment data
      const appointmentData: any = {
        client_id: clientId,
        service_id: formData.service,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        notes: formData.notes || null
      };
      
      // Add staff_id if barber is selected
      if (formData.barber) {
        appointmentData.staff_id = formData.barber;
      }
      
      console.log('Inserting appointment with data:', appointmentData);

      // Insert appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentData);

      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError);
        throw appointmentError;
      }

      // Success
      toast({
        title: "Solicitação de Agendamento Enviada",
        description: "Entraremos em contato em breve para confirmar seu horário.",
      });

      // Clear form
      setFormData({
        name: '',
        phone: '',
        email: '',
        service: '',
        barber: '',
        date: undefined,
        notes: ''
      });

    } catch (error: any) {
      console.error('Erro ao enviar agendamento:', error);
      setFormError("Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.");
      toast({
        title: "Erro ao enviar agendamento",
        description: "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PersonalInfoFields 
          formData={formData} 
          handleInputChange={handleInputChange} 
        />
        
        <ServiceSelection 
          formData={formData} 
          handleSelectChange={handleSelectChange} 
        />
        
        <AppointmentDateTime 
          date={formData.date}
          handleDateChange={handleDateChange} 
        />
      </div>

      <NotesField 
        notes={formData.notes} 
        handleInputChange={handleInputChange} 
      />

      <div className="pt-4">
        <Button 
          type="submit" 
          className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-white py-6 text-lg"
          disabled={loading}
        >
          {loading ? "Enviando..." : "Agendar Horário"}
        </Button>
      </div>
    </form>
  );
};

export default AppointmentForm;
