import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from 'date-fns';
import { CalendarIcon } from "@radix-ui/react-icons"
import { Service, StaffMember } from "@/types/appointment";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BasicAppointmentFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  isLoading?: boolean;
}

const BasicAppointmentForm: React.FC<BasicAppointmentFormProps> = ({ 
  onSubmit, 
  onCancel,
  initialData,
  isLoading 
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [service, setService] = useState(initialData?.service || '');
  const [barber, setBarber] = useState(initialData?.barber || '');
  const [date, setDate] = useState<Date | undefined>(initialData?.date ? new Date(initialData.date) : undefined);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<StaffMember[]>([]);
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

    const fetchBarbers = async () => {
      const { data, error } = await supabase
        .from('barbers')
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
        setBarbers(data || []);
      }
    };

    fetchServices();
    fetchBarbers();
  }, [toast]);

  const handleSubmit = () => {
    const data = {
      name,
      email,
      phone,
      service,
      barber,
      date: date ? format(date, 'yyyy-MM-dd') : undefined,
      notes
    };
    onSubmit(data);
  };

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="service">Serviço</Label>
          <Select value={service} onValueChange={setService}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um serviço" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id || "no-id"}>
                  {service.name} - R$ {service.price}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="barber">Barbeiro</Label>
          <Select value={barber} onValueChange={setBarber}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um barbeiro" />
            </SelectTrigger>
            <SelectContent>
              {barbers.map((barber) => (
                <SelectItem key={barber.id} value={barber.id || "no-id"}>{barber.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Data</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Escolha uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) =>
                  date < new Date()
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Alguma observação?"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Enviando...' : 'Agendar'}
        </Button>
      </div>
    </div>
  );
};

export default BasicAppointmentForm;
