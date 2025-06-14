
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UsersTab from './users/UsersTab';
import UserRolesList from './users/UserRolesList';
import { Users } from 'lucide-react';

/**
 * Wrapper para incluir fallback de erro caso loading infinito/erro em UserRolesList.
 * Você pode liberar a edição do UserRolesList para debug caso precise de tratamento mais fino.
 */

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [error, setError] = useState<string | null>(null);

  // Handler para receber erro vindo do UserRolesList
  const handleRolesListError = (err: string) => {
    setError(err || 'Erro ao carregar cargos e permissões.');
  };

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
            <UsersTab />
          </TabsContent>
          
          <TabsContent value="roles">
            {/* Exibe mensagem de erro caso ocorra */}
            {error ? (
              <div className="p-4 bg-red-100 text-red-600 rounded">
                {error}
              </div>
            ) : (
              // Passar callback de erro para UserRolesList se implementado
              <UserRolesList onError={handleRolesListError} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
