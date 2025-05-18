
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useBarberRoleCheck = () => {
  const [checkingRole, setCheckingRole] = useState<boolean>(false);
  const { isAdmin, isBarber } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkBarberRole = async (userId: string): Promise<void> => {
    console.log('useBarberRoleCheck - Checking barber role for user ID:', userId);
    
    try {
      setCheckingRole(true);
      
      // If user is admin, redirect to admin dashboard
      if (isAdmin) {
        console.log('useBarberRoleCheck - User is admin, redirecting to admin dashboard');
        toast({
          title: 'Login realizado com sucesso',
          description: 'Redirecionando para o painel administrativo',
        });
        navigate('/admin');
        return;
      }

      // If user is a barber, they can access the barber dashboard
      if (isBarber) {
        console.log('useBarberRoleCheck - User is barber, redirecting to barber dashboard');
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo ao painel do barbeiro',
        });
        navigate('/barbeiro/dashboard');
        return;
      }
      
      // Get user email for special check
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.email === 'jhoaoallves84@gmail.com') {
        console.log('useBarberRoleCheck - Special barber detected, allowing access');
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo ao painel do barbeiro',
        });
        
        // Ensure user has barber role in database
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId)
          .eq('role', 'barber');
        
        if (!existingRole || existingRole.length === 0) {
          // Add barber role
          await supabase
            .from('user_roles')
            .insert([{ user_id: userId, role: 'barber' }]);
        }
        
        navigate('/barbeiro/dashboard');
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'barber');
      
      if (error) {
        console.error('useBarberRoleCheck - Erro ao verificar função do barbeiro:', error);
        toast({
          title: 'Erro de verificação',
          description: 'Não foi possível verificar seu papel no sistema',
          variant: 'destructive',
        });
        return;
      }
      
      // If user has barber role, redirect to barber dashboard
      if (data && data.length > 0) {
        console.log('useBarberRoleCheck - User has barber role, redirecting to barber dashboard');
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo ao painel do barbeiro',
        });
        navigate('/barbeiro/dashboard');
      } else {
        // If user is not barber, show error
        console.log('useBarberRoleCheck - User does not have barber role');
        toast({
          title: 'Acesso não autorizado',
          description: 'Você não tem permissão para acessar a área do barbeiro',
          variant: 'destructive',
        });
        // Sign out the user since they don't have barber role
        await supabase.auth.signOut();
        navigate('/');
      }
    } catch (error) {
      console.error('useBarberRoleCheck - Erro ao verificar papel do barbeiro:', error);
      toast({
        title: 'Erro de verificação',
        description: 'Ocorreu um erro ao verificar suas permissões',
        variant: 'destructive',
      });
    } finally {
      setCheckingRole(false);
    }
  };

  return { checkingRole, setCheckingRole, checkBarberRole };
};
