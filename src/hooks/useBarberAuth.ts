
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
  const { user } = useAuth(); // Usa o AuthContext ao invés de verificar novamente

  useEffect(() => {
    // CRÍTICO: Só busca dados do barbeiro se houver usuário autenticado
    // NÃO faz navegação aqui - isso é responsabilidade do BarberRoute
    if (user?.email) {
      checkBarberAuth();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkBarberAuth = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      // Buscar barbeiro da tabela painel_barbeiros
      const { data: barberData, error } = await supabase
        .from('painel_barbeiros')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle(); // maybeSingle ao invés de single para não dar erro se não encontrar

      if (error) {
        console.error('Erro ao buscar barbeiro:', error);
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
        console.warn('Barbeiro não encontrado para:', user.email);
        setBarber(null);
      }
    } catch (error) {
      console.error('Erro ao verificar barbeiro:', error);
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
    checkBarberAuth,
    displayName: getFirstTwoNames()
  };
};
