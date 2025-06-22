
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface BarberData {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  barber_id?: string;
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

      // Buscar barbeiro através do relacionamento barbers -> staff
      const { data: barberData, error } = await supabase
        .from('barbers')
        .select(`
          id,
          staff_id,
          staff:staff_id (
            id,
            name,
            email,
            is_active
          )
        `)
        .eq('staff.email', user.email)
        .eq('staff.is_active', true)
        .single();

      if (error || !barberData || !barberData.staff) {
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
        id: barberData.staff.id,
        name: barberData.staff.name,
        email: barberData.staff.email,
        is_active: barberData.staff.is_active,
        barber_id: barberData.id
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
