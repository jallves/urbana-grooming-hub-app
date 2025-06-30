import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/appointment';

interface Staff {
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
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (serviceError) throw serviceError;
        setServices(serviceData || []);

        // Buscar barbeiros da tabela staff
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true)
          .eq('role', 'barber') // filtrando apenas barbeiros
          .order('name', { ascending: true });

        if (staffError) throw staffError;
        setStaffList(staffData || []);
      } catch (error) {
        console.error('[useClientFormData] Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    services,
    staffList, // substitui barbers
    loading,
  };
}

