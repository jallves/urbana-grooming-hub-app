
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
          toast({
            title: "Erro ao carregar serviços",
            description: "Não foi possível carregar os serviços.",
            variant: "destructive",
          });
        } else {
          console.log('[useAppointmentData] Serviços encontrados:', servicesData?.length || 0);
          setServices(servicesData || []);
        }

        // Buscar barbeiros da tabela barbers
        const { data: barbersData, error: barbersError } = await supabase
          .from('barbers')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (barbersError) {
          console.error('Erro ao buscar barbeiros:', barbersError);
          toast({
            title: "Erro ao carregar barbeiros",
            description: "Não foi possível carregar os barbeiros.",
            variant: "destructive",
          });
        } else {
          console.log('[useAppointmentData] Barbeiros encontrados:', barbersData?.length || 0);
          console.log('[useAppointmentData] Dados dos barbeiros:', barbersData);
          setBarbers(barbersData || []);
          
          // Se não há barbeiros, mostrar erro específico
          if (!barbersData || barbersData.length === 0) {
            toast({
              title: "Nenhum barbeiro disponível",
              description: "Verifique se há barbeiros cadastrados com role 'barber' e is_active = true.",
              variant: "destructive",
            });
          }
        }

        console.log('[useAppointmentData] Dados finais carregados:', {
          services: servicesData?.length || 0,
          barbers: barbersData?.length || 0
        });
        
      } catch (error: any) {
        console.error('Erro geral ao carregar dados:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados necessários.",
          variant: "destructive",
        });
        // Manter arrays vazios para o formulário aparecer
        setServices([]);
        setBarbers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

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
