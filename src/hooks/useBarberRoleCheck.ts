
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useBarberRoleCheck = () => {
  const [checkingRole, setCheckingRole] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkBarberRole = async (userId: string): Promise<void> => {
    console.log('useBarberRoleCheck - Verificando papel de barbeiro para ID:', userId);
    
    try {
      setCheckingRole(true);
      
      // Obter email do usuário para verificação especial
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email;
      
      // Verificação especial para email específico
      if (userEmail === 'jhoaoallves84@gmail.com') {
        console.log('useBarberRoleCheck - Usuário especial detectado, permitindo acesso');
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo ao painel do barbeiro',
        });
        
        // Adicionar papel para este usuário especial se não existir
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
            
            console.log('useBarberRoleCheck - Adicionado papel de barbeiro para usuário especial');
          }
        } catch (error) {
          console.error('Falha ao adicionar papel de barbeiro', error);
          // Continuar mesmo assim já que este é um usuário especial
        }
        
        navigate('/barbeiro/dashboard');
        return;
      }

      // Verificação padrão para papel de barbeiro no banco de dados
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
        navigate('/barbeiro/login');
        return;
      }
      
      // Se o usuário tem papel de barbeiro, redirecionar para dashboard de barbeiro
      if (data && data.length > 0) {
        console.log('useBarberRoleCheck - Usuário tem papel de barbeiro, redirecionando para dashboard');
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo ao painel do barbeiro',
        });
        navigate('/barbeiro/dashboard');
      } else {
        // Se o usuário não é barbeiro, mostrar erro
        console.log('useBarberRoleCheck - Usuário não tem papel de barbeiro');
        toast({
          title: 'Acesso não autorizado',
          description: 'Você não tem permissão para acessar a área do barbeiro',
          variant: 'destructive',
        });
        // Encerrar sessão e redirecionar para página de login
        await supabase.auth.signOut();
        navigate('/barbeiro/login');
      }
    } catch (error) {
      console.error('useBarberRoleCheck - Erro ao verificar papel do barbeiro:', error);
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
