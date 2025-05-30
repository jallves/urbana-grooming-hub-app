
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import ForgotPasswordForm from './ForgotPasswordForm';
import { checkRateLimit, resetRateLimit, sanitizeInput } from '@/lib/security';

const loginSchema = z.object({
  email: z.string().email('Por favor, insira um email válido')
    .transform(val => sanitizeInput(val)),
  password: z.string().min(1, 'A senha é obrigatória')
    .transform(val => sanitizeInput(val)),
});

type LoginForm = z.infer<typeof loginSchema>;

interface LoginFormProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onLoginSuccess?: () => void;
  redirectTo?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  loading, 
  setLoading, 
  onLoginSuccess,
  redirectTo 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    // Check rate limiting
    if (!checkRateLimit(data.email)) {
      setIsLocked(true);
      toast({
        title: "Muitas tentativas de login",
        description: "Sua conta foi temporariamente bloqueada por 15 minutos devido a muitas tentativas de login falhadas.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login for:', data.email);
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (!authData.user || !authData.session) {
        throw new Error('Login failed: No user or session returned');
      }

      console.log('Login successful for:', authData.user.email);
      
      // Reset rate limiting on successful login
      resetRateLimit(data.email);
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });

      // Clear form
      form.reset();

      // Handle navigation/callback
      if (onLoginSuccess) {
        onLoginSuccess();
      } else if (redirectTo) {
        navigate(redirectTo);
      }

    } catch (error: any) {
      console.error('Erro no login:', error);
      
      let errorMessage = "Credenciais inválidas. Verifique seu email e senha.";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Email ou senha incorretos. Tente novamente.";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Por favor, confirme seu email antes de fazer login.";
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = "Muitas tentativas de login. Tente novamente em alguns minutos.";
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

  if (showForgotPassword) {
    return (
      <ForgotPasswordForm 
        onBack={() => setShowForgotPassword(false)}
        redirectTo={redirectTo}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {isLocked && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-700">
              Conta temporariamente bloqueada. Tente novamente em 15 minutos.
            </p>
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  {...field}
                  disabled={loading || isLocked}
                  autoComplete="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    {...field}
                    disabled={loading || isLocked}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || isLocked}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <Button type="submit" className="w-full" disabled={loading || isLocked}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          
          <Button 
            type="button"
            variant="ghost" 
            className="w-full text-sm text-muted-foreground hover:text-primary"
            onClick={() => setShowForgotPassword(true)}
            disabled={loading}
          >
            Esqueceu sua senha?
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm;
