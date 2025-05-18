
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email('Digite um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

interface BarberLoginFormProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onLoginSuccess: (userId: string) => Promise<void>;
}

const BarberLoginForm: React.FC<BarberLoginFormProps> = ({
  loading,
  setLoading,
  onLoginSuccess
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      console.log('BarberLoginForm - Attempting login with email:', data.email);
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error('BarberLoginForm - Login error:', error);
        toast({
          title: 'Erro ao fazer login',
          description: error.message,
          variant: 'destructive',
        });
      } else if (authData?.user) {
        console.log('BarberLoginForm - Login successful, checking barber role');
        toast({
          title: 'Login realizado com sucesso',
          description: 'Verificando suas permissões...',
        });
        
        // Check barber role after successful login
        await onLoginSuccess(authData.user.id);
      }
    } catch (error: any) {
      console.error('BarberLoginForm - Unexpected error during login:', error);
      toast({
        title: 'Erro ao fazer login',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">E-mail</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    placeholder="seu@email.com" 
                    {...field} 
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white" 
                    disabled={loading} 
                  />
                </FormControl>
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Senha</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="******" 
                    {...field} 
                    className="pl-10 pr-10 bg-zinc-800 border-zinc-700 text-white" 
                    disabled={loading} 
                  />
                </FormControl>
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10 px-0 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>

        <div className="text-center text-sm text-gray-400 mt-4">
          <a href="/" className="hover:text-white">
            Voltar para o site
          </a>
        </div>
      </form>
    </Form>
  );
};

export default BarberLoginForm;
