import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
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

const loginSchema = z.object({
  email: z.string().email('Digite um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const BarberAuth = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [checkingRole, setCheckingRole] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isBarber, loading: authLoading } = useAuth();

  // Check if user is already authenticated and has barber role
  useEffect(() => {
    if (!authLoading && user) {
      console.log('BarberAuth - User already authenticated, checking roles');
      setCheckingRole(true);
      checkBarberRole(user.id);
    }
  }, [user, authLoading, navigate]);

  // Check if the user has a barber role
  const checkBarberRole = async (userId: string) => {
    console.log('BarberAuth - Checking barber role for user ID:', userId);
    
    try {
      // If user is admin, redirect to admin dashboard
      if (isAdmin) {
        console.log('BarberAuth - User is admin, redirecting to admin dashboard');
        toast({
          title: 'Login realizado com sucesso',
          description: 'Redirecionando para o painel administrativo',
        });
        navigate('/admin');
        return;
      }

      // If user is a barber, they can access the barber dashboard
      if (isBarber) {
        console.log('BarberAuth - User is barber, redirecting to barber dashboard');
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo ao painel do barbeiro',
        });
        navigate('/barbeiro/dashboard');
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'barber');
      
      if (error) {
        console.error('BarberAuth - Erro ao verificar função do barbeiro:', error);
        toast({
          title: 'Erro de verificação',
          description: 'Não foi possível verificar seu papel no sistema',
          variant: 'destructive',
        });
        return;
      }
      
      // If user has barber role, redirect to barber dashboard
      if (data && data.length > 0) {
        console.log('BarberAuth - User has barber role, redirecting to barber dashboard');
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo ao painel do barbeiro',
        });
        navigate('/barbeiro/dashboard');
      } else {
        // If user is not barber, show error
        console.log('BarberAuth - User does not have barber role');
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
      console.error('BarberAuth - Erro ao verificar papel do barbeiro:', error);
      toast({
        title: 'Erro de verificação',
        description: 'Ocorreu um erro ao verificar suas permissões',
        variant: 'destructive',
      });
    } finally {
      setCheckingRole(false);
    }
  };

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
      console.log('BarberAuth - Attempting login with email:', data.email);
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error('BarberAuth - Login error:', error);
        toast({
          title: 'Erro ao fazer login',
          description: error.message,
          variant: 'destructive',
        });
      } else if (authData?.user) {
        console.log('BarberAuth - Login successful, checking barber role');
        toast({
          title: 'Login realizado com sucesso',
          description: 'Verificando suas permissões...',
        });
        
        // Check barber role after successful login
        setCheckingRole(true);
        await checkBarberRole(authData.user.id);
      }
    } catch (error: any) {
      console.error('BarberAuth - Unexpected error during login:', error);
      toast({
        title: 'Erro ao fazer login',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p className="text-white">{checkingRole ? 'Verificando permissões...' : 'Carregando...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">Urbana Barbearia</h1>
          <p className="mt-2 text-gray-400">
            Acesso exclusivo para barbeiros
          </p>
        </div>
        
        <div className="bg-zinc-900 shadow-lg rounded-lg p-6 border border-zinc-800">
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
              
              <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200" disabled={loading || checkingRole}>
                {loading ? 'Entrando...' : (checkingRole ? 'Verificando...' : 'Entrar')}
              </Button>

              <div className="text-center text-sm text-gray-400 mt-4">
                <a href="/" className="hover:text-white">
                  Voltar para o site
                </a>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default BarberAuth;
