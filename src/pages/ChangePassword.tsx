import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'A senha deve ter no mínimo 8 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
      return 'A senha deve conter pelo menos uma letra maiúscula';
    }
    if (!/[a-z]/.test(password)) {
      return 'A senha deve conter pelo menos uma letra minúscula';
    }
    if (!/[0-9]/.test(password)) {
      return 'A senha deve conter pelo menos um número';
    }
    return null;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não encontrado');
        return;
      }

      // Chamar função RPC para atualizar senha
      const { data, error } = await supabase.rpc('update_user_password_first_login', {
        p_user_id: user.id,
        p_new_password: newPassword
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar senha');
      }

      toast.success('Senha atualizada com sucesso!');
      
      // Redirecionar para o painel admin
      navigate('/admin');
    } catch (error: any) {
      console.error('Erro ao trocar senha:', error);
      toast.error(error.message || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Troca de Senha Obrigatória</CardTitle>
          <CardDescription>
            Por motivos de segurança, você deve alterar sua senha temporária antes de continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                required
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
              <p className="font-medium text-foreground">A senha deve conter:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                    • Mínimo 8 caracteres
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>
                    • Uma letra maiúscula
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>
                    • Uma letra minúscula
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={/[0-9]/.test(newPassword) ? 'text-green-600' : ''}>
                    • Um número
                  </span>
                </li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Atualizando...' : 'Atualizar Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
