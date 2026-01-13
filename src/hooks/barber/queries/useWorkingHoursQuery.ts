import { useQuery } from '@tanstack/react-query';
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
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

// Time off query - using barber_availability table instead of non-existent time_off table
export const useTimeOffQuery = (staffId: string | null) => {
  return useQuery({
    queryKey: ['time-off', staffId],
    queryFn: async () => {
      if (!staffId) return [];

      // Use barber_availability with is_available = false as time off
      const { data } = await supabase
        .from('barber_availability')
        .select('*')
        .eq('barber_id', staffId)
        .eq('is_available', false)
        .order('date', { ascending: false });

      return data || [];
    },
    enabled: !!staffId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};