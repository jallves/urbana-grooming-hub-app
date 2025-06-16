
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBarberRoleCheck = () => {
  const [checkingRole, setCheckingRole] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkBarberRole = async (userId: string) => {
    setCheckingRole(true);
    
    try {
      console.log('[useBarberRoleCheck] Verificando permissões para usuário:', userId);
      
      const { data: staffData, error } = await supabase
        .from('staff')
        .select('*')
        .eq('email', (await supabase.auth.getUser()).data.user?.email)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('[useBarberRoleCheck] Erro ao verificar staff:', error);
        throw new Error('Usuário não autorizado como barbeiro');
      }

      if (!staffData) {
        throw new Error('Usuário não encontrado na equipe');
      }

      console.log('[useBarberRoleCheck] Barbeiro autorizado:', staffData);
      
      toast({
        title: "Acesso autorizado",
        description: `Bem-vindo, ${staffData.name}!`,
      });

      navigate('/barbeiro/dashboard');
      
    } catch (error: any) {
      console.error('[useBarberRoleCheck] Erro na verificação:', error);
      
      toast({
        title: "Acesso negado",
        description: error.message || "Você não tem permissão para acessar o painel do barbeiro",
        variant: "destructive",
      });
      
      // Fazer logout se não autorizado
      await supabase.auth.signOut();
      navigate('/barbeiro/login');
    } finally {
      setCheckingRole(false);
    }
  };

  return {
    checkingRole,
    checkBarberRole,
  };
};
