
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UsersTab from './users/UsersTab';
import UserRolesList from './users/UserRolesList';
import { Users, Shield } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [error, setError] = useState<string | null>(null);

  const handleRolesListError = (err: string) => {
    setError(err || 'Erro ao carregar cargos e permissões.');
  };

  return (
    <Card className="w-full bg-white border border-gray-200 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-medium text-black">
          Gerenciamento de Usuários
        </CardTitle>
        <CardDescription className="text-gray-600 text-sm">
          Gerencie usuários, cargos e permissões no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-50 border border-gray-200 h-10">
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2 py-2 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-700 text-sm font-normal"
            >
              <Users className="h-4 w-4" />
              <span>Usuários</span>
            </TabsTrigger>
            <TabsTrigger 
              value="roles" 
              className="flex items-center gap-2 py-2 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-700 text-sm font-normal"
            >
              <Shield className="h-4 w-4" />
              <span>Permissões</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4 w-full">
            <UsersTab />
          </TabsContent>
          
          <TabsContent value="roles" className="mt-4 w-full">
            {error ? (
              <div className="p-3 bg-red-50 text-red-900 rounded border border-red-200 text-sm">
                {error}
              </div>
            ) : (
              <UserRolesList onError={handleRolesListError} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
