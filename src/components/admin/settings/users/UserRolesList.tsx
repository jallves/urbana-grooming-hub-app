
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserManagement } from './hooks/useUserManagement';
import { Loader2, Search, Users, RefreshCw } from 'lucide-react';
import UserRoleDialog from './UserRoleDialog';
import UserTable from './UserTable';
import { UserWithRole } from './types';

interface UserRolesListProps {
  onError?: (err: string) => void;
}

const UserRolesList: React.FC<UserRolesListProps> = ({ onError }) => {
  const { 
    users, 
    loading, 
    searchQuery, 
    setSearchQuery, 
    handleDeleteUser, 
    fetchUsers,
    error,
  } = useUserManagement();
  
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Effect to periodically refresh user list (5 minutos)
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('Refreshing user list...');
      fetchUsers();
    }, 300000);
    return () => clearInterval(intervalId);
  }, [fetchUsers]);

  // Error dispatcher effect
  useEffect(() => {
    if (onError && typeof error === 'string' && error) {
      onError(error);
    }
  }, [error, onError]);

  const handleUpdateRole = (user: UserWithRole) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleUserUpdated = useCallback(() => {
    console.log("User updated, refreshing user list");
    fetchUsers();
  }, [fetchUsers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Usuários e Permissões</h2>
          <p className="text-sm text-gray-500">
            Gerencie os usuários e seus níveis de acesso
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Atualizar Lista</span>
        </Button>
      </div>

      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200 focus:border-urbana-gold focus:ring-urbana-gold/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-urbana-gold" />
            <span className="text-sm text-muted-foreground">Carregando usuários...</span>
          </div>
        </div>
      ) : users.length > 0 ? (
        <UserTable 
          users={users} 
          onUpdateRole={handleUpdateRole}
          onDeleteUser={handleDeleteUser}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-gray-50/50">
          <Users className="h-12 w-12 text-gray-300 mb-3" />
          <h3 className="font-medium text-gray-700">Nenhum usuário encontrado</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {searchQuery 
              ? "Tente usar outros termos de busca" 
              : "Adicione usuários ao sistema para gerenciar permissões"}
          </p>
        </div>
      )}

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
