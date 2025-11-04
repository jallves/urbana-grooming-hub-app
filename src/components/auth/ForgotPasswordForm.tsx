
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
      <div className="text-center space-y-6 py-4">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
            <Mail className="h-10 w-10 text-white" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Email Enviado!</h2>
          <p className="text-gray-400">
            Enviamos um link de recuperação para seu email.
          </p>
        </div>
        <div className="text-sm text-gray-400 bg-gray-800/50 p-4 rounded-xl space-y-1 border border-gray-700">
          <p>📧 Verifique também sua pasta de spam</p>
          <p>⏰ O link expira em 1 hora</p>
        </div>
        <Button onClick={onBack} variant="outline" className="w-full h-12 border-gray-700 bg-gray-800/30 hover:bg-gray-700/50 hover:border-urbana-gold/50 rounded-xl transition-all">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-white">Esqueceu sua senha?</h2>
        <p className="text-gray-400">
          Digite seu email para receber um link de recuperação
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-300">Email</FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-urbana-gold transition-colors" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      {...field}
                      disabled={loading}
                      className="pl-12 h-14 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/20 rounded-xl transition-all"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <Button 
              type="submit" 
              className="w-full h-14 bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold hover:shadow-lg hover:shadow-urbana-gold/30 text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                  Enviando...
                </>
              ) : (
                "Enviar Link de Recuperação"
              )}
            </Button>
            
            <Button onClick={onBack} variant="outline" className="w-full h-12 border-gray-700 bg-gray-800/30 hover:bg-gray-700/50 hover:border-urbana-gold/50 rounded-xl transition-all">
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
