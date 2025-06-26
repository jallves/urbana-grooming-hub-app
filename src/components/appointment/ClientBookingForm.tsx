import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBarberAvailability } from '@/hooks/useBarberAvailability';
import { BarberSelector } from './BarberSelector';
import { Calendar as CalendarIcon, Clock, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  message?: string;
}

export const ClientBookingForm: React.FC = () => {
  const navigate = useNavigate();
  const { client } = useClientAuth();
  const { toast } = useToast();
  const { validateBooking } = useBarberAvailability();
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isValidating, setIsValidating] = useState(false);
  
  const [formData, setFormData] = useState({
    service_id: '',
    staff_id: '',
    time: '',
    notes: ''
  });

  const selectedService = services.find(s => s.id === formData.service_id);

  useEffect(() => {
    if (!client) {
      navigate('/cliente/login');
      return;
    }
    loadServices();
  }, [client, navigate]);

  const loadServices = async () => {
    setDataLoading(true);
    try {
      const { data: servicesData, error } = await supabase
        .from('services')
        .select('id, name, duration, price')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Erro ao carregar serviços:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os serviços.",
          variant: "destructive",
        });
      } else {
        setServices(servicesData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados.",
        variant: "destructive",
      });
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client || !selectedDate || !formData.service_id || !formData.time || !formData.staff_id) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedService) {
      toast({
        title: "Erro",
        description: "Serviço não encontrado.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setIsValidating(true);

    try {
      // Criar data/hora de início
      const [hours, minutes] = formData.time.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      // Calcular horário de fim
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration);

      // Validar apenas disponibilidade de horário (sem verificar qualificação)
      const validationResult = await validateBooking(
        client.id,
        formData.staff_id,
        startTime,
        endTime
      );

      // Safely cast the result to ValidationResult
      const validation = validationResult as unknown as ValidationResult;

      if (!validation.valid) {
        toast({
          title: "Agendamento inválido",
          description: validation.error || "Não foi possível validar o agendamento.",
          variant: "destructive",
        });
        setIsValidating(false);
        setLoading(false);
        return;
      }

      // Criar agendamento
      const { error } = await supabase
        .from('appointments')
        .insert([{
          client_id: client.id,
          service_id: formData.service_id,
          staff_id: formData.staff_id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'scheduled',
          notes: formData.notes || null
        }]);

      if (error) throw error;

      toast({
        title: "Agendamento criado com sucesso!",
        description: "Seu agendamento foi confirmado.",
        action: <CheckCircle className="h-4 w-4 text-green-500" />
      });

      navigate('/cliente/dashboard');
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsValidating(false);
    }
  };

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ];

  if (!client) return null;

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-8">
          <Button
            onClick={() => navigate('/cliente/dashboard')}
            variant="outline"
            className="mr-4 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white font-clash">
              Novo Agendamento
            </h1>
            <p className="text-[#9CA3AF] font-inter">
              Agende seu horário com barbeiros disponíveis
            </p>
          </div>
        </div>

        <Card className="bg-[#111827] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Dados do Agendamento</CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              Selecione o serviço, data e horário para ver barbeiros disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="client_name" className="text-white">Cliente</Label>
                  <Input
                    id="client_name"
                    value={client.name}
                    disabled
                    className="bg-[#1F2937] border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="service" className="text-white">Serviço *</Label>
                  <Select 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      service_id: value 
                    }))}
                  >
                    <SelectTrigger className="bg-[#1F2937] border-gray-600 text-white">
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - R$ {service.price.toFixed(2)} ({service.duration}min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Data *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-[#1F2937] border-gray-600 text-white hover:bg-gray-800"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date() || date.getDay() === 0}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="time" className="text-white">Horário *</Label>
                  <Select 
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, time: value }));
                    }}
                    disabled={!selectedDate}
                  >
                    <SelectTrigger className="bg-[#1F2937] border-gray-600 text-white">
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4" />
                            {time}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="barber" className="text-white">Barbeiro *</Label>
                  <BarberSelector
                    date={selectedDate}
                    time={formData.time}
                    duration={selectedService?.duration || 0}
                    selectedBarberId={formData.staff_id}
                    onBarberChange={(barberId) => setFormData(prev => ({ ...prev, staff_id: barberId }))}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-white">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações adicionais (opcional)"
                  className="bg-[#1F2937] border-gray-600 text-white placeholder-[#9CA3AF]"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/cliente/dashboard')}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.service_id || !selectedDate || !formData.time || !formData.staff_id}
                  className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-black"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isValidating ? 'Validando...' : 'Agendando...'}
                    </>
                  ) : (
                    'Confirmar Agendamento'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};