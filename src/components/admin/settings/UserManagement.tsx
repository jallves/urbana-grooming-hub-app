
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
    <Card className="w-full bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-lg border border-white/10">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Gerenciamento de Usuários
        </CardTitle>
        <CardDescription className="text-gray-400 text-sm sm:text-base">
          Gerencie usuários, cargos e permissões no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6 w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10 h-auto">
            <TabsTrigger value="users" className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500">
              <Users className="h-4 w-4" />
              <span className="text-sm">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Permissões</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4 sm:mt-6 w-full">
            <UsersTab />
          </TabsContent>
          
          <TabsContent value="roles" className="mt-4 sm:mt-6 w-full">
            {error ? (
              <div className="p-4 bg-red-100 text-red-600 rounded">
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
