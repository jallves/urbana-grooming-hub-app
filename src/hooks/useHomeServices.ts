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

export const useHomeServices = () => {
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchServices = async () => {
      try {
        // Busca serviços do painel_servicos com exibir_home = true (coluna existente)
        const { data: services, error: fetchError } = await supabase
          .from('painel_servicos')
          .select('id, nome, descricao, preco, duracao, is_active, exibir_home')
          .eq('is_active', true)
          .eq('exibir_home', true)
          .order('nome', { ascending: true });

        if (!mounted) return;

        if (fetchError) {
          console.error('[Services] Erro ao carregar:', fetchError.message);
          setStatus('error');
          setError(fetchError.message);
        } else {
          console.log('[Services] ✅ Carregados (exibir_home):', services?.length || 0);
          const mappedServices: Service[] = (services || []).map(s => ({
            id: s.id,
            name: s.nome,
            description: s.descricao,
            price: Number(s.preco),
            duration: s.duracao,
            is_active: s.is_active
          }));
          setData(mappedServices);
          setStatus('success');
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error('[Services] Exceção:', err?.message);
      }
    };

    fetchServices();

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
        .select('id, nome, descricao, preco, duracao, is_active, exibir_home')
        .eq('is_active', true)
        .eq('exibir_home', true)
        .order('nome', { ascending: true });

      if (fetchError) {
        console.error('[Services] Erro no refetch:', fetchError.message);
      } else {
        const mappedServices: Service[] = (services || []).map(s => ({
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
