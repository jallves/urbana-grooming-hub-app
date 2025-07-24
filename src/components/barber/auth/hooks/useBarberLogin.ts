
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const barberLoginSchema = z.object({
  email: z.string().email('Por favor, insira um email válido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export type BarberLoginForm = z.infer<typeof barberLoginSchema>;

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
    if (loading) return;
    
    setLoading(true);
    try {
      console.log('🔐 Attempting barber login for:', data.email);
      
      // STEP 1: Attempt authentication
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
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao painel do barbeiro!",
      });

      // Let the AuthContext handle the role verification
      onLoginSuccess(authData.user.id);
      
    } catch (error: any) {
      console.error('Erro no login do barbeiro:', error);
      
      let errorMessage = "Credenciais inválidas. Verifique seu email e senha.";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Email ou senha incorretos. Tente novamente.";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Por favor, confirme seu email antes de fazer login.";
      }
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    onSubmit,
  };
};
