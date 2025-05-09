
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import UserTable from './users/UserTable';
import AddUserDialog from './users/AddUserDialog';
import UserRoleDialog from './users/UserRoleDialog';
import { toast } from 'sonner';

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

  const filteredUsers = users.filter(
    (user) => user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>
          Gerencie usuários e suas permissões no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
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
          <Button onClick={handleAddUser} className="ml-4">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Usuário
          </Button>
        </div>

        <UserTable 
          users={filteredUsers} 
          loading={loading} 
          onRoleChange={handleRoleChange}
          onDeleteUser={handleDeleteUser}
        />

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
