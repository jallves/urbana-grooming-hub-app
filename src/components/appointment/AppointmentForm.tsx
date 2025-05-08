
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { addHours } from "date-fns";
import { AppointmentFormData } from "@/types/appointment";
import PersonalInfoFields from './PersonalInfoFields';
import ServiceSelection from './ServiceSelection';
import AppointmentDateTime from './AppointmentDateTime';
import NotesField from './NotesField';

const AppointmentForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
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

    // Validação básica
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
      // 1. Inserir cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Obter duração do serviço
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', formData.service)
        .single();
        
      if (serviceError) throw serviceError;
      if (!serviceData) throw new Error("Serviço não encontrado");

      const startTime = formData.date;
      if (!startTime) throw new Error("Data não selecionada");
      
      // Calcular horário final baseado na duração do serviço
      const endTime = addHours(startTime, serviceData.duration / 60);

      // 2. Inserir agendamento
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          client_id: clientData.id,
          service_id: formData.service,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'agendado',
          notes: formData.notes || null
        });

      if (appointmentError) throw appointmentError;

      // Sucesso
      toast({
        title: "Solicitação de Agendamento Enviada",
        description: "Entraremos em contato em breve para confirmar seu horário.",
      });

      // Limpar formulário
      setFormData({
        name: '',
        phone: '',
        email: '',
        service: '',
        barber: '',
        date: undefined,
        notes: ''
      });

    } catch (error) {
      console.error('Erro ao enviar agendamento:', error);
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
