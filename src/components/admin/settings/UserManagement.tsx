
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
    <Card className="w-full bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">
          Gerenciamento de Usuários
        </CardTitle>
        <CardDescription className="text-gray-600">
          Gerencie usuários, cargos e permissões no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 border border-gray-200">
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 text-gray-700"
            >
              <Users className="h-4 w-4" />
              <span className="text-sm">Usuários</span>
            </TabsTrigger>
            <TabsTrigger 
              value="roles" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 text-gray-700"
            >
              <Shield className="h-4 w-4" />
              <span className="text-sm">Permissões</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6 w-full">
            <UsersTab />
          </TabsContent>
          
          <TabsContent value="roles" className="mt-6 w-full">
            {error ? (
              <div className="p-4 bg-red-50 text-red-900 rounded border border-red-200">
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
