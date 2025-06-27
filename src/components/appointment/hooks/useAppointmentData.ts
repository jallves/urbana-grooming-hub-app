
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/appointment';
import { useToast } from '@/hooks/use-toast';

interface Barber {
  id: string;
  name: string;
  email: string;
  phone: string;
  image_url: string;
  specialties: string;
  experience: string;
  role: string;
  is_active: boolean;
  commission_rate: number;
  created_at: string;
  updated_at: string;
}

export const useAppointmentData = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      console.log('[useAppointmentData] Iniciando carregamento de dados...');
      setLoading(true);
      
      try {
        // Carregar serviços
        console.log('[useAppointmentData] Carregando serviços...');
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (servicesError) {
          console.error('[useAppointmentData] Erro ao carregar serviços:', servicesError);
          throw new Error(`Erro ao carregar serviços: ${servicesError.message}`);
        }

        console.log('[useAppointmentData] Serviços carregados:', servicesData?.length || 0);
        setServices(servicesData || []);

        // Carregar barbeiros da tabela 'barbers'
        console.log('[useAppointmentData] Carregando barbeiros...');
        const { data: barbersData, error: barbersError } = await supabase
          .from('barbers')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (barbersError) {
          console.error('[useAppointmentData] Erro ao carregar barbeiros:', barbersError);
          throw new Error(`Erro ao carregar barbeiros: ${barbersError.message}`);
        }

        console.log('[useAppointmentData] Barbeiros carregados:', barbersData?.length || 0);
        setBarbers(barbersData || []);

      } catch (error) {
        console.error('[useAppointmentData] Erro geral:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados necessários. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  console.log('[useAppointmentData] Estado atual:', {
    loading,
    servicesCount: services.length,
    barbersCount: barbers.length
  });

  return {
    services,
    barbers,
    loading
  };
};
