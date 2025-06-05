
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Lock, Eye, EyeOff, Check, AlertTriangle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { validatePasswordStrength, sanitizeInput } from '@/lib/security';

// Enhanced schema with stronger validation
const registerSchema = z.object({
  fullName: z.string()
    .min(3, 'O nome completo deve ter pelo menos 3 caracteres')
    .max(100, 'O nome completo deve ter no máximo 100 caracteres')
    .transform(val => sanitizeInput(val)),
  email: z.string()
    .email('Digite um e-mail válido')
    .transform(val => sanitizeInput(val)),
  password: z.string()
    .min(12, 'A senha deve ter pelo menos 12 caracteres')
    .refine(
      (password) => validatePasswordStrength(password).isValid,
      'A senha não atende aos critérios de segurança'
    ),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export interface RegisterFormProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ loading, setLoading }) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = React.useState(false);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    try {
      // Additional password validation
      const passwordValidation = validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        toast({
          title: 'Senha insegura',
          description: passwordValidation.errors.join(', '),
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Registrar o usuário
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });

      if (signUpError) {
        toast({
          title: 'Erro ao criar conta',
          description: signUpError.message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      if (!signUpData.user) {
        toast({
          title: 'Erro ao criar conta',
          description: 'Não foi possível obter os dados do usuário',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      // Add user role as regular user (NOT admin by default)
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([
          { 
            user_id: signUpData.user.id,
            role: 'user' // Default to user role for security
          }
        ]);

      if (roleError) {
        console.error('Error setting user role:', roleError);
        // Don't fail registration for role error, just log it
      }

      toast({
        title: 'Conta criada com sucesso',
        description: 'Verifique seu email para confirmar a conta antes de fazer login.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to check password conditions
  const checkPassword = (password: string) => {
    const validation = validatePasswordStrength(password);
    return {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      noCommon: !validation.errors.some(error => error.includes('palavras comuns')),
    };
  };

  const passwordConditions = checkPassword(form.watch('password') || '');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    placeholder="João da Silva" 
                    {...field} 
                    className="pl-10" 
                    disabled={loading}
                    maxLength={100}
                  />
                </FormControl>
                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    placeholder="seu@email.com" 
                    {...field} 
                    className="pl-10" 
                    disabled={loading}
                    autoComplete="email"
                  />
                </FormControl>
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
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
              <FormLabel>Senha</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="******" 
                    {...field} 
                    className="pl-10 pr-10" 
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </FormControl>
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10 px-0"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <FormMessage />
              
              {/* Enhanced password requirements indicator */}
              <div className="mt-2 space-y-1 text-xs">
                <div className={`flex items-center ${passwordConditions.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {passwordConditions.length ? <Check className="h-3 w-3 mr-1" /> : <span className="w-3 h-3 mr-1" />}
                  Mínimo de 12 caracteres
                </div>
                <div className={`flex items-center ${passwordConditions.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {passwordConditions.uppercase ? <Check className="h-3 w-3 mr-1" /> : <span className="w-3 h-3 mr-1" />}
                  Pelo menos uma letra maiúscula
                </div>
                <div className={`flex items-center ${passwordConditions.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {passwordConditions.lowercase ? <Check className="h-3 w-3 mr-1" /> : <span className="w-3 h-3 mr-1" />}
                  Pelo menos uma letra minúscula
                </div>
                <div className={`flex items-center ${passwordConditions.number ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {passwordConditions.number ? <Check className="h-3 w-3 mr-1" /> : <span className="w-3 h-3 mr-1" />}
                  Pelo menos um número
                </div>
                <div className={`flex items-center ${passwordConditions.special ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {passwordConditions.special ? <Check className="h-3 w-3 mr-1" /> : <span className="w-3 h-3 mr-1" />}
                  Pelo menos um caractere especial
                </div>
                <div className={`flex items-center ${passwordConditions.noCommon ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {passwordConditions.noCommon ? <Check className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                  Não conter palavras comuns
                </div>
              </div>
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Criar Conta'}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
export type { RegisterFormProps };
