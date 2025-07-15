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
    <Card className="w-full bg-gray-900 border border-gray-700">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl font-bold text-white">
          Gerenciamento de Usuários
        </CardTitle>
        <CardDescription className="text-gray-400 text-sm sm:text-base">
          Gerencie usuários, cargos e permissões no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6 w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-gray-700 h-auto">
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-300"
            >
              <Users className="h-4 w-4" />
              <span className="text-sm">Usuários</span>
            </TabsTrigger>
            <TabsTrigger 
              value="roles" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-gray-300"
            >
              <Shield className="h-4 w-4" />
              <span className="text-sm">Permissões</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4 sm:mt-6 w-full">
            <UsersTab />
          </TabsContent>
          
          <TabsContent value="roles" className="mt-4 sm:mt-6 w-full">
            {error ? (
              <div className="p-4 bg-red-900/50 text-red-300 rounded border border-red-700">
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