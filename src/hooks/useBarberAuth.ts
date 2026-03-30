
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BarberData {
  id: string;
  nome: string;
  email: string;
  is_active: boolean;
  is_barber_admin: boolean;
}

export const useBarberAuth = () => {
  const [barber, setBarber] = useState<BarberData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
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
      const { data: barberData, error } = await supabase
        .from('painel_barbeiros')
        .select('id, nome, email, is_active, is_barber_admin')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle();

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
          is_active: barberData.is_active,
          is_barber_admin: barberData.is_barber_admin || false,
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
    displayName: getFirstTwoNames(),
    isBarberAdmin: barber?.is_barber_admin || false,
  };
};
