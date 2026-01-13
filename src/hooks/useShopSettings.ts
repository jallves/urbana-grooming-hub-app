
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Tipo para configurações da loja
export interface ShopSettings {
  id?: string;
  shop_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  opening_hours?: string;
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
            shop_name: 'Barbearia',
            address: '',
            phone: '',
            email: '',
            whatsapp: '',
            opening_hours: 'Seg-Sáb: 08:00-20:00, Dom: 09:00-13:00'
          });
        }
      } catch (err) {
        console.error('Error fetching shop settings:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        
        // Usar configurações padrão em caso de erro
        setShopSettings({
          shop_name: 'Barbearia',
          opening_hours: 'Seg-Sáb: 08:00-20:00'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShopSettings();
  }, [toast]);

  return { shopSettings, loading, error };
};
