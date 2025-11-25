import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Eye, EyeOff, Check, X, Shield } from 'lucide-react';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // Validações de senha
  const hasMinLength = newPassword.length >= 8;
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const canSubmit = hasMinLength && passwordsMatch;

  // Verificar sessão de recuperação usando PASSWORD_RECOVERY event
  useEffect(() => {
    console.log('🔐 [ChangePassword] Iniciando verificação de sessão...');
    
    // PRIMEIRO: Verificar tokens na URL (prioridade)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    console.log('🔗 [ChangePassword] URL Hash params:', { 
      hasAccessToken: !!accessToken, 
      type,
      fullHash: window.location.hash 
    });
    
    // Se houver token de recovery na URL, permitir acesso imediatamente
    if (accessToken && type === 'recovery') {
      console.log('✅ [ChangePassword] Token de recovery encontrado na URL - Acesso permitido!');
      setIsValidSession(true);
      return; // Sair do useEffect sem fazer mais verificações
    }
    
    // Listener para eventos de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [ChangePassword] Auth event:', event, session ? 'Session exists' : 'No session');
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ [ChangePassword] PASSWORD_RECOVERY event detectado!');
        setIsValidSession(true);
      }
    });

    // Verificar se já existe uma sessão válida
    const checkSession = async () => {
      console.log('🔍 [ChangePassword] Verificando sessão atual...');
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📋 [ChangePassword] Sessão:', session ? 'Existe' : 'Não existe');
      
      if (session) {
        console.log('✅ [ChangePassword] Sessão válida encontrada');
        setIsValidSession(true);
      } else {
        console.log('❌ [ChangePassword] Nenhuma sessão válida encontrada. Redirecionando...');
        toast.error('Link inválido ou expirado', {
          description: 'Por favor, solicite um novo link de redefinição de senha.'
        });
        setTimeout(() => {
          navigate('/painel-cliente/forgot-password');
        }, 3000);
      }
    };

    // Só verificar sessão se não houver tokens na URL
    if (!accessToken || type !== 'recovery') {
      checkSession();
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      toast.error('Por favor, verifique os requisitos de senha');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setPasswordUpdated(true);
      toast.success('Senha atualizada com sucesso!');

    } catch (error: any) {
      toast.error('Erro ao atualizar senha', {
        description: error.message || 'Tente novamente mais tarde.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = async () => {
    await supabase.auth.signOut();
    navigate('/painel-cliente/login');
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#050507] px-4">
        <div className="w-full max-w-[420px]">
          <div className="bg-[#050507] border border-[#C5A15B]/30 rounded-2xl p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-[#C5A15B]/20 rounded-full flex items-center justify-center border border-[#C5A15B]/30 animate-pulse">
                <Shield className="w-6 h-6 text-[#C5A15B]" />
              </div>
              <h2 className="text-lg font-semibold text-white">Verificando sessão...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (passwordUpdated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#050507] px-4 py-8">
        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-white font-bold text-xl mb-2" style={{ letterSpacing: '0.16em' }}>
              BARBEARIA COSTA URBANA
            </h1>
            <p className="text-white/70 text-sm">
              Painel do Cliente – Redefinição de Senha
            </p>
          </div>

          {/* Success Card */}
          <div className="bg-[#050507] border-2 border-[#C5A15B] rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 w-16 h-16 bg-[#C5A15B]/20 rounded-full flex items-center justify-center border-2 border-[#C5A15B]">
                <Check className="w-8 h-8 text-[#C5A15B]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Senha atualizada!</h2>
              <p className="text-white/80 text-base leading-relaxed">
                Senha atualizada com sucesso. Você já pode acessar o painel do cliente.
              </p>
            </div>

            <Button
              onClick={handleGoToLogin}
              className="w-full bg-[#C5A15B] hover:bg-[#C5A15B]/90 text-[#050507] font-bold py-6 rounded-full text-base transition-all shadow-lg shadow-[#C5A15B]/20"
            >
              IR PARA LOGIN
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-white/50 text-xs leading-relaxed max-w-md mx-auto">
              Segurança & Privacidade — Sua senha é criptografada e nunca é compartilhada com terceiros. 
              Se você não solicitou essa alteração, basta ignorar esta página.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050507] px-4 py-8">
      <div className="w-full max-w-[420px]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-white font-bold text-xl mb-2" style={{ letterSpacing: '0.16em' }}>
            BARBEARIA COSTA URBANA
          </h1>
          <p className="text-white/70 text-sm">
            Painel do Cliente – Redefinição de Senha
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#050507] border-2 border-[#C5A15B] rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Redefinir sua senha</h2>
            <p className="text-white/70 text-sm">
              Crie uma nova senha segura para proteger sua conta
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5">
            {/* Nova Senha */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-white text-sm font-medium">
                Nova senha
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className="w-full pr-10 bg-[#050507] border-[#C5A15B]/40 text-white placeholder:text-white/40 focus:border-[#C5A15B] h-12"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-white text-sm font-medium">
                Confirmar nova senha
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite novamente sua nova senha"
                  className="w-full pr-10 bg-[#050507] border-[#C5A15B]/40 text-white placeholder:text-white/40 focus:border-[#C5A15B] h-12"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Requisitos de Senha */}
            {newPassword.length > 0 && (
              <div className="space-y-3 p-4 bg-white/5 border border-[#C5A15B]/20 rounded-lg">
                <p className="text-sm font-medium text-white">Requisitos de senha:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    {hasMinLength ? (
                      <Check className="w-4 h-4 text-[#C5A15B] flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-white/30 flex-shrink-0" />
                    )}
                    <span className={hasMinLength ? 'text-[#C5A15B]' : 'text-white/50'}>
                      Mínimo de 8 caracteres
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/50 text-xs mt-1">
                      Recomendamos: letras maiúsculas, minúsculas, números e caracteres especiais para maior segurança
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {/* Validação de senhas iguais */}
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                {passwordsMatch ? (
                  <>
                    <Check className="w-4 h-4 text-[#C5A15B]" />
                    <span className="text-[#C5A15B]">As senhas coincidem</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-red-400" />
                    <span className="text-red-400">As senhas não coincidem</span>
                  </>
                )}
              </div>
            )}

            {/* Botão de submit */}
            <Button
              type="submit"
              className={`w-full font-bold py-6 rounded-full text-base transition-all ${
                canSubmit && !loading
                  ? 'bg-[#C5A15B] hover:bg-[#C5A15B]/90 text-[#050507] shadow-lg shadow-[#C5A15B]/20'
                  : 'bg-[#C5A15B]/30 text-[#050507]/50 cursor-not-allowed'
              }`}
              disabled={!canSubmit || loading}
            >
              {loading ? 'SALVANDO...' : 'SALVAR NOVA SENHA'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/50 text-xs leading-relaxed max-w-md mx-auto">
            Segurança & Privacidade — Sua senha é criptografada e nunca é compartilhada com terceiros. 
            Se você não solicitou essa alteração, basta ignorar esta página.
          </p>
        </div>
      </div>
    </div>
  );
}
