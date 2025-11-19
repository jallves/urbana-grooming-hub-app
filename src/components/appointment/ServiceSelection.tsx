
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
      // Buscar apenas serviços com preço > 0 e que tenham barbeiros vinculados
      const { data: servicesWithStaff, error: staffError } = await supabase
        .from('service_staff')
        .select('service_id');

      if (staffError) throw staffError;

      const serviceIdsWithStaff = [...new Set(servicesWithStaff?.map(s => s.service_id) || [])];

      if (serviceIdsWithStaff.length === 0) {
        setServices([]);
        return;
      }

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .gt('price', 0)
        .in('id', serviceIdsWithStaff)
        .order('name');

      if (error) throw error;
      setServices(data || []);
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
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .eq('role', 'barber');

    if (error) {
      console.error('Erro ao carregar profissionais:', error);
      toast({
        title: "Erro ao carregar profissionais",
        description: "Não foi possível carregar a lista de profissionais. Por favor, tente novamente.",
        variant: "destructive",
      });
    } else {
      setStaff(data || []);
    }
  };

  const filterStaffByService = async (serviceId: string) => {
    try {
      // Buscar barbeiros vinculados ao serviço
      const { data: serviceStaff, error } = await supabase
        .from('service_staff')
        .select('staff_id')
        .eq('service_id', serviceId);

      if (error) {
        console.error('Erro ao filtrar barbeiros:', error);
        setFilteredStaff([]);
        return;
      }

      if (!serviceStaff || serviceStaff.length === 0) {
        setFilteredStaff([]);
        return;
      }

      const linkedStaffIds = serviceStaff.map(s => s.staff_id);
      const filtered = staff.filter(s => linkedStaffIds.includes(s.id));
      setFilteredStaff(filtered);
    } catch (error) {
      console.error('Erro ao filtrar barbeiros:', error);
      setFilteredStaff([]);
    }
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
        {formData.service && filteredStaff.length === 0 && (
          <p className="text-xs text-yellow-600 mt-1">
            Este serviço ainda não tem barbeiros vinculados.
          </p>
        )}
      </div>
    </>
  );
};

export default ServiceSelection;
