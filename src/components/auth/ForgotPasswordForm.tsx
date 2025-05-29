
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Mail } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Por favor, insira um email válido'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onBack: () => void;
  redirectTo?: string;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack, redirectTo }) => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      console.log('Enviando solicitação de reset para:', data.email);
      
      // Usar nossa função edge personalizada
      const { data: functionData, error: functionError } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: data.email,
          redirectTo: redirectTo || `${window.location.origin}/reset-password`,
        }
      });

      console.log('Resposta da função:', functionData, 'Erro:', functionError);

      if (functionError) {
        console.error('Erro da função edge:', functionError);
        throw functionError;
      }

      if (!functionData?.success) {
        console.error('Função retornou erro:', functionData?.error);
        throw new Error(functionData?.error || 'Erro ao enviar email de recuperação');
      }

      setEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para o link de recuperação de senha.",
      });
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error);
      
      let errorMessage = "Não foi possível enviar o email de recuperação. Tente novamente.";
      
      // Tratar diferentes tipos de erro
      if (error.message?.includes('RESEND_API_KEY')) {
        errorMessage = "Serviço de email não configurado. Entre em contato com o suporte.";
      } else if (error.message?.includes('validation_error')) {
        errorMessage = "Email inválido ou serviço de email temporariamente indisponível.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro ao enviar email",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold">Email Enviado!</h2>
        <p className="text-gray-600">
          Enviamos um link de recuperação para seu email. Clique no link para redefinir sua senha.
        </p>
        <div className="text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg">
          <p>📧 Verifique também sua pasta de spam/lixo eletrônico.</p>
          <p>⏰ O link expira em 1 hora.</p>
        </div>
        <Button onClick={onBack} variant="outline" className="w-full">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Esqueceu sua senha?</h2>
        <p className="text-gray-600">
          Digite seu email para receber um link de recuperação de senha
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Link de Recuperação"}
            </Button>
            
            <Button onClick={onBack} variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Login
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ForgotPasswordForm;
