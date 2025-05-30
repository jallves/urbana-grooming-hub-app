
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useBarberRoleCheck = () => {
  const [checkingRole, setCheckingRole] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkBarberRole = async (userId: string): Promise<void> => {
    console.log('useBarberRoleCheck - Checking barber role for ID:', userId);
    
    try {
      setCheckingRole(true);
      
      // Get user email for staff verification
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email;
      
      if (!userEmail) {
        console.log('useBarberRoleCheck - No user email found');
        toast({
          title: 'Erro de autenticação',
          description: 'Não foi possível verificar seu email',
          variant: 'destructive',
        });
        await supabase.auth.signOut();
        navigate('/barbeiro/login');
        return;
      }
      
      // Check if user is an active staff member first
      const { data: staffMember, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('email', userEmail)
        .eq('is_active', true)
        .maybeSingle();
      
      if (staffError) {
        console.error('useBarberRoleCheck - Error checking staff member:', staffError);
        toast({
          title: 'Erro de verificação',
          description: 'Não foi possível verificar seu status no sistema',
          variant: 'destructive',
        });
        await supabase.auth.signOut();
        navigate('/barbeiro/login');
        return;
      }
      
      if (!staffMember) {
        console.log('useBarberRoleCheck - User is not an active staff member');
        toast({
          title: 'Acesso não autorizado',
          description: 'Você não está cadastrado como barbeiro ativo no sistema',
          variant: 'destructive',
        });
        await supabase.auth.signOut();
        navigate('/barbeiro/login');
        return;
      }
      
      // Check if user has barber role in database
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'barber');
      
      if (rolesError) {
        console.error('useBarberRoleCheck - Error checking barber role:', rolesError);
        toast({
          title: 'Erro de verificação',
          description: 'Não foi possível verificar seu papel no sistema',
          variant: 'destructive',
        });
        await supabase.auth.signOut();
        navigate('/barbeiro/login');
        return;
      }
      
      // If user has barber role and is active staff, allow access
      if (roles && roles.length > 0) {
        console.log('useBarberRoleCheck - User has barber role and is active staff, allowing access');
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo ao painel do barbeiro',
        });
        navigate('/barbeiro/dashboard');
      } else {
        // If user is active staff but doesn't have barber role, try to add it
        console.log('useBarberRoleCheck - Active staff member without barber role, adding role');
        
        try {
          const { error: addRoleError } = await supabase
            .from('user_roles')
            .insert([{ user_id: userId, role: 'barber' }]);
          
          if (addRoleError) {
            console.error('useBarberRoleCheck - Error adding barber role:', addRoleError);
            toast({
              title: 'Erro de configuração',
              description: 'Entre em contato com o administrador para configurar seu acesso',
              variant: 'destructive',
            });
            await supabase.auth.signOut();
            navigate('/barbeiro/login');
            return;
          }
          
          console.log('useBarberRoleCheck - Barber role added successfully');
          toast({
            title: 'Login realizado com sucesso',
            description: 'Bem-vindo ao painel do barbeiro',
          });
          navigate('/barbeiro/dashboard');
        } catch (error) {
          console.error('useBarberRoleCheck - Exception adding barber role:', error);
          toast({
            title: 'Erro de configuração',
            description: 'Entre em contato com o administrador para configurar seu acesso',
            variant: 'destructive',
          });
          await supabase.auth.signOut();
          navigate('/barbeiro/login');
        }
      }
    } catch (error) {
      console.error('useBarberRoleCheck - Error checking barber role:', error);
      toast({
        title: 'Erro de verificação',
        description: 'Ocorreu um erro ao verificar suas permissões',
        variant: 'destructive',
      });
      await supabase.auth.signOut();
      navigate('/barbeiro/login');
    } finally {
      setCheckingRole(false);
    }
  };

  return { checkingRole, setCheckingRole, checkBarberRole };
};
