
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();

  // Check if user is already authenticated and has barber role
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // Check if the user has a barber role
        checkBarberRole(user.id);
      }
    }
  }, [user, authLoading, navigate]);

  // Check if the user has a barber role
  const checkBarberRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'barber');
      
      if (error) {
        console.error('Erro ao verificar função do usuário:', error);
        return;
      }
      
      // If user has barber role, redirect to barber dashboard
      if (data && data.length > 0) {
        navigate('/barbeiro');
      } else if (isAdmin) {
        // If user is admin, redirect to admin dashboard
        navigate('/admin');
      } else {
        // If user is not barber or admin, show error
        toast({
          title: 'Acesso não autorizado',
          description: 'Você não tem permissão para acessar a área do barbeiro',
          variant: 'destructive',
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Erro ao verificar papel do barbeiro:', error);
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
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast({
          title: 'Erro ao fazer login',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        // Authentication successful, role check is handled by useEffect
        toast({
          title: 'Login realizado com sucesso',
          description: 'Verificando suas permissões...',
        });
      }
    } catch (error: any) {
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
        </div>
      </div>
    </div>
  );
};

export default BarberAuth;
