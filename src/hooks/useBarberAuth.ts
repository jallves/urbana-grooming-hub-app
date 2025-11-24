
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface BarberData {
  id: string;
  nome: string;
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

      // Buscar barbeiro da tabela painel_barbeiros
      const { data: barberData, error } = await supabase
        .from('painel_barbeiros')
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
        nome: barberData.nome,
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
