
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
        console.log('Buscando todos os barbeiros para formulário de agendamento...');
        
        const { data, error } = await supabase
          .from('staff')
          .select('*')
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

        console.log('Todos os barbeiros encontrados:', data?.length || 0, data);
        
        if (data && data.length > 0) {
          setBarbers(data);
          console.log(`${data.length} barbeiro(s) carregado(s) com sucesso`);
        } else {
          console.log('Nenhum barbeiro encontrado no banco de dados');
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
