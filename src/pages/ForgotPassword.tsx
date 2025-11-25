import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, ArrowLeft } from 'lucide-react';
import AuthContainer from '@/components/ui/containers/AuthContainer';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Digite seu e-mail');
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = 'https://d8077827-f7c8-4ebd-8463-ec535c4f64a5.lovableproject.com/change-password';
      
      // Usar a edge function para enviar o email com token confiável
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { 
          email,
          redirectTo: redirectUrl
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao enviar email');
      }

      setEmailSent(true);
      toast.success('E-mail enviado!', {
        description: 'Verifique sua caixa de entrada e spam.'
      });

    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      toast.error('Erro ao enviar e-mail', {
        description: error.message || 'Tente novamente mais tarde.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthContainer>
        <div className="w-full max-w-md mx-auto px-4">
          <div className="backdrop-blur-xl bg-urbana-black/40 border border-urbana-gold/20 rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-green-500/30">
                <Mail className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-urbana-light mb-2">E-mail Enviado!</h2>
              <p className="text-urbana-light/70">
                Enviamos um link de redefinição de senha para <strong className="text-urbana-gold">{email}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-300 font-semibold mb-2">
                  📧 Próximos passos:
                </p>
                <ol className="text-sm text-blue-200/80 space-y-1 list-decimal list-inside">
                  <li>Verifique sua caixa de entrada</li>
                  <li>Clique no link do email</li>
                  <li>Crie sua nova senha</li>
                </ol>
              </div>

              <div className="bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm text-yellow-300">
                  <strong>⏱️ Importante:</strong> O link expira em 1 hora
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full bg-urbana-black/40 border-urbana-gold/30 text-urbana-light hover:bg-urbana-gold/20 hover:border-urbana-gold/50"
                  onClick={() => navigate('/painel-cliente/login')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para o Login
                </Button>

                <Button
                  variant="ghost"
                  className="w-full text-sm text-urbana-light/70 hover:text-urbana-light hover:bg-urbana-black/20"
                  onClick={() => setEmailSent(false)}
                >
                  Não recebeu o email? Tentar novamente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer>
      <div className="w-full max-w-md mx-auto px-4">
        <div className="backdrop-blur-xl bg-urbana-black/40 border border-urbana-gold/20 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 w-12 h-12 bg-urbana-gold/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-urbana-gold/30">
              <Mail className="w-6 h-6 text-urbana-gold" />
            </div>
            <h2 className="text-2xl font-bold text-urbana-light mb-2">Esqueceu sua senha?</h2>
            <p className="text-urbana-light/70">
              Digite seu e-mail e enviaremos um link para redefinir sua senha
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-urbana-light">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={loading}
                autoFocus
                className="bg-urbana-black/40 border-urbana-gold/30 text-urbana-light placeholder:text-urbana-light/40"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black font-semibold"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-urbana-light/70 hover:text-urbana-light hover:bg-urbana-black/20"
              onClick={() => navigate('/painel-cliente/login')}
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o Login
            </Button>
          </form>
        </div>
      </div>
    </AuthContainer>
  );
}
