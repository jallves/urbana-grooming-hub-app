
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, RefreshCw } from 'lucide-react';
import UserTable from './UserTable';
import AddUserDialog from './AddUserDialog';
import UserRoleDialog from './UserRoleDialog';
import { useUserManagement } from './hooks/useUserManagement';
import { UserWithRole } from './types';

const UsersTab: React.FC = () => {
  const {
    users,
    loading,
    searchQuery,
    setSearchQuery,
    fetchUsers,
    handleDeleteUser,
  } = useUserManagement();
  
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAddUser = () => {
    setAddUserOpen(true);
  };

  const handleRoleChange = (user: UserWithRole) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers();
    setIsRefreshing(false);
  };

  return (
    <>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              className="pl-10 bg-white border-gray-200 focus:border-urbana-gold focus:ring-urbana-gold/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button 
              onClick={handleAddUser}
              className="flex-1 sm:flex-none bg-gradient-to-r from-urbana-gold to-yellow-500 hover:from-urbana-gold-dark hover:to-yellow-600 text-white shadow-sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Usuário
            </Button>
          </div>
        </div>
      </div>

      <UserTable 
        users={users} 
        loading={loading} 
        onUpdateRole={handleRoleChange}
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
    </>
  );
};

export default UsersTab;
