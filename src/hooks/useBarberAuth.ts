
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface BarberData {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

export const useBarberAuth = () => {
  const [barber, setBarber] = useState<BarberData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkBarberAuth();
  }, []);

  const checkBarberAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/barbeiro/login');
        return;
      }

      // Buscar barbeiro da tabela barbers
      const { data: barberData, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true)
        .single();

      if (error || !barberData) {
        console.error('Erro ao verificar barbeiro:', error);
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar o painel do barbeiro",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate('/barbeiro/login');
        return;
      }

      setBarber({
        id: barberData.id,
        name: barberData.name,
        email: barberData.email,
        is_active: barberData.is_active
      });
    } catch (error) {
      console.error('Erro na autenticação do barbeiro:', error);
      navigate('/barbeiro/login');
    } finally {
      setLoading(false);
    }
  };

  return {
    barber,
    loading,
    checkBarberAuth
  };
};
