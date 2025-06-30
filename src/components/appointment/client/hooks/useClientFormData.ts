
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
      console.log('[useClientFormData] Iniciando busca de dados...');
      setLoading(true);
      
      try {
        // Buscar serviços
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (servicesError) {
          console.error('[useClientFormData] Erro ao buscar serviços:', servicesError);
        } else {
          console.log('[useClientFormData] Serviços carregados:', servicesData?.length || 0);
          setServices(servicesData || []);
        }

        // Buscar staff (da tabela correta 'staff', não 'barbers')
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (staffError) {
          console.error('[useClientFormData] Erro ao buscar staff:', staffError);
        } else {
          console.log('[useClientFormData] Staff carregado:', staffData?.length || 0, staffData);
          setStaffList(staffData || []);
        }

      } catch (error) {
        console.error('[useClientFormData] Erro geral ao buscar dados:', error);
      } finally {
        setLoading(false);
        console.log('[useClientFormData] Busca finalizada');
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
