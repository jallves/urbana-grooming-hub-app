
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

        console.log('[useAppointmentData] Dados carregados:', {
          services: servicesData,
          barbers: barbersData
        });

        setServices(servicesData || []);
        setBarbers(barbersData || []);
      } catch (error: any) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: "Erro ao carregar dados",
          description: error.message || "Não foi possível carregar os dados necessários.",
          variant: "destructive",
        });
        setServices([]);
        setBarbers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  return {
    services,
    barbers,
    loading,
  };
};
