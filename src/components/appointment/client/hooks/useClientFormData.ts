
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service, StaffMember } from '@/types/appointment';

export const useClientFormData = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (servicesError) {
          console.error('Error fetching services:', servicesError);
          throw servicesError;
        }

        // Fetch barbers
        const { data: barbersData, error: barbersError } = await supabase
          .from('barbers')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (barbersError) {
          console.error('Error fetching barbers:', barbersError);
          throw barbersError;
        }

        console.log('[useClientFormData] Loaded data:', {
          services: servicesData?.length || 0,
          barbers: barbersData?.length || 0
        });

        setServices(servicesData || []);
        setBarbers(barbersData || []);
      } catch (error) {
        console.error('[useClientFormData] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    services,
    barbers,
    loading
  };
};
