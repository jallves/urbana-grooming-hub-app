
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import UserTable from './users/UserTable';
import AddUserDialog from './users/AddUserDialog';
import UserRoleDialog from './users/UserRoleDialog';
import { toast } from 'sonner';
import { Staff } from '@/types/staff';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserRolesList from './users/UserRolesList';

// Define a type for valid roles to match the app_role enum in the database
type AppRole = 'admin' | 'barber' | 'user';

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users from auth.users
      const { data: authUsers, error: authError } = await supabase
        .from('admin_users')
        .select('*');

      if (authError) throw authError;
      
      // Map the data to include roles
      const usersWithRoles = authUsers.map(user => ({
        id: user.id || user.user_id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_login,
        role: user.role || 'user'
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários', { 
        description: (error as Error).message 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setAddUserOpen(true);
  };

  const handleRoleChange = (user: UserWithRole) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Tem certeza que deseja remover este usuário?')) {
      try {
        const { error } = await supabase
          .from('admin_users')
          .delete()
          .eq('id', userId);

        if (error) throw error;

        toast.success('Usuário removido com sucesso');
        fetchUsers();
      } catch (error) {
        console.error('Erro ao remover usuário:', error);
        toast.error('Erro ao remover usuário', { 
          description: (error as Error).message 
        });
      }
    }
  };

  const handleSyncStaff = async () => {
    try {
      setSyncLoading(true);
      
      // Buscar todos os profissionais ativos
      const { data: staffMembers, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true);
        
      if (staffError) throw staffError;
      
      if (!staffMembers || staffMembers.length === 0) {
        toast.info('Não há profissionais ativos para sincronizar');
        return;
      }
      
      // Buscar usuários existentes para evitar duplicatas
      const { data: existingUsers, error: usersError } = await supabase
        .from('admin_users')
        .select('email');
        
      if (usersError) throw usersError;
      
      const existingEmails = new Set(existingUsers?.map(user => user.email?.toLowerCase()) || []);
      
      // Filtrar para pegar apenas profissionais que não estão na lista de usuários
      const newStaff = staffMembers.filter(staff => 
        staff.email && !existingEmails.has(staff.email.toLowerCase())
      );
      
      if (newStaff.length === 0) {
        toast.info('Todos os profissionais já foram sincronizados como usuários');
        return;
      }
      
      // Preparar dados para inserção
      const usersToInsert = newStaff.map((staff: Staff) => ({
        email: staff.email || `${staff.name.replace(/\s+/g, '').toLowerCase()}@exemplo.com`,
        name: staff.name,
        role: 'barber' as AppRole,
        created_at: new Date().toISOString()
      }));
      
      // Inserir os novos usuários
      const { error: insertError, data: insertedUsers } = await supabase
        .from('admin_users')
        .insert(usersToInsert)
        .select();
      
      if (insertError) throw insertError;
      
      // Adicionar registros à tabela user_roles
      if (insertedUsers && insertedUsers.length > 0) {
        // Preparar dados para inserção na tabela user_roles
        const rolesToInsert = insertedUsers.map(user => ({
          user_id: user.id,
          role: 'barber' as AppRole
        }));
        
        // Inserir um por um para evitar erro de tipo
        for (const roleData of rolesToInsert) {
          const { error: roleInsertError } = await supabase
            .from('user_roles')
            .insert(roleData);
            
          if (roleInsertError && !roleInsertError.message.includes('duplicate')) {
            console.error('Erro ao inserir papel:', roleInsertError);
          }
        }
      }
      
      toast.success(`${usersToInsert.length} profissionais foram adicionados como usuários`);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao sincronizar profissionais:', error);
      toast.error('Erro ao sincronizar profissionais', { 
        description: (error as Error).message 
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) => user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>
          Gerencie usuários, cargos e permissões no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="roles">Cargos e Permissões</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddUser} 
                  className="ml-4"
                  disabled={syncLoading}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Usuário
                </Button>
              </div>
            </div>

            <UserTable 
              users={filteredUsers} 
              loading={loading} 
              onRoleChange={handleRoleChange}
              onDeleteUser={handleDeleteUser}
              onSyncStaff={handleSyncStaff}
            />
          </TabsContent>
          
          <TabsContent value="roles">
            <UserRolesList />
          </TabsContent>
        </Tabs>

        <AddUserDialog 
          open={addUserOpen} 
          onOpenChange={setAddUserOpen} 
          onUserAdded={fetchUsers} 
        />

        {selectedUser && (
          <UserRoleDialog
            open={roleDialogOpen}
            onOpenChange={setRoleDialogOpen}
            user={selectedUser}
            onUserUpdated={fetchUsers}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;
