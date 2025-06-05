
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
        console.log('Buscando barbeiros...');
        
        // Primeiro, vamos buscar TODOS os registros da tabela staff para debug
        const { data: allStaff, error: allError } = await supabase
          .from('staff')
          .select('*');

        if (allError) {
          console.error("Erro ao buscar todos os barbeiros:", allError);
        } else {
          console.log('Todos os barbeiros na base:', allStaff);
          console.log('Barbeiros ativos:', allStaff?.filter(s => s.is_active));
        }

        // Agora buscar apenas os ativos
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) {
          console.error("Erro ao buscar barbeiros ativos:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os barbeiros.",
            variant: "destructive",
          });
          return;
        }

        console.log('Barbeiros ativos encontrados:', data);
        
        if (data && data.length > 0) {
          setBarbers(data);
          toast({
            title: "Barbeiros carregados",
            description: `${data.length} barbeiro(s) encontrado(s).`,
          });
        } else {
          console.log('Nenhum barbeiro ativo encontrado');
          setBarbers([]);
          toast({
            title: "Aviso",
            description: "Nenhum barbeiro ativo encontrado. Verifique se há barbeiros cadastrados e ativos no sistema.",
            variant: "destructive",
          });
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
