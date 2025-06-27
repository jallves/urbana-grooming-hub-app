
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
      console.log('[useClientFormData] Loading appointment data...');
      setLoading(true);
      
      try {
        // Load services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (servicesError) {
          throw new Error(`Error loading services: ${servicesError.message}`);
        }

        console.log('[useClientFormData] Services loaded:', servicesData?.length || 0);
        setServices(servicesData || []);

        // Load barbers
        const { data: barbersData, error: barbersError } = await supabase
          .from('barbers')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (barbersError) {
          throw new Error(`Error loading barbers: ${barbersError.message}`);
        }

        console.log('[useClientFormData] Barbers loaded:', barbersData?.length || 0);
        setBarbers(barbersData || []);

      } catch (error) {
        console.error('[useClientFormData] Error:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados necessários.",
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
