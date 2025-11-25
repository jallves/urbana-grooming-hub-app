import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';

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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Sessão inválida ou expirada', {
          description: 'Por favor, solicite um novo link de redefinição de senha.'
        });
        navigate('/painel-cliente/login');
        return;
      }
      
      setIsValidSession(true);
    };

    checkSession();
  }, [navigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      toast.error('Por favor, verifique os requisitos de senha');
      return;
    }

    setLoading(true);

    try {
      // Atualizar senha usando Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      toast.success('Senha alterada com sucesso!', {
        description: 'Você será redirecionado para o login.'
      });

      // Fazer logout para forçar novo login com a nova senha
      await supabase.auth.signOut();

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/painel-cliente/login');
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha', {
        description: error.message || 'Tente novamente mais tarde.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Verificando sessão...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
          <CardDescription>
            Crie uma nova senha segura para sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-6">
            {/* Nova Senha */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className="pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite novamente sua nova senha"
                  className="pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Requisitos de Senha */}
            {newPassword.length > 0 && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Requisitos de senha:</p>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-center gap-2">
                    {hasMinLength ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className={hasMinLength ? 'text-green-600' : 'text-muted-foreground'}>
                      Mínimo 8 caracteres
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {hasUpperCase ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className={hasUpperCase ? 'text-green-600' : 'text-muted-foreground'}>
                      Uma letra maiúscula
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {hasLowerCase ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className={hasLowerCase ? 'text-green-600' : 'text-muted-foreground'}>
                      Uma letra minúscula
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {hasNumber ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className={hasNumber ? 'text-green-600' : 'text-muted-foreground'}>
                      Um número
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {hasSpecialChar ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className={hasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}>
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
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">As senhas coincidem</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-destructive" />
                    <span className="text-destructive">As senhas não coincidem</span>
                  </>
                )}
              </div>
            )}

            {/* Botão de submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || loading}
            >
              {loading ? 'Alterando senha...' : 'Alterar Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
