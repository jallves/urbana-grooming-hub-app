import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Trash2, Shield, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';

interface AdminUser {
  id: string;
  email: string;
  role: 'master' | 'admin' | 'manager';
  created_at: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  user_id: string | null;
}

const AdminManagerTab: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'manager'>('admin');
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchAdminUsers();
    fetchStaffMembers();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      setLoadingStaff(true);
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, email, user_id')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar funcionários:', error);
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          role,
          user_id,
          created_at
        `)
        .in('role', ['master', 'admin', 'manager']);

      if (error) throw error;

      // Buscar emails dos usuários
      const { data: authUsersData } = await supabase.auth.admin.listUsers();
      
      const usersMap = new Map<string, string>();
      if (authUsersData && 'users' in authUsersData) {
        const users = authUsersData.users as Array<{ id: string; email?: string }>;
        users.forEach((u) => {
          if (u.id && u.email) {
            usersMap.set(u.id, u.email);
          }
        });
      }

      const adminUsers: AdminUser[] = (data || []).map(d => ({
        id: d.user_id,
        email: usersMap.get(d.user_id) || 'Desconhecido',
        role: d.role as 'master' | 'admin' | 'manager',
        created_at: d.created_at,
      }));

      setUsers(adminUsers);
    } catch (error: any) {
      console.error('Erro ao buscar usuários admin:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!selectedStaffId) {
      toast({
        title: 'Erro',
        description: 'Selecione um funcionário',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAdding(true);

      // Buscar funcionário selecionado
      const selectedStaff = staffMembers.find(s => s.id === selectedStaffId);
      if (!selectedStaff) {
        toast({
          title: 'Erro',
          description: 'Funcionário não encontrado',
          variant: 'destructive',
        });
        return;
      }

      // Verificar se o funcionário tem user_id (está vinculado a um usuário)
      if (!selectedStaff.user_id) {
        toast({
          title: 'Erro',
          description: 'Este funcionário não possui conta de usuário vinculada',
          variant: 'destructive',
        });
        return;
      }

      // Verificar se já tem role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', selectedStaff.user_id)
        .in('role', ['master', 'admin', 'manager'])
        .maybeSingle();

      if (existingRole) {
        toast({
          title: 'Erro',
          description: 'Este funcionário já possui uma role administrativa',
          variant: 'destructive',
        });
        return;
      }

      // Adicionar role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedStaff.user_id,
          role: newUserRole,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `${selectedStaff.name} foi adicionado como ${newUserRole === 'admin' ? 'Administrador' : 'Gerente'}`,
      });

      setSelectedStaffId('');
      setNewUserRole('admin');
      fetchAdminUsers();
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar o usuário',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveUser = async (userId: string, userEmail: string) => {
    if (userEmail === 'joao.colimoides@gmail.com') {
      toast({
        title: 'Ação não permitida',
        description: 'O usuário master não pode ser removido',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja remover este usuário?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Usuário removido com sucesso',
      });

      fetchAdminUsers();
    } catch (error: any) {
      console.error('Erro ao remover usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o usuário',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'master':
        return <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">Master</Badge>;
      case 'admin':
        return <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">Administrador</Badge>;
      case 'manager':
        return <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">Gerente</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'master':
        return 'Acesso total ao sistema';
      case 'admin':
        return 'Acesso a todos os módulos exceto Configurações';
      case 'manager':
        return 'Acesso limitado - sem ERP Financeiro e Configurações';
      default:
        return '';
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Card de Adição */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-urbana-gold" />
          Adicionar Administrador/Gerente
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select 
            value={selectedStaffId} 
            onValueChange={setSelectedStaffId}
            disabled={loadingStaff}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={loadingStaff ? "Carregando..." : "Selecione um funcionário"} />
            </SelectTrigger>
            <SelectContent>
              {staffMembers
                .filter(staff => staff.user_id) // Apenas funcionários com conta
                .map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name} ({staff.email})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={newUserRole} onValueChange={(value: 'admin' | 'manager') => setNewUserRole(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Selecione o cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="manager">Gerente</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleAddUser}
            disabled={adding || !selectedStaffId}
            className="bg-gradient-to-r from-urbana-gold to-yellow-500 hover:from-urbana-gold-dark hover:to-yellow-600"
          >
            {adding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              'Adicionar'
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Selecione um funcionário cadastrado no sistema que já possua conta de usuário
        </p>
      </Card>

      {/* Lista de Usuários */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-urbana-gold" />
            Usuários Administrativos
          </h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getRolePermissions(user.role)}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.email !== 'joao.colimoides@gmail.com' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUser(user.id, user.email)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Card Informativo */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Hierarquia de Permissões
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="font-semibold text-purple-600">Master:</span>
            <span>Acesso completo a todos os módulos (joao.colimoides@gmail.com)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-blue-600">Administrador:</span>
            <span>Acesso a todos os módulos exceto Configurações</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-green-600">Gerente:</span>
            <span>Acesso limitado - não pode acessar ERP Financeiro e Configurações</span>
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default AdminManagerTab;
