
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Service, StaffMember, AppointmentFormData } from "@/types/appointment";
import { addHours } from "date-fns";

const Appointment: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
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

  useEffect(() => {
    // Carregar serviços
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Erro ao carregar serviços:', error);
        toast({
          title: "Erro ao carregar serviços",
          description: "Não foi possível carregar a lista de serviços. Por favor, tente novamente.",
          variant: "destructive",
        });
      } else {
        setServices(data || []);
      }
    };

    // Carregar barbeiros
    const fetchStaff = async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Erro ao carregar barbeiros:', error);
        toast({
          title: "Erro ao carregar barbeiros",
          description: "Não foi possível carregar a lista de barbeiros. Por favor, tente novamente.",
          variant: "destructive",
        });
      } else {
        setStaff(data || []);
      }
    };

    fetchServices();
    fetchStaff();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setDate(date);
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
      const selectedService = services.find(s => s.id === formData.service);
      if (!selectedService) throw new Error("Serviço não encontrado");

      const startTime = formData.date;
      if (!startTime) throw new Error("Data não selecionada");
      
      // Calcular horário final baseado na duração do serviço
      const endTime = addHours(startTime, selectedService.duration / 60);

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
      setDate(undefined);

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
    <section id="appointment" className="urbana-section bg-urbana-brown text-white">
      <div className="urbana-container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Agende seu Horário</h2>
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto opacity-90">
            Marque sua visita e experimente serviços premium de barbearia
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Nome Completo
                </label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-white/20 border-urbana-gold/50 placeholder:text-white/50"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Telefone
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Seu número de telefone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="bg-white/20 border-urbana-gold/50 placeholder:text-white/50"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Seu e-mail"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-white/20 border-urbana-gold/50 placeholder:text-white/50"
                />
              </div>

              <div>
                <label htmlFor="service" className="block text-sm font-medium mb-2">
                  Serviço
                </label>
                <Select value={formData.service} onValueChange={(value) => handleSelectChange(value, 'service')}>
                  <SelectTrigger className="bg-white/20 border-urbana-gold/50">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - R$ {service.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="barber" className="block text-sm font-medium mb-2">
                  Barbeiro Preferido
                </label>
                <Select value={formData.barber} onValueChange={(value) => handleSelectChange(value, 'barber')}>
                  <SelectTrigger className="bg-white/20 border-urbana-gold/50">
                    <SelectValue placeholder="Selecione um barbeiro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer Disponível</SelectItem>
                    {staff.map((barber) => (
                      <SelectItem key={barber.id} value={barber.id}>{barber.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Data Preferida
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-white/20 border-urbana-gold/50 text-left justify-start h-10"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateChange}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">
                Observações Adicionais
              </label>
              <Textarea
                id="notes"
                placeholder="Pedidos especiais ou informações adicionais"
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
                className="bg-white/20 border-urbana-gold/50 placeholder:text-white/50"
              />
            </div>

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
        </div>
      </div>
    </section>
  );
};

export default Appointment;
