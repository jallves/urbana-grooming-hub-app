
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useUserManagement } from './hooks/useUserManagement';
import { Loader2, Search, UserPlus, Users } from 'lucide-react';
import UserRoleDialog from './UserRoleDialog';
import UserTable from './UserTable';
import { UserWithRole } from './types';

const UserRolesList: React.FC = () => {
  const { 
    users, 
    loading, 
    searchQuery, 
    setSearchQuery, 
    syncLoading, 
    handleDeleteUser, 
    handleSyncStaff,
    fetchUsers
  } = useUserManagement();
  
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  // Effect to periodically refresh user list
  useEffect(() => {
    // Initial fetch
    fetchUsers();
    
    // Set up an interval to refresh users every minute
    const intervalId = setInterval(() => {
      console.log('Refreshing user list...');
      fetchUsers();
    }, 60000); // every minute
    
    return () => clearInterval(intervalId);
  }, [fetchUsers]);

  const handleUpdateRole = (user: UserWithRole) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleUserUpdated = useCallback(() => {
    console.log("User updated, refreshing user list");
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Usuários e Permissões</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os usuários e seus níveis de acesso
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={() => {
              console.log('Sync staff button clicked');
              handleSyncStaff();
            }}
            disabled={syncLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {syncLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            <span>Sincronizar Barbeiros</span>
          </Button>
          <Button
            onClick={fetchUsers}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            <span>Atualizar Lista</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : users.length > 0 ? (
          <UserTable 
            users={users} 
            onUpdateRole={handleUpdateRole}
            onDeleteUser={handleDeleteUser}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-2" />
            <h3 className="font-medium">Nenhum usuário encontrado</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery 
                ? "Tente usar outros termos de busca" 
                : "Adicione usuários ao sistema para gerenciar permissões"}
            </p>
          </div>
        )}
      </Card>

      {selectedUser && (
        <UserRoleDialog
          open={roleDialogOpen}
          onOpenChange={setRoleDialogOpen}
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
};

export default UserRolesList;
