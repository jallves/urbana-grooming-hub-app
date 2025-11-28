
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BarberData {
  id: string;
  nome: string;
  email: string;
  is_active: boolean;
}

export const useBarberAuth = () => {
  const [barber, setBarber] = useState<BarberData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.email) {
      fetchBarberData();
    } else {
      setLoading(false);
    }
  }, [user?.email]);

  const fetchBarberData = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      
      // Buscar barbeiro da tabela painel_barbeiros
      const { data: barberData, error } = await supabase
        .from('painel_barbeiros')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('[useBarberAuth] Erro ao buscar barbeiro:', error);
        setBarber(null);
        return;
      }

      if (barberData) {
        setBarber({
          id: barberData.id,
          nome: barberData.nome,
          email: barberData.email,
          is_active: barberData.is_active
        });
      } else {
        console.warn('[useBarberAuth] ⚠️ Barbeiro não encontrado na tabela painel_barbeiros');
        setBarber(null);
      }
    } catch (error) {
      console.error('[useBarberAuth] Erro na busca do barbeiro:', error);
      setBarber(null);
    } finally {
      setLoading(false);
    }
  };

  // Pega os dois primeiros nomes
  const getFirstTwoNames = () => {
    if (!barber?.nome) return 'Barbeiro';
    
    const nameParts = barber.nome.trim().split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0]} ${nameParts[1]}`;
    }
    return nameParts[0] || 'Barbeiro';
  };

  return {
    barber,
    loading,
    refetch: fetchBarberData,
    displayName: getFirstTwoNames()
  };
};
