import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BarberOption {
  id: string;
  nome: string;
  email: string;
  is_active: boolean;
}

export const useAllBarbersQuery = (enabled: boolean) => {
  return useQuery({
    queryKey: ['all-barbers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('painel_barbeiros')
        .select('id, nome, email, is_active')
        .eq('is_active', true)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar barbeiros:', error);
        return [];
      }

      return (data || []) as BarberOption[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};
