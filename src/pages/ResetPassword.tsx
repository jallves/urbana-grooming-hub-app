import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasValidToken, setHasValidToken] = useState<boolean | null>(null);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = form.watch('password');

  useEffect(() => {
    // Verificar se há um token de recuperação válido na URL
    const checkRecoveryToken = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        setHasValidToken(false);
        toast.error('Link inválido ou expirado', {
          description: 'Solicite um novo link de recuperação de senha.'
        });
        setTimeout(() => navigate('/'), 3000);
        return;
      }
      
      setHasValidToken(true);
    };

    checkRecoveryToken();
  }, [navigate]);

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = password ? getPasswordStrength(password) : 0;

  const onSubmit = async (data: ResetPasswordForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) throw error;

      toast.success('Senha redefinida com sucesso!', {
        description: 'Você será redirecionado para o login.'
      });

      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast.error('Erro ao redefinir senha', {
        description: error.message || 'Tente novamente mais tarde.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (hasValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-urbana-gold"></div>
      </div>
    );
  }

  if (hasValidToken === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Link Inválido</h2>
          <p className="text-gray-400">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-urbana-gold to-urbana-gold-light rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-urbana-gold/30">
              <Lock className="h-10 w-10 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold to-urbana-gold-light mb-2">
              Costa Urbana
            </h1>
            <p className="text-gray-400">Redefinir Senha</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Nova Senha */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-300">Nova Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Digite sua nova senha"
                          {...field}
                          disabled={loading}
                          className="pl-12 pr-12 h-14 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/20 rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-urbana-gold transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Indicador de Força da Senha */}
              {password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          passwordStrength >= level
                            ? passwordStrength <= 2
                              ? 'bg-red-500'
                              : passwordStrength === 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-500' : 'text-gray-500'}`}>
                      {password.length >= 8 ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      Mínimo 8 caracteres
                    </div>
                    <div className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-500'}`}>
                      {/[A-Z]/.test(password) ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      Uma letra maiúscula
                    </div>
                    <div className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-500' : 'text-gray-500'}`}>
                      {/[a-z]/.test(password) ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      Uma letra minúscula
                    </div>
                    <div className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-500' : 'text-gray-500'}`}>
                      {/[0-9]/.test(password) ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      Um número
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmar Senha */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-300">Confirmar Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Digite novamente sua senha"
                          {...field}
                          disabled={loading}
                          className="pl-12 pr-12 h-14 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/20 rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-urbana-gold transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-14 bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold hover:shadow-lg hover:shadow-urbana-gold/30 text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir Senha'
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
