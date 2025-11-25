import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import AuthContainer from '@/components/ui/containers/AuthContainer';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  // Validações de senha
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialChar = /[@$!%*?&]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  const canSubmit = isPasswordValid && passwordsMatch;

  // Verificar se há uma sessão válida (usuário veio do link do email)
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Primeiro, verificar se há um hash na URL (token de recuperação)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        console.log('🔍 Verificando sessão de recuperação...', { accessToken: !!accessToken, type });

        // Se houver um token de recuperação, o Supabase já processou e criou a sessão
        if (accessToken && type === 'recovery') {
          console.log('✅ Token de recuperação detectado, sessão válida');
          setIsValidSession(true);
          return;
        }

        // Caso contrário, verificar se já existe uma sessão
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('📊 Resultado da verificação de sessão:', { session: !!session, error });
        
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error);
          throw error;
        }
        
        if (!session) {
          console.log('❌ Nenhuma sessão válida encontrada');
          toast.error('Link inválido ou expirado', {
            description: 'Por favor, solicite um novo link de redefinição de senha.'
          });
          setTimeout(() => {
            navigate('/painel-cliente/forgot-password');
          }, 2000);
          return;
        }
        
        console.log('✅ Sessão válida encontrada');
        setIsValidSession(true);
      } catch (error) {
        console.error('💥 Erro ao verificar sessão:', error);
        toast.error('Erro ao verificar sessão');
        setTimeout(() => {
          navigate('/painel-cliente/forgot-password');
        }, 2000);
      }
    };

    checkSession();
  }, [navigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🔐 Iniciando alteração de senha...');

    if (!canSubmit) {
      console.log('❌ Validação falhou');
      toast.error('Por favor, verifique os requisitos de senha');
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Chamando supabase.auth.updateUser...');
      
      // Atualizar senha usando Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      console.log('📊 Resposta do updateUser:', { data, error });

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ Senha atualizada com sucesso!');

      toast.success('Senha alterada com sucesso!', {
        description: 'Você será redirecionado para o login.'
      });

      // Fazer logout para forçar novo login com a nova senha
      console.log('🚪 Fazendo logout...');
      await supabase.auth.signOut();

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        console.log('➡️ Redirecionando para login...');
        navigate('/painel-cliente/login');
      }, 2000);

    } catch (error: any) {
      console.error('💥 Erro ao alterar senha:', error);
      console.error('💥 Detalhes do erro:', {
        message: error.message,
        status: error.status,
        code: error.code
      });
      toast.error('Erro ao alterar senha', {
        description: error.message || 'Tente novamente mais tarde.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <AuthContainer>
        <div className="w-full max-w-md mx-auto px-4">
          <div className="backdrop-blur-xl bg-urbana-black/40 border border-urbana-gold/20 rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-urbana-gold/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-urbana-gold/30 animate-pulse">
                <Lock className="w-6 h-6 text-urbana-gold" />
              </div>
              <h2 className="text-xl font-semibold text-urbana-light">Verificando sessão...</h2>
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
              <Lock className="w-6 h-6 text-urbana-gold" />
            </div>
            <h2 className="text-2xl font-bold text-urbana-light mb-2">Redefinir Senha</h2>
            <p className="text-urbana-light/70">
              Crie uma nova senha segura para sua conta
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-6">
            {/* Nova Senha */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-urbana-light">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className="pr-10 bg-urbana-black/40 border-urbana-gold/30 text-urbana-light placeholder:text-urbana-light/40"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-urbana-light/50 hover:text-urbana-light"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-urbana-light">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite novamente sua nova senha"
                  className="pr-10 bg-urbana-black/40 border-urbana-gold/30 text-urbana-light placeholder:text-urbana-light/40"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-urbana-light/50 hover:text-urbana-light"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Requisitos de Senha */}
            {newPassword.length > 0 && (
              <div className="space-y-2 p-4 bg-urbana-black/30 backdrop-blur-sm border border-urbana-gold/10 rounded-lg">
                <p className="text-sm font-medium text-urbana-light">Requisitos de senha:</p>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-center gap-2">
                    {hasMinLength ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-urbana-light/30" />
                    )}
                    <span className={hasMinLength ? 'text-green-400' : 'text-urbana-light/50'}>
                      Mínimo 8 caracteres
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {hasUpperCase ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-urbana-light/30" />
                    )}
                    <span className={hasUpperCase ? 'text-green-400' : 'text-urbana-light/50'}>
                      Uma letra maiúscula
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {hasLowerCase ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-urbana-light/30" />
                    )}
                    <span className={hasLowerCase ? 'text-green-400' : 'text-urbana-light/50'}>
                      Uma letra minúscula
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {hasNumber ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-urbana-light/30" />
                    )}
                    <span className={hasNumber ? 'text-green-400' : 'text-urbana-light/50'}>
                      Um número
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {hasSpecialChar ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-urbana-light/30" />
                    )}
                    <span className={hasSpecialChar ? 'text-green-400' : 'text-urbana-light/50'}>
                      Um caractere especial (@$!%*?&)
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
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">As senhas coincidem</span>
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
              className={`w-full font-semibold transition-all ${
                canSubmit && !loading
                  ? 'bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black shadow-lg shadow-urbana-gold/20'
                  : 'bg-urbana-gold/30 text-urbana-black/50 cursor-not-allowed'
              }`}
              disabled={!canSubmit || loading}
            >
              {loading ? 'Alterando senha...' : 'Atualizar Senha'}
            </Button>
          </form>
        </div>
      </div>
    </AuthContainer>
  );
}
