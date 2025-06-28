
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

export const useClientFormData = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      console.log('[useClientFormData] Iniciando carregamento de dados...');
      setLoading(true);
      
      try {
        // Carregar serviços
        console.log('[useClientFormData] Carregando serviços...');
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (servicesError) {
          console.error('[useClientFormData] Erro nos serviços:', servicesError);
          throw new Error(`Erro ao carregar serviços: ${servicesError.message}`);
        }

        console.log('[useClientFormData] Serviços carregados:', servicesData?.length || 0);
        setServices(servicesData || []);

        // Carregar barbeiros da tabela correta
        console.log('[useClientFormData] Carregando barbeiros da tabela barbers...');
        const { data: barbersData, error: barbersError } = await supabase
          .from('barbers')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (barbersError) {
          console.error('[useClientFormData] Erro nos barbeiros:', barbersError);
          throw new Error(`Erro ao carregar barbeiros: ${barbersError.message}`);
        }

        console.log('[useClientFormData] Barbeiros carregados:', barbersData?.length || 0);
        barbersData?.forEach((barber, index) => {
          console.log(`[useClientFormData] Barbeiro ${index + 1}:`, {
            id: barber.id,
            name: barber.name,
            is_active: barber.is_active,
            specialties: barber.specialties
          });
        });
        setBarbers(barbersData || []);

      } catch (error: any) {
        console.error('[useClientFormData] Erro:', error);
        toast({
          title: "Erro ao carregar dados",
          description: error.message || "Não foi possível carregar os dados. Por favor, recarregue a página.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  return {
    services,
    barbers,
    loading
  };
};
