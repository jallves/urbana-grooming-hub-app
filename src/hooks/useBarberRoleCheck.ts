
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
      
      // Check standard barber role in database
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'barber');
      
      if (error) {
        console.error('useBarberRoleCheck - Error checking barber role:', error);
        toast({
          title: 'Erro de verificação',
          description: 'Não foi possível verificar seu papel no sistema',
          variant: 'destructive',
        });
        navigate('/barbeiro/login');
        return;
      }
      
      // If user has barber role, redirect to barber dashboard
      if (data && data.length > 0) {
        console.log('useBarberRoleCheck - User has barber role, redirecting to dashboard');
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo ao painel do barbeiro',
        });
        
        // Navigate to dashboard only after confirming role
        navigate('/barbeiro/dashboard');
      } else {
        // Get user email for special user check
        const { data: userData } = await supabase.auth.getUser();
        const userEmail = userData?.user?.email;
        
        // Special check for specific email
        if (userEmail === 'jhoaoallves84@gmail.com') {
          console.log('useBarberRoleCheck - Special user detected, granting access');
          toast({
            title: 'Login realizado com sucesso',
            description: 'Bem-vindo ao painel do barbeiro',
          });
          
          // Add barber role for this special user if it doesn't exist
          try {
            const { data: existingRole } = await supabase
              .from('user_roles')
              .select('*')
              .eq('user_id', userId)
              .eq('role', 'barber');
            
            if (!existingRole || existingRole.length === 0) {
              await supabase
                .from('user_roles')
                .insert([{ user_id: userId, role: 'barber' }]);
              
              console.log('useBarberRoleCheck - Added barber role for special user');
            }
          } catch (error) {
            console.error('Failed to add barber role', error);
            // Continue anyway since this is a special user
          }
          
          navigate('/barbeiro/dashboard');
        } else {
          // If user is not a barber and not special user, show error
          console.log('useBarberRoleCheck - User does not have barber role');
          toast({
            title: 'Acesso não autorizado',
            description: 'Você não tem permissão para acessar a área do barbeiro',
            variant: 'destructive',
          });
          // End session and redirect to login page
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
      navigate('/barbeiro/login');
    } finally {
      setCheckingRole(false);
    }
  };

  return { checkingRole, setCheckingRole, checkBarberRole };
};
