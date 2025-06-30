import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/appointment';

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  image_url: string;
  specialties: string;
  experience: string;
  role: string;
  is_active: boolean;
}

export function useClientFormData() {
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar serviços
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (servicesError) {
          console.error('Erro ao buscar serviços:', servicesError);
        } else {
          setServices(servicesData || []);
        }

        // Buscar staff (antigo barbeiros)
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (staffError) {
          console.error('Erro ao buscar staff:', staffError);
        } else {
          setStaffList(staffData || []);
        }

      } catch (error) {
        console.error('Erro ao buscar dados do formulário:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    services,
    staffList,
    loading
  };
}
