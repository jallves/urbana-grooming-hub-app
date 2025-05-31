
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const barberLoginSchema = z.object({
  email: z.string().email('Por favor, insira um email válido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

type BarberLoginForm = z.infer<typeof barberLoginSchema>;

interface UseBarberLoginProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onLoginSuccess: (userId: string) => void;
}

export const useBarberLogin = ({ loading, setLoading, onLoginSuccess }: UseBarberLoginProps) => {
  const { toast } = useToast();

  const form = useForm<BarberLoginForm>({
    resolver: zodResolver(barberLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: BarberLoginForm) => {
    setLoading(true);
    try {
      console.log('🔐 Attempting barber login for:', data.email);
      
      // STEP 1: Attempt authentication first
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        console.error('❌ Authentication error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Falha na autenticação');
      }

      console.log('✅ Authentication successful for:', authData.user.email);
      
      // Give the AuthContext time to update the user roles
      setTimeout(async () => {
        try {
          // Check if user has barber or admin role
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', authData.user.id);
          
          if (rolesError) {
            console.error('❌ Error checking roles:', rolesError);
            await supabase.auth.signOut();
            throw new Error('Erro ao verificar permissões');
          }
          
          const userRoles = roles?.map(r => r.role) || [];
          const hasAccess = userRoles.includes('admin') || userRoles.includes('barber');
          
          console.log('User roles:', userRoles, 'Has access:', hasAccess);
          
          if (!hasAccess) {
            console.log('❌ User does NOT have barber or admin role - access denied');
            await supabase.auth.signOut();
            toast({
              title: "Acesso Negado",
              description: "Você não possui permissão de barbeiro. Entre em contato com o administrador.",
              variant: "destructive",
            });
            return;
          }
          
          console.log('✅ User has proper access - login successful');
          toast({
            title: "Login realizado com sucesso!",
            description: "Bem-vindo ao painel do barbeiro!",
          });

          onLoginSuccess(authData.user.id);
          
        } catch (error: any) {
          console.error('Error in role check:', error);
          toast({
            title: "Erro na verificação",
            description: error.message || "Erro ao verificar permissões",
            variant: "destructive",
          });
        }
      }, 1000); // Wait 1 second for AuthContext to update
      
    } catch (error: any) {
      console.error('Erro no login do barbeiro:', error);
      
      let errorMessage = "Credenciais inválidas. Verifique seu email e senha.";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Email ou senha incorretos. Tente novamente.";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Por favor, confirme seu email antes de fazer login.";
      } else if (error.message?.includes('verificar')) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return {
    form,
    onSubmit,
  };
};
