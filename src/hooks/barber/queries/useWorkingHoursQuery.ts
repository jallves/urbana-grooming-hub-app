import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useWorkingHoursQuery = (staffId: string | null) => {
  return useQuery({
    queryKey: ['working-hours', staffId],
    queryFn: async () => {
      if (!staffId) return [];

      const { data } = await supabase
        .from('working_hours')
        .select('*')
        .eq('staff_id', staffId)
        .order('day_of_week', { ascending: true });

      return data || [];
    },
    enabled: !!staffId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000,
  });
};

export const useTimeOffQuery = (staffId: string | null) => {
  return useQuery({
    queryKey: ['time-off', staffId],
    queryFn: async () => {
      if (!staffId) return [];

      const { data } = await supabase
        .from('time_off')
        .select('*')
        .eq('staff_id', staffId)
        .order('start_date', { ascending: false });

      return data || [];
    },
    enabled: !!staffId,
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 10 * 60 * 1000,
  });
};
