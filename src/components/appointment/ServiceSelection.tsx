
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Service, StaffMember, AppointmentFormData } from "@/types/appointment";

interface ServiceSelectionProps {
  formData: AppointmentFormData;
  handleSelectChange: (value: string, field: string) => void;
}

const ServiceSelection: React.FC<ServiceSelectionProps> = ({ formData, handleSelectChange }) => {
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

    // Carregar barbeiros
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
  
  return (
    <>
      <div>
        <label htmlFor="service" className="block text-sm font-medium mb-2">
          Serviço
        </label>
        <Select value={formData.service || ""} onValueChange={(value) => handleSelectChange(value, 'service')}>
          <SelectTrigger className="bg-white/20 border-urbana-gold/50">
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
        <label htmlFor="barber" className="block text-sm font-medium mb-2">
          Barbeiro Preferido
        </label>
        <Select value={formData.barber || "any"} onValueChange={(value) => handleSelectChange(value, 'barber')}>
          <SelectTrigger className="bg-white/20 border-urbana-gold/50">
            <SelectValue placeholder="Selecione um barbeiro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Qualquer Disponível</SelectItem>
            {barbers.map((barber) => (
              <SelectItem key={barber.id} value={barber.id || "no-id"}>{barber.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default ServiceSelection;
