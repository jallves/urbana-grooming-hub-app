
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Schema de validação com regras específicas para senha
const registerSchema = z.object({
  fullName: z.string().min(3, 'O nome completo deve ter pelo menos 3 caracteres'),
  email: z.string().email('Digite um e-mail válido'),
  password: z.string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .refine(
      (password) => /[A-Z]/.test(password),
      'A senha deve conter pelo menos uma letra maiúscula'
    )
    .refine(
      (password) => /[a-z]/.test(password),
      'A senha deve conter pelo menos uma letra minúscula'
    )
    .refine(
      (password) => /[0-9]/.test(password),
      'A senha deve conter pelo menos um número'
    )
    .refine(
      (password) => /[^A-Za-z0-9]/.test(password),
      'A senha deve conter pelo menos um caractere especial'
    ),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
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
      // Registrar o usuário
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
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
      
      // Adicionar usuário à tabela de funções como administrador
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([
          { 
            user_id: (await supabase.auth.getUser()).data.user?.id,
            role: 'admin'
          }
        ]);

      if (roleError) {
        toast({
          title: 'Erro ao definir permissões',
          description: roleError.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Conta criada com sucesso',
          description: 'Você será redirecionado para o painel administrativo',
        });
      }
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

  // Função para verificar condições da senha
  const checkPassword = (password: string) => {
    return {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
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
              
              {/* Indicadores de requisitos de senha */}
              <div className="mt-2 space-y-1 text-xs">
                <div className={`flex items-center ${passwordConditions.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {passwordConditions.length ? <Check className="h-3 w-3 mr-1" /> : <span className="w-3 h-3 mr-1" />}
                  Mínimo de 6 caracteres
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
              </div>
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
