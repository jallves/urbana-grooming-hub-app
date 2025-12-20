
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
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchServices();
    fetchStaff();
  }, [toast]);

  useEffect(() => {
    // Filtrar barbeiros quando o serviço for selecionado
    if (formData.service) {
      filterStaffByService(formData.service);
    } else {
      setFilteredStaff([]);
    }
  }, [formData.service]);
  
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_servicos')
        .select('*')
        .eq('is_active', true)
        .gt('preco', 0)
        .order('nome');

      if (error) throw error;
      
      const mappedServices = (data || []).map(s => ({
        id: s.id,
        name: s.nome,
        price: Number(s.preco),
        duration: s.duracao,
        description: s.descricao,
        is_active: s.is_active
      }));
      
      setServices(mappedServices);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast({
        title: "Erro ao carregar serviços",
        description: "Não foi possível carregar a lista de serviços. Por favor, tente novamente.",
        variant: "destructive",
      });
      setServices([]);
    }
  };

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('painel_barbeiros')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Erro ao carregar profissionais:', error);
      toast({
        title: "Erro ao carregar profissionais",
        description: "Não foi possível carregar a lista de profissionais. Por favor, tente novamente.",
        variant: "destructive",
      });
    } else {
      const mappedStaff = (data || []).map(b => ({
        id: b.id,
        name: b.nome,
        email: b.email,
        phone: b.telefone,
        image_url: b.image_url,
        specialties: b.specialties,
        experience: b.experience,
        commission_rate: b.commission_rate,
        is_active: b.is_active,
        role: b.role
      }));
      setStaff(mappedStaff);
    }
  };

  const filterStaffByService = async (serviceId: string) => {
    // No modelo unificado, todos os barbeiros podem fazer todos os serviços
    // Então simplesmente mostramos todos os barbeiros ativos
    setFilteredStaff(staff);
  };
  
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
        <Select 
          value={formData.barber || "any"} 
          onValueChange={(value) => handleSelectChange(value, 'barber')}
          disabled={!formData.service}
        >
          <SelectTrigger className="bg-white/20 border-urbana-gold/50">
            <SelectValue placeholder={
              !formData.service 
                ? "Selecione um serviço primeiro" 
                : filteredStaff.length === 0 
                  ? "Nenhum barbeiro disponível" 
                  : "Selecione um barbeiro"
            } />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Qualquer Disponível</SelectItem>
            {filteredStaff.map((member) => (
              <SelectItem key={member.id} value={member.id || "no-id"}>{member.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default ServiceSelection;
