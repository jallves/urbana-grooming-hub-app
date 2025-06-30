
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

        // Carregar barbeiros com consulta simplificada
        console.log('[useClientFormData] Carregando barbeiros...');
        const { data: barbersData, error: barbersError } = await supabase
          .from('barbers')
          .select(`
            id,
            name,
            email,
            phone,
            image_url,
            specialties,
            experience,
            role,
            is_active,
            commission_rate,
            created_at,
            updated_at
          `)
          .eq('is_active', true)
          .order('name');

        console.log('[useClientFormData] Resultado consulta barbeiros:', {
          data: barbersData,
          error: barbersError,
          count: barbersData?.length || 0
        });

        if (barbersError) {
          console.error('[useClientFormData] Erro ao carregar barbeiros:', barbersError);
          // Não interromper o carregamento por erro de barbeiros
          console.warn('[useClientFormData] Continuando sem barbeiros devido ao erro');
          setBarbers([]);
        } else {
          console.log('[useClientFormData] Barbeiros carregados com sucesso:', barbersData?.length || 0);
          setBarbers(barbersData || []);
        }

      } catch (error: any) {
        console.error('[useClientFormData] Erro geral:', error);
        toast({
          title: "Erro ao carregar dados",
          description: error.message || "Não foi possível carregar os dados. Por favor, recarregue a página.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        console.log('[useClientFormData] Carregamento finalizado');
      }
    };

    loadData();
  }, [toast]);

  console.log('[useClientFormData] Estado atual:', {
    loading,
    servicesCount: services.length,
    barbersCount: barbers.length,
    services: services.map(s => ({ id: s.id, name: s.name })),
    barbers: barbers.map(b => ({ id: b.id, name: b.name, is_active: b.is_active }))
  });

  return {
    services,
    barbers,
    loading
  };
};
