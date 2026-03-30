
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BarberData {
  id: string;
  staff_id: string;
  commission_rate: number;
}

export const useBarberData = (overrideBarberId?: string) => {
  const { user } = useAuth();
  const [barberData, setBarberData] = useState<BarberData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBarberData = async () => {
      try {
        if (overrideBarberId) {
          // Fetch data for a specific barber (barber admin use case)
          const { data } = await supabase
            .from('painel_barbeiros')
            .select('id, staff_id, commission_rate')
            .eq('id', overrideBarberId)
            .maybeSingle();

          if (data) setBarberData(data);
        } else if (user?.email) {
          const { data } = await supabase
            .from('painel_barbeiros')
            .select('id, staff_id, commission_rate')
            .eq('email', user.email)
            .maybeSingle();

          if (data) setBarberData(data);
        }
      } catch (error) {
        console.error('Error fetching barber data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBarberData();
  }, [user?.email, overrideBarberId]);

  return { barberData, isLoading };
};
