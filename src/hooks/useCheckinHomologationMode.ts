import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SETTING_KEY = 'checkin_homologation_mode';

export const useCheckinHomologationMode = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSetting = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', SETTING_KEY)
        .maybeSingle();

      if (!error && data) {
        setIsEnabled(data.value === true || data.value === 'true');
      }
    } catch (err) {
      console.error('Erro ao buscar configuração de check-in:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleSetting = useCallback(async (newValue: boolean) => {
    try {
      const { error } = await supabase
        .from('settings')
        .update({ value: newValue, updated_at: new Date().toISOString() })
        .eq('key', SETTING_KEY);

      if (error) throw error;
      setIsEnabled(newValue);
      return true;
    } catch (err) {
      console.error('Erro ao atualizar configuração:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchSetting();
  }, [fetchSetting]);

  return { isEnabled, loading, toggleSetting, refetch: fetchSetting };
};
