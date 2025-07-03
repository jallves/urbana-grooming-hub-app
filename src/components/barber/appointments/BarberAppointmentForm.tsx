
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface BarberAppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId?: string;
  defaultDate?: Date;
  dateTimeOnly?: boolean;
}

const BarberAppointmentForm: React.FC<BarberAppointmentFormProps> = ({
  isOpen,
  onClose,
  appointmentId,
  defaultDate,
  dateTimeOnly = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [barberId, setBarberId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    client_id: '',
    service_id: '',
    start_time: defaultDate ? format(defaultDate, "yyyy-MM-dd'T'HH:mm") : '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (appointmentId && isOpen) {
      loadAppointment();
    }
  }, [appointmentId, isOpen]);

  const loadInitialData = async () => {
    try {
      // Get barber ID
      if (user?.email) {
        const { data: staffData } = await supabase
          .from('staff')
          .select('id')
          .eq('email', user.email)
          .eq('role', 'barber')
          .maybeSingle();
        
        if (staffData) {
          setBarberId(staffData.id);
        }
      }

      // Load clients and services
      const [clientsRes, servicesRes] = await Promise.all([
        supabase.from('clients').select('id, name, phone').eq('is_active', true),
        supabase.from('services').select('id, name, price, duration').eq('is_active', true)
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadAppointment = async () => {
    if (!appointmentId) return;
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          client_id: data.client_id,
          service_id: data.service_id,
          start_time: format(new Date(data.start_time), "yyyy-MM-dd'T'HH:mm"),
          notes: data.notes || ''
        });
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o agendamento.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberId) return;

    setLoading(true);
    try {
      const service = services.find(s => s.id === formData.service_id);
      if (!service) throw new Error('Serviço não encontrado');

      const startTime = new Date(formData.start_time);
      const endTime = new Date(startTime.getTime() + (service.duration * 60000));

      const appointmentData = {
        client_id: formData.client_id,
        staff_id: barberId,
        service_id: formData.service_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        notes: formData.notes
      };

      if (appointmentId) {
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointmentId);
        
        if (error) throw error;
        
        toast({
          title: "Agendamento atualizado",
          description: "O agendamento foi atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert([appointmentData]);
        
        if (error) throw error;
        
        toast({
          title: "Agendamento criado",
          description: "O agendamento foi criado com sucesso.",
        });
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving appointment:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {appointmentId ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!dateTimeOnly && (
            <>
              <div>
                <Label htmlFor="client">Cliente</Label>
                <Select 
                  value={formData.client_id} 
                  onValueChange={(value) => handleInputChange('client_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="service">Serviço</Label>
                <Select 
                  value={formData.service_id} 
                  onValueChange={(value) => handleInputChange('service_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - R$ {service.price} ({service.duration}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          <div>
            <Label htmlFor="start_time">Data e Hora</Label>
            <Input
              id="start_time"
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações sobre o agendamento..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : appointmentId ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BarberAppointmentForm;
