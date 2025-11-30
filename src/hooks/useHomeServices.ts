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
        // Busca serviços do painel_servicos com show_on_home = true
        const { data: services, error: fetchError } = await supabase
          .from('painel_servicos')
          .select('id, nome, descricao, preco, duracao, is_active, show_on_home')
          .eq('is_active', true)
          .eq('show_on_home', true)
          .order('display_order', { ascending: true })
          .limit(6);

        if (!mounted) return;

        if (fetchError) {
          console.error('[Services] Erro ao carregar:', fetchError.message);
        } else if (services && services.length > 0) {
          console.log('[Services] ✅ Carregados (show_on_home):', services.length);
          // Mapeia os campos do painel_servicos para o formato esperado
          const mappedServices: Service[] = services.map(s => ({
            id: s.id,
            name: s.nome,
            description: s.descricao,
            price: Number(s.preco),
            duration: s.duracao,
            is_active: s.is_active
          }));
          setData(mappedServices);
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error('[Services] Exceção:', err?.message);
      }
    };

    fetchServices();

    // Realtime updates para painel_servicos
    const channel = supabase
      .channel('painel_servicos_home_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'painel_servicos'
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
        .from('painel_servicos')
        .select('id, nome, descricao, preco, duracao, is_active, show_on_home')
        .eq('is_active', true)
        .eq('show_on_home', true)
        .order('display_order', { ascending: true })
        .limit(6);

      if (fetchError) {
        console.error('[Services] Erro no refetch:', fetchError.message);
      } else if (services && services.length > 0) {
        const mappedServices: Service[] = services.map(s => ({
          id: s.id,
          name: s.nome,
          description: s.descricao,
          price: Number(s.preco),
          duration: s.duracao,
          is_active: s.is_active
        }));
        setData(mappedServices);
      }
    } catch (err: any) {
      console.error('[Services] Exceção no refetch:', err?.message);
    }
  };

  return { status, data, error, refetch };
};
