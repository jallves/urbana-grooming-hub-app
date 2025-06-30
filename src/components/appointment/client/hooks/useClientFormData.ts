
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

        // Carregar barbeiros - vamos tentar diferentes abordagens
        console.log('[useClientFormData] Carregando barbeiros...');
        
        // Primeira tentativa: consulta simples sem filtros
        console.log('[useClientFormData] Tentativa 1: Consulta sem filtros');
        const { data: allBarbersData, error: allBarbersError } = await supabase
          .from('barbers')
          .select('*');

        console.log('[useClientFormData] Resultado consulta sem filtros:', {
          data: allBarbersData,
          error: allBarbersError,
          count: allBarbersData?.length || 0
        });

        if (allBarbersError) {
          console.error('[useClientFormData] Erro na consulta sem filtros:', allBarbersError);
        }

        // Segunda tentativa: consulta apenas barbeiros ativos
        console.log('[useClientFormData] Tentativa 2: Consulta apenas ativos');
        const { data: activeBarbersData, error: activeBarbersError } = await supabase
          .from('barbers')
          .select('*')
          .eq('is_active', true);

        console.log('[useClientFormData] Resultado consulta ativos:', {
          data: activeBarbersData,
          error: activeBarbersError,
          count: activeBarbersData?.length || 0
        });

        if (activeBarbersError) {
          console.error('[useClientFormData] Erro na consulta ativos:', activeBarbersError);
        }

        // Terceira tentativa: verificar se existem registros na tabela
        console.log('[useClientFormData] Tentativa 3: Contagem total');
        const { count, error: countError } = await supabase
          .from('barbers')
          .select('*', { count: 'exact', head: true });

        console.log('[useClientFormData] Contagem total barbeiros:', {
          count,
          error: countError
        });

        // Usar os dados da consulta que funcionou
        let finalBarbersData = activeBarbersData || allBarbersData || [];
        
        console.log('[useClientFormData] Dados finais dos barbeiros:', {
          count: finalBarbersData.length,
          barbers: finalBarbersData
        });

        if (finalBarbersData && finalBarbersData.length > 0) {
          finalBarbersData.forEach((barber, index) => {
            console.log(`[useClientFormData] Barbeiro ${index + 1}:`, {
              id: barber.id,
              name: barber.name,
              is_active: barber.is_active,
              specialties: barber.specialties
            });
          });
        } else {
          console.warn('[useClientFormData] Nenhum barbeiro encontrado na tabela barbers');
          
          // Verificar se é problema de RLS
          console.log('[useClientFormData] Verificando políticas RLS...');
          const { data: rlsTest, error: rlsError } = await supabase
            .rpc('get_available_barbers', {
              p_service_id: null,
              p_date: new Date().toISOString().split('T')[0],
              p_time: '09:00:00',
              p_duration: 60
            });
          
          console.log('[useClientFormData] Teste RLS function:', {
            data: rlsTest,
            error: rlsError
          });
        }

        setBarbers(finalBarbersData || []);

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
