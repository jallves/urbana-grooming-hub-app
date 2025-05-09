
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShopSettings } from '@/types/settings';
import { useToast } from '@/hooks/use-toast';

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
        
        const { data, error } = await supabase
          .from('shop_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        
        setShopSettings(data);
      } catch (err) {
        console.error('Error fetching shop settings:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        
        // Only show toast in admin section
        if (window.location.pathname.includes('/admin')) {
          toast({
            title: "Erro ao carregar configurações",
            description: "Não foi possível carregar as configurações da barbearia",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShopSettings();
  }, [toast]);

  return { shopSettings, loading, error };
};
