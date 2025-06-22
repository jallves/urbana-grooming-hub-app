
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
        
        // Buscar serviços
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (servicesError) {
          console.error('Erro ao buscar serviços:', servicesError);
        } else {
          console.log('[useAppointmentData] Serviços encontrados:', servicesData?.length || 0);
          setServices(servicesData || []);
        }

        // Buscar barbeiros da tabela barbers
        const { data: barbersData, error: barbersError } = await supabase
          .from('barbers')
          .select('*')
          .eq('is_active', true)
          .eq('role', 'barber')
          .order('name', { ascending: true });

        if (barbersError) {
          console.error('Erro ao buscar barbeiros:', barbersError);
        } else {
          console.log('[useAppointmentData] Barbeiros encontrados:', barbersData?.length || 0);
          setBarbers(barbersData || []);
        }

        console.log('[useAppointmentData] Dados finais carregados:', {
          services: servicesData?.length || 0,
          barbers: barbersData?.length || 0
        });
        
      } catch (error: any) {
        console.error('Erro geral ao carregar dados:', error);
        // Mesmo com erro, manter arrays vazios para o formulário aparecer
        setServices([]);
        setBarbers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  console.log('[useAppointmentData] Hook retornando:', {
    servicesCount: services.length,
    barbersCount: barbers.length,
    loading,
    services: services.slice(0, 2), // Debug dos primeiros itens
    barbers: barbers.slice(0, 2)
  });

  return {
    services,
    barbers,
    loading,
  };
};
