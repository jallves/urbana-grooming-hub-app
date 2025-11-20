import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Key, ShieldCheck, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BarberPanelAccessProps {
  barberEmail: string;
  barberId: string;
}

interface AuthUserInfo {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

export const BarberPanelAccess: React.FC<BarberPanelAccessProps> = ({
  barberEmail,
  barberId
}) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userInfo, setUserInfo] = useState<AuthUserInfo | null>(null);
  const [password, setPassword] = useState('');
  const [isCreatingAccess, setIsCreatingAccess] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    checkBarberAccess();
  }, [barberEmail]);

  const checkBarberAccess = async () => {
    if (!barberEmail) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Buscar usuário no auth.users pelo email
      const { data, error } = await supabase.auth.admin.listUsers({
        perPage: 1000,
        page: 1
      });

      if (error) throw error;

      const user = data?.users?.find((u: any) => u.email?.toLowerCase() === barberEmail.toLowerCase());

      if (user) {
        setHasAccess(true);
        setUserInfo({
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          email_confirmed_at: user.email_confirmed_at
        });
      } else {
        setHasAccess(false);
        setUserInfo(null);
      }
    } catch (error: any) {
      console.error('Erro ao verificar acesso:', error);
      toast.error('Erro ao verificar acesso do barbeiro', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccess = async () => {
    if (!password || password.length < 6) {
      toast.error('Senha inválida', {
        description: 'A senha deve ter no mínimo 6 caracteres'
      });
      return;
    }

    if (!barberEmail) {
      toast.error('Email não encontrado', {
        description: 'Por favor, insira o email do barbeiro nas informações pessoais'
      });
      return;
    }

    setIsCreatingAccess(true);
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: barberEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          barber_id: barberId,
          role: 'barber'
        }
      });

      if (error) throw error;

      toast.success('Acesso criado com sucesso!', {
        description: 'O barbeiro já pode fazer login no sistema'
      });

      setPassword('');
      checkBarberAccess();
    } catch (error: any) {
      console.error('Erro ao criar acesso:', error);
      toast.error('Erro ao criar acesso', {
        description: error.message
      });
    } finally {
      setIsCreatingAccess(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password || password.length < 6) {
      toast.error('Senha inválida', {
        description: 'A senha deve ter no mínimo 6 caracteres'
      });
      return;
    }

    if (!userInfo?.id) {
      toast.error('Usuário não encontrado');
      return;
    }

    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.admin.updateUserById(userInfo.id, {
        password: password
      });

      if (error) throw error;

      toast.success('Senha redefinida com sucesso!', {
        description: 'O barbeiro já pode fazer login com a nova senha'
      });

      setPassword('');
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast.error('Erro ao redefinir senha', {
        description: error.message
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Acesso ao Painel do Barbeiro
          </CardTitle>
          <CardDescription>
            Carregando informações de acesso...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!barberEmail) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Acesso ao Painel do Barbeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Por favor, insira o email do barbeiro na aba "Informações Pessoais" antes de gerenciar o acesso ao sistema.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Acesso ao Painel do Barbeiro
        </CardTitle>
        <CardDescription>
          Gerencie o acesso do barbeiro ao painel profissional
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status do Acesso */}
        <div className="p-4 rounded-lg border-2 border-dashed" style={{
          borderColor: hasAccess ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
          backgroundColor: hasAccess ? 'hsl(var(--primary) / 0.05)' : 'hsl(var(--muted) / 0.1)'
        }}>
          <div className="flex items-start gap-3">
            {hasAccess ? (
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">
                  {hasAccess ? 'Acesso Ativo' : 'Sem Acesso ao Sistema'}
                </h3>
                <Badge variant={hasAccess ? "default" : "secondary"} className={hasAccess ? "bg-green-600" : ""}>
                  {hasAccess ? 'Cadastrado' : 'Pendente'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {hasAccess 
                  ? `Este barbeiro possui acesso ao painel com o email ${barberEmail}` 
                  : `Este barbeiro ainda não possui credenciais de acesso ao sistema`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Informações do Usuário (se tiver acesso) */}
        {hasAccess && userInfo && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Informações da Conta</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <Label className="text-xs text-gray-500">Email</Label>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  {userInfo.email}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Data de Criação</Label>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(userInfo.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {userInfo.last_sign_in_at && (
                <div>
                  <Label className="text-xs text-gray-500">Último Acesso</Label>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(userInfo.last_sign_in_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-500">Status do Email</Label>
                <Badge variant={userInfo.email_confirmed_at ? "default" : "secondary"} className="mt-1">
                  {userInfo.email_confirmed_at ? 'Confirmado' : 'Pendente'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Formulário de Senha */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-gray-500" />
              <Label className="text-sm font-medium">
                {hasAccess ? 'Redefinir Senha' : 'Criar Senha de Acesso'}
              </Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Digite a nova senha (mínimo 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white"
            />
            <p className="text-xs text-gray-500">
              {hasAccess 
                ? 'Digite uma nova senha para redefinir o acesso do barbeiro ao painel'
                : 'Digite uma senha para criar o acesso do barbeiro ao sistema'
              }
            </p>
          </div>

          <Button
            onClick={hasAccess ? handleResetPassword : handleCreateAccess}
            disabled={isCreatingAccess || isResettingPassword || !password}
            className="w-full"
          >
            {(isCreatingAccess || isResettingPassword) && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            )}
            {hasAccess ? 'Redefinir Senha' : 'Criar Acesso ao Sistema'}
          </Button>
        </div>

        {/* Informações Adicionais */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-sm text-blue-800">
            <strong>ℹ️ Importante:</strong> O barbeiro terá acesso exclusivo ao seu próprio painel profissional, onde poderá visualizar seus agendamentos, comissões e estatísticas pessoais.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
