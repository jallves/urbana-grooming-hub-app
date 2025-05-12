
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search } from 'lucide-react';
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
    syncLoading,
    fetchUsers,
    handleDeleteUser,
    handleSyncStaff
  } = useUserManagement();
  
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);

  const handleAddUser = () => {
    setAddUserOpen(true);
  };

  const handleRoleChange = (user: UserWithRole) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  return (
    <>
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
