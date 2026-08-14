
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export type BusinessHours = Record<number, DayHours>;

export const DAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
};

export const DAY_SHORT_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  0: { open: '09:00', close: '13:00', closed: true },
  1: { open: '08:00', close: '20:00', closed: false },
  2: { open: '08:00', close: '20:00', closed: false },
  3: { open: '08:00', close: '20:00', closed: false },
  4: { open: '08:00', close: '20:00', closed: false },
  5: { open: '08:00', close: '20:00', closed: false },
  6: { open: '08:00', close: '20:00', closed: false },
};

// Tipo para configurações da loja
export interface ShopSettings {
  id?: string;
  shop_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  opening_hours?: string;
  business_hours?: BusinessHours;
  instagram?: string;
  facebook?: string;
  logo_url?: string;
  social_instagram?: string;
  social_facebook?: string;
  social_twitter?: string;
}

export const useShopSettings = () => {
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchShopSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Usar tabela settings com key 'shop_settings'
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'shop_settings')
          .maybeSingle();

        if (error) throw error;
        
        // Extrair valor do JSON
        if (data?.value && typeof data.value === 'object') {
          setShopSettings(data.value as ShopSettings);
        } else {
          // Configurações padrão
          setShopSettings({
            shop_name: 'Barbearia Costa Urbana',
            address: '',
            phone: '',
            email: '',
            whatsapp: '',
            business_hours: DEFAULT_BUSINESS_HOURS,
          });
        }
      } catch (err) {
        console.error('Error fetching shop settings:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        
        // Usar configurações padrão em caso de erro
        setShopSettings({
          shop_name: 'Barbearia Costa Urbana',
          business_hours: DEFAULT_BUSINESS_HOURS,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShopSettings();

    const channel = supabase
      .channel('shop-settings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings', filter: 'key=eq.shop_settings' },
        () => fetchShopSettings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return { shopSettings, loading, error };
};

/** Agrupa dias consecutivos com o mesmo horário para exibição no site */
export const groupBusinessHours = (hours?: BusinessHours) => {
  const source = { ...DEFAULT_BUSINESS_HOURS, ...(hours || {}) };
  const order = [1, 2, 3, 4, 5, 6, 0];
  const groups: { label: string; value: string }[] = [];

  let startIdx = 0;
  const keyOf = (d: number) => {
    const c = source[d];
    return c?.closed ? 'closed' : `${c?.open}-${c?.close}`;
  };

  for (let i = 0; i <= order.length; i++) {
    if (i < order.length && keyOf(order[i]) === keyOf(order[startIdx])) continue;
    const first = order[startIdx];
    const last = order[i - 1];
    const cfg = source[first];
    groups.push({
      label:
        first === last
          ? DAY_SHORT_LABELS[first]
          : `${DAY_SHORT_LABELS[first]} - ${DAY_SHORT_LABELS[last]}`,
      value: cfg?.closed ? 'Fechado' : `${cfg.open} - ${cfg.close}`,
    });
    startIdx = i;
  }

  return groups;
};
