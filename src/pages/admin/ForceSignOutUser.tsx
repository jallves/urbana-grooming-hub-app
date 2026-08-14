import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Search, User, Mail, UserX, AlertTriangle, LogOut } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface UserData {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

const ForceSignOutUser: React.FC = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const searchUser = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Digite o email do usuário para buscar",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setUserData(null);

    try {
      console.log('🔍 Buscando usuário...');

      // Buscar usuário por email na tabela user_roles
      const { data: userRoles, error: usersError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .limit(100);
      
      if (usersError) {
        throw usersError;
      }

      // Buscar dados de email usando Edge Function
      let targetUser = null;
      let targetUserRole = null;

      if (userRoles) {
        for (const userRole of userRoles) {
          const { data: authData, error: authError } = await supabase.functions.invoke('admin-auth-operations', {
            body: { 
              operation: 'get_user_by_id',
              user_id: userRole.user_id 
            }
          });
          
          if (!authError && authData?.user?.email?.toLowerCase() === searchEmail.toLowerCase()) {
            targetUser = authData.user;
            targetUserRole = userRole.role;
            break;
          }
        }
      }

      if (!targetUser) {
        toast({
          title: "Usuário não encontrado",
          description: "Nenhum usuário encontrado com este email",
          variant: "destructive",
        });
        return;
      }

      setUserData({
        id: targetUser.id,
        email: targetUser.email || '',
        role: targetUserRole || 'Sem role',
        created_at: targetUser.created_at
      });

      toast({
        title: "Usuário encontrado",
        description: `${targetUser.email} - ${targetUserRole || 'Sem role'}`,
      });

    } catch (error: any) {
      console.error('Erro ao buscar usuário:', error);
      toast({
        title: "Erro ao buscar usuário",
        description: error.message || "Ocorreu um erro ao buscar o usuário",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleForceSignOut = async () => {
    if (!userData) return;

    setLoading(true);

    try {
      console.log('🚪 Forçando logout do usuário');

      // Usar edge function em vez de RPC que não existe
      const { data, error } = await supabase.functions.invoke('admin-auth-operations', {
        body: {
          operation: 'force_logout',
          user_id: userData.id,
          reason: reason || 'Não especificada'
        }
      });

      if (error) throw error;

      console.log('✅ Logout forçado:', data);

      toast({
        title: "✅ Sessão encerrada com sucesso",
        description: `As sessões de ${userData.email} foram invalidadas. O usuário será deslogado automaticamente.`,
        duration: 5000,
      });

      // Limpar formulário
      setUserData(null);
      setSearchEmail('');
      setReason('');
      setShowConfirmDialog(false);

    } catch (error: any) {
      console.error('❌ Erro ao forçar logout:', error);
      toast({
        title: "Erro ao encerrar sessão",
        description: error.message || "Ocorreu um erro ao invalidar a sessão do usuário",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Gerenciar Sessões"
      description="Derrubar sessões de usuários com problemas de autenticação"
    >
      <div className="space-y-6">
        {/* Card de busca */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Usuário
            </CardTitle>
            <CardDescription>
              Digite o email do usuário para buscar e gerenciar suas sessões
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do usuário</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                  disabled={searching}
                />
                <Button 
                  onClick={searchUser} 
                  disabled={searching || !searchEmail.trim()}
                >
                  {searching ? (
                    <>Buscando...</>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de resultado */}
        {userData && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <User className="h-5 w-5" />
                Usuário Encontrado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2 text-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">{userData.email}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Role</Label>
                  <div className="flex items-center gap-2 text-foreground">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">{userData.role}</span>
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label className="text-sm text-muted-foreground">User ID</Label>
                  <div className="text-xs text-foreground font-mono bg-background p-2 rounded border">
                    {userData.id}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Ex: Usuário com sessão travada em loop, reportou problema de login, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-900">
                    Atenção: Ação Administrativa
                  </p>
                  <p className="text-sm text-yellow-800">
                    Ao derrubar as sessões, o usuário será imediatamente desconectado de todos os dispositivos e precisará fazer login novamente.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowConfirmDialog(true)}
                variant="destructive"
                className="w-full"
                disabled={loading}
              >
                <UserX className="h-4 w-4 mr-2" />
                Derrubar Todas as Sessões
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialog de confirmação */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-destructive" />
                Confirmar Ação Administrativa
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Tem certeza que deseja derrubar <strong>todas as sessões</strong> de:
                </p>
                <div className="p-3 bg-muted rounded-lg font-medium">
                  {userData?.email}
                </div>
                <p className="text-destructive font-medium">
                  ⚠️ Esta ação não pode ser desfeita e o usuário será desconectado imediatamente.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleForceSignOut}
                disabled={loading}
                className="bg-destructive hover:bg-destructive/90"
              >
                {loading ? 'Processando...' : 'Sim, derrubar sessões'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default ForceSignOutUser;
