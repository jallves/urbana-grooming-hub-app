
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Service, StaffMember } from '@/types/appointment';

export const useAppointmentData = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<StaffMember[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error("Erro ao buscar serviços:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os serviços.",
            variant: "destructive",
          });
        }

        if (data) {
          setServices(data);
        }
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os serviços.",
          variant: "destructive",
        });
      }
    };

    fetchServices();
  }, [toast]);

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        console.log('Buscando barbeiros ativos...');
        
        // Buscar apenas barbeiros ativos da tabela staff
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) {
          console.error("Erro ao buscar barbeiros:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os barbeiros.",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          console.log('Barbeiros encontrados:', data);
          setBarbers(data);
        } else {
          console.log('Nenhum barbeiro encontrado');
          setBarbers([]);
        }
      } catch (error) {
        console.error("Erro ao buscar barbeiros:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os barbeiros.",
          variant: "destructive",
        });
        setBarbers([]);
      }
    };

    fetchBarbers();
  }, [toast]);

  return {
    services,
    barbers,
  };
};
