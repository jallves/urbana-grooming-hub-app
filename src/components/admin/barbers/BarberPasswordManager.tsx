import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Key, UserPlus, RefreshCw, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validatePasswordStrength } from '@/lib/security';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BarberPasswordManagerProps {
  barberId?: string;
  barberName?: string;
  barberEmail?: string;
  onClose?: () => void;
}

const BarberPasswordManager: React.FC<BarberPasswordManagerProps> = ({
  barberId,
  barberName,
  barberEmail,
  onClose
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{isValid: boolean, errors: string[]}>({
    isValid: false,
    errors: []
  });

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const strength = validatePasswordStrength(value);
    setPasswordStrength(strength);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
    let result = '';
    
    // Garantir pelo menos um de cada tipo
    result += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Maiúscula
    result += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minúscula
    result += '0123456789'[Math.floor(Math.random() * 10)]; // Número
    result += '!@#$%&*'[Math.floor(Math.random() * 7)]; // Especial
    
    // Completar até 12 caracteres
    for (let i = 4; i < 12; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Embaralhar
    const shuffled = result.split('').sort(() => 0.5 - Math.random()).join('');
    setPassword(shuffled);
    setConfirmPassword(shuffled);
    handlePasswordChange(shuffled);
  };

  const handleCreateOrUpdatePassword = async () => {
    if (!barberEmail) {
      toast({
        title: "Erro",
        description: "Email do barbeiro é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (!passwordStrength.isValid) {
      toast({
        title: "Senha inválida",
        description: passwordStrength.errors.join('. '),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Verificar se o usuário já existe no auth
      const { data: authResponse } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });
      
      const existingUser = authResponse?.users?.find(user => user.email === barberEmail);

      if (existingUser) {
        // Atualizar senha do usuário existente
        const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password: password
        });

        if (error) {
          throw error;
        }

        toast({
          title: "Senha atualizada!",
          description: `A senha do barbeiro ${barberName} foi redefinida com sucesso.`,
        });
      } else {
        // Criar novo usuário
        const { error } = await supabase.auth.admin.createUser({
          email: barberEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            name: barberName,
            role: 'barber'
          }
        });

        if (error) {
          throw error;
        }

        toast({
          title: "Usuário criado!",
          description: `Conta de acesso criada para ${barberName} com sucesso.`,
        });
      }

      // Limpar formulário
      setPassword('');
      setConfirmPassword('');
      setPasswordStrength({ isValid: false, errors: [] });
      
      if (onClose) {
        onClose();
      }

    } catch (error: any) {
      console.error('Erro ao gerenciar senha:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerenciar senha do barbeiro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!barberEmail) return;

    if (!confirm(`Tem certeza que deseja excluir o acesso ao painel para ${barberName}?`)) {
      return;
    }

    setLoading(true);

    try {
      const { data: authResponse } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });
      
      const existingUser = authResponse?.users?.find(user => user.email === barberEmail);

      if (existingUser) {
        const { error } = await supabase.auth.admin.deleteUser(existingUser.id);

        if (error) {
          throw error;
        }

        toast({
          title: "Usuário excluído!",
          description: `Acesso ao painel removido para ${barberName}.`,
        });

        if (onClose) {
          onClose();
        }
      } else {
        toast({
          title: "Aviso",
          description: "Usuário não encontrado no sistema de autenticação.",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader className="border-b border-gray-700">
        <CardTitle className="flex items-center gap-2 text-urbana-gold font-playfair">
          <Key className="h-5 w-5" />
          Gerenciar Acesso ao Painel
        </CardTitle>
        <p className="text-gray-300 text-sm font-raleway">
          Configure senha e acesso ao painel do barbeiro para <strong>{barberName}</strong>
        </p>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {/* Informações do Barbeiro */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Nome:</span>
              <span className="text-white font-medium">{barberName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Email:</span>
              <span className="text-white font-medium">{barberEmail || 'Não informado'}</span>
            </div>
          </div>
        </div>

        {!barberEmail && (
          <Alert className="border-red-700 bg-red-900/20">
            <AlertDescription className="text-red-300">
              Email é obrigatório para criar acesso ao painel. Configure o email do barbeiro primeiro.
            </AlertDescription>
          </Alert>
        )}

        {barberEmail && (
          <>
            {/* Geração de Senha */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-white">Definir Nova Senha</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateRandomPassword}
                  className="border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold hover:text-black"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Gerar Senha
                </Button>
              </div>

              <div className="space-y-4">
                {/* Campo Senha */}
                <div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite a nova senha"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className="bg-black border-urbana-gold/30 text-white pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Campo Confirmar Senha */}
                <div>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirme a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-black border-urbana-gold/30 text-white pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Validação de Senha */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">Força da senha:</span>
                      <Badge 
                        variant={passwordStrength.isValid ? "default" : "destructive"}
                        className={passwordStrength.isValid ? "bg-green-600" : "bg-red-600"}
                      >
                        {passwordStrength.isValid ? 'Forte' : 'Fraca'}
                      </Badge>
                    </div>
                    {passwordStrength.errors.length > 0 && (
                      <ul className="text-sm text-red-400 space-y-1 pl-4">
                        {passwordStrength.errors.map((error, index) => (
                          <li key={index} className="list-disc">{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Verificação de Confirmação */}
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-400 text-sm">As senhas não coincidem</p>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3 pt-4 border-t border-gray-700">
              <Button
                onClick={handleCreateOrUpdatePassword}
                disabled={loading || !passwordStrength.isValid || password !== confirmPassword}
                className="flex-1 bg-urbana-gold text-black hover:bg-urbana-gold/90"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Senha
                  </>
                )}
              </Button>

              <Button
                onClick={handleDeleteUser}
                disabled={loading}
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover Acesso
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BarberPasswordManager;
