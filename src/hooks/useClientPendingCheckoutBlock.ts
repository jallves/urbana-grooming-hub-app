import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PendingCheckoutItem {
  id: string;
  data: string;
  hora: string;
  servico_nome?: string;
  barbeiro_nome?: string;
  preco?: number;
  diasPendente: number;
}

export interface ClientPendingCheckoutBlock {
  loading: boolean;
  blocked: boolean;
  count: number;
  oldestDays: number;
  items: PendingCheckoutItem[];
  refresh: () => Promise<void>;
}

const BLOCK_THRESHOLD_DAYS = 15;

/**
 * Detecta checkouts pendentes (status_totem='CHEGOU') do cliente.
 * Se algum estiver com mais de 15 dias, o cliente fica bloqueado
 * para novos agendamentos até resolver no totem/recepção.
 */
export const useClientPendingCheckoutBlock = (clienteId?: string): ClientPendingCheckoutBlock => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PendingCheckoutItem[]>([]);

  const load = useCallback(async () => {
    if (!clienteId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          id, data, hora, status_totem,
          painel_servicos(nome, preco),
          painel_barbeiros(nome)
        `)
        .eq('cliente_id', clienteId)
        .eq('status_totem', 'CHEGOU');

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mapped: PendingCheckoutItem[] = (data || []).map((a: any) => {
        const [y, m, d] = a.data.split('-').map(Number);
        const aptDate = new Date(y, m - 1, d);
        const diffMs = today.getTime() - aptDate.getTime();
        const diasPendente = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        return {
          id: a.id,
          data: a.data,
          hora: a.hora,
          servico_nome: a.painel_servicos?.nome,
          barbeiro_nome: a.painel_barbeiros?.nome,
          preco: a.painel_servicos?.preco,
          diasPendente,
        };
      });

      setItems(mapped);
    } catch (err) {
      console.error('[useClientPendingCheckoutBlock] erro:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    load();
  }, [load]);

  const oldestDays = items.reduce((max, it) => Math.max(max, it.diasPendente), 0);
  const blocked = items.some((it) => it.diasPendente >= BLOCK_THRESHOLD_DAYS);

  return {
    loading,
    blocked,
    count: items.length,
    oldestDays,
    items,
    refresh: load,
  };
};

export const PENDING_CHECKOUT_BLOCK_DAYS = BLOCK_THRESHOLD_DAYS;