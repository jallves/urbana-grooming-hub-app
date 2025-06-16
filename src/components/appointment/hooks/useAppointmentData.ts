
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Service } from '@/types/appointment';
import { Barber } from '@/types/barber';

export const useAppointmentData = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        console.log('[useAppointmentData] Iniciando busca de dados...');
        
        // Buscar serviços ativos
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (servicesError) {
          console.error('Erro ao buscar serviços:', servicesError);
          throw servicesError;
        }

        console.log('[useAppointmentData] Serviços encontrados:', servicesData?.length || 0);

        // Buscar barbeiros ativos da tabela staff
        const { data: barbersData, error: barbersError } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true)
          .eq('role', 'barber')
          .order('name', { ascending: true });

        if (barbersError) {
          console.error('Erro ao buscar barbeiros:', barbersError);
          throw barbersError;
        }

        console.log('[useAppointmentData] Barbeiros encontrados:', barbersData?.length || 0);

        // Sempre atualizar os estados com os dados recebidos (mesmo que seja array vazio)
        setServices(servicesData || []);
        setBarbers(barbersData || []);

        console.log('[useAppointmentData] Dados carregados com sucesso:', {
          services: servicesData?.length || 0,
          barbers: barbersData?.length || 0
        });
        
      } catch (error: any) {
        console.error('Erro ao carregar dados:', error);
        
        // Em caso de erro, ainda deixar arrays vazios para que o formulário apareça
        setServices([]);
        setBarbers([]);
        
        // Só mostrar toast para erros que não sejam de permissão (que são esperados)
        if (!error.message?.includes('permission denied')) {
          toast({
            title: "Erro ao carregar dados",
            description: error.message || "Não foi possível carregar os dados necessários.",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  console.log('[useAppointmentData] Retornando dados:', {
    servicesCount: services.length,
    barbersCount: barbers.length,
    loading
  });

  return {
    services,
    barbers,
    loading,
  };
};
