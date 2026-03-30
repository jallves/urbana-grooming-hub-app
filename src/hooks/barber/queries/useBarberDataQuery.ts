import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BarberData {
  id: string;
  staff_id: string;
  commission_rate: number;
  is_barber_admin: boolean;
}

export const useBarberDataQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['barber-data', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;

      const { data } = await supabase
        .from('painel_barbeiros')
        .select('id, staff_id, commission_rate, is_barber_admin')
        .eq('email', user.email)
        .maybeSingle();

      return data as BarberData | null;
    },
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
