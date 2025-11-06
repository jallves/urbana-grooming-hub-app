import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Key, RefreshCw, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { supabaseRPC } from '@/types/supabase-rpc';
import { validatePasswordStrength } from '@/lib/security';
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
      console.log('Iniciando processo de criação/atualização de usuário para:', barberEmail);
      
      // Verificar se o barbeiro existe na tabela staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('email', barberEmail)
        .eq('role', 'barber')
        .single();

      if (staffError) {
        console.error('Erro ao buscar barbeiro:', staffError);
        throw new Error('Barbeiro não encontrado na base de dados');
      }

      console.log('Barbeiro encontrado:', staffData);

      // Usar RPC para criar/atualizar usuário admin
      const { data: userData, error: userError } = await supabaseRPC.createBarberUser(
        barberEmail,
        password,
        barberName || staffData.name,
        staffData.id
      );

      if (userError) {
        console.error('Erro ao criar usuário:', userError);
        
        // Se a função RPC falhar, tentar método alternativo
        return await createUserAlternative();
      }

      console.log('Usuário criado/atualizado com sucesso:', userData);

      toast({
        title: "Acesso configurado!",
        description: `Acesso ao painel criado/atualizado para ${barberName} com sucesso.`,
      });

      // Limpar formulário
      setPassword('');
      setConfirmPassword('');
      setPasswordStrength({ isValid: false, errors: [] });
      
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1000);
      }

    } catch (error: any) {
      console.error('Erro ao gerenciar senha:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao configurar acesso do barbeiro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUserAlternative = async () => {
    try {
      console.log('Tentando método alternativo de criação...');
      
      // Tentar criar usuário com signUp
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: barberEmail!,
        password: password,
        options: {
          data: {
            name: barberName,
            role: 'barber'
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          // Usuário já existe, tentar atualizar senha via admin
          await updateExistingUser();
        } else {
          throw signUpError;
        }
      } else if (signUpData.user) {
        // Criar role para o usuário
        await createUserRole(signUpData.user.id);
        
        toast({
          title: "Acesso criado!",
          description: `Conta criada para ${barberName}. ${signUpData.user.email_confirmed_at ? 'Login liberado.' : 'Email de confirmação enviado.'}`,
        });
      }
    } catch (error: any) {
      throw new Error(`Erro no método alternativo: ${error.message}`);
    }
  };

  const updateExistingUser = async () => {
    try {
      // Para usuário existente, enviar reset de senha
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(barberEmail!, {
        redirectTo: `${window.location.origin}/barbeiro/login`
      });

      if (resetError) {
        throw resetError;
      }

      toast({
        title: "Email de reset enviado!",
        description: `Um email para redefinir a senha foi enviado para ${barberEmail}`,
      });
    } catch (error: any) {
      throw new Error(`Erro ao enviar reset: ${error.message}`);
    }
  };

  const createUserRole = async (userId: string) => {
    try {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role: 'barber'
        }]);

      if (roleError && !roleError.message.includes('already exists')) {
        console.warn('Erro ao criar role:', roleError);
      }
    } catch (error) {
      console.warn('Erro ao criar role:', error);
    }
  };

  const handleDeleteUser = async () => {
    if (!barberEmail) return;

    if (!confirm(`Tem certeza que deseja remover o acesso ao painel para ${barberName}?`)) {
      return;
    }

    setLoading(true);

    try {
      console.log('Iniciando processo de remoção de acesso para:', barberEmail);
      
      // Usar RPC para desabilitar usuário
      const { error: deleteError } = await supabaseRPC.disableBarberUser(barberEmail);

      if (deleteError) {
        console.error('Erro ao desabilitar barbeiro:', deleteError);
        throw new Error(`Erro ao remover acesso: ${deleteError.message}`);
      }

      toast({
        title: "Acesso removido!",
        description: `Acesso ao painel desabilitado para ${barberName}.`,
      });

      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1000);
      }

    } catch (error: any) {
      console.error('Erro ao remover acesso:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover acesso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-200 p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-gray-900 font-playfair text-base sm:text-lg">
          <Key className="h-4 w-4 sm:h-5 sm:w-5" />
          Gerenciar Acesso ao Painel
        </CardTitle>
        <p className="text-gray-700 text-xs sm:text-sm font-raleway mt-1">
          Configure senha e acesso ao painel do barbeiro para <strong>{barberName}</strong>
        </p>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
        {/* Informações do Barbeiro */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
              <span className="text-gray-700 text-xs sm:text-sm font-medium">Nome:</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">{barberName}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
              <span className="text-gray-700 text-xs sm:text-sm font-medium">Email:</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base truncate">{barberEmail || 'Não informado'}</span>
            </div>
          </div>
        </div>

        {!barberEmail && (
          <Alert className="border-red-600 bg-red-50 text-red-900">
            <AlertDescription className="text-xs sm:text-sm">
              Email é obrigatório para criar acesso ao painel. Configure o email do barbeiro primeiro.
            </AlertDescription>
          </Alert>
        )}

        {barberEmail && (
          <>
            {/* Geração de Senha */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">Definir Nova Senha</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateRandomPassword}
                  className="border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold hover:text-white w-full sm:w-auto text-xs sm:text-sm touch-manipulation"
                >
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Gerar Senha
                </Button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Campo Senha */}
                <div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite a nova senha"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className="bg-white border-urbana-gold/30 text-gray-900 pr-10 text-sm sm:text-base"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0 text-gray-600 hover:text-gray-900 touch-manipulation"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
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
                      className="bg-white border-urbana-gold/30 text-gray-900 pr-10 text-sm sm:text-base"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0 text-gray-600 hover:text-gray-900 touch-manipulation"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Validação de Senha */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-gray-700">Força da senha:</span>
                      <Badge 
                        variant={passwordStrength.isValid ? "default" : "destructive"}
                        className={`text-xs ${passwordStrength.isValid ? "bg-green-600" : "bg-red-600"}`}
                      >
                        {passwordStrength.isValid ? 'Forte' : 'Fraca'}
                      </Badge>
                    </div>
                    {passwordStrength.errors.length > 0 && (
                      <ul className="text-xs sm:text-sm text-red-600 space-y-1 pl-4">
                        {passwordStrength.errors.map((error, index) => (
                          <li key={index} className="list-disc">{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Verificação de Confirmação */}
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-600 text-xs sm:text-sm">As senhas não coincidem</p>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
              <Button
                onClick={handleCreateOrUpdatePassword}
                disabled={loading || !passwordStrength.isValid || password !== confirmPassword}
                className="flex-1 bg-gradient-to-r from-urbana-gold to-yellow-500 text-white hover:from-urbana-gold/90 hover:to-yellow-600 text-xs sm:text-sm touch-manipulation"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Criar/Atualizar Acesso
                  </>
                )}
              </Button>

              <Button
                onClick={handleDeleteUser}
                disabled={loading}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white text-xs sm:text-sm touch-manipulation"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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
