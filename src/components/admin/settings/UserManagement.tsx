
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
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-300">
          <TabsTrigger 
            value="users" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-gray-100 data-[state=active]:text-black text-gray-700"
          >
            <Users className="h-4 w-4" />
            <span className="text-sm">Usuários</span>
          </TabsTrigger>
          <TabsTrigger 
            value="roles" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-gray-100 data-[state=active]:text-black text-gray-700"
          >
            <Shield className="h-4 w-4" />
            <span className="text-sm">Permissões</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card className="bg-white border-gray-300">
            <CardHeader>
              <CardTitle className="text-black">Usuários do Sistema</CardTitle>
              <CardDescription className="text-gray-600">
                Gerencie os usuários cadastrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTab />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="roles" className="mt-6">
          <Card className="bg-white border-gray-300">
            <CardHeader>
              <CardTitle className="text-black">Cargos e Permissões</CardTitle>
              <CardDescription className="text-gray-600">
                Configure cargos e permissões do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200">
                  {error}
                </div>
              ) : (
                <UserRolesList onError={handleRolesListError} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;
