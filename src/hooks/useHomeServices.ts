import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Status = 'loading' | 'success' | 'error';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  is_active?: boolean;
}

const defaultServices: Service[] = [
  {
    id: '1',
    name: 'Corte de Cabelo',
    description: 'Corte moderno e personalizado para seu estilo',
    price: 45.00,
    duration: 30,
    is_active: true
  },
  {
    id: '2',
    name: 'Barba',
    description: 'Aparar e modelar a barba com técnicas tradicionais',
    price: 35.00,
    duration: 20,
    is_active: true
  },
  {
    id: '3',
    name: 'Corte + Barba',
    description: 'Pacote completo de corte de cabelo e barba',
    price: 70.00,
    duration: 45,
    is_active: true
  }
];

export const useHomeServices = () => {
  const [status, setStatus] = useState<Status>('success');
  const [data, setData] = useState<Service[]>(defaultServices);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchServices = async () => {
      try {
        const { data: services, error: fetchError } = await supabase
          .from('services')
          .select('id, name, description, price, duration, is_active')
          .eq('is_active', true)
          .order('price', { ascending: true })
          .limit(6);

        if (!mounted) return;

        if (fetchError) {
          console.error('[Services] Erro ao carregar:', fetchError.message);
        } else if (services && services.length > 0) {
          console.log('[Services] ✅ Carregados:', services.length);
          setData(services);
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error('[Services] Exceção:', err?.message);
      }
    };

    fetchServices();

    const channel = supabase
      .channel('services_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services'
        },
        () => {
          if (mounted) fetchServices();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const refetch = async () => {
    try {
      const { data: services, error: fetchError } = await supabase
        .from('services')
        .select('id, name, description, price, duration, is_active')
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(6);

      if (fetchError) {
        console.error('[Services] Erro no refetch:', fetchError.message);
      } else if (services && services.length > 0) {
        setData(services);
      }
    } catch (err: any) {
      console.error('[Services] Exceção no refetch:', err?.message);
    }
  };

  return { status, data, error, refetch };
};
