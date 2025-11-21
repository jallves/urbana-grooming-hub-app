
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UsersTab from './users/UsersTab';
import UserRolesList from './users/UserRolesList';
import AdminManagerTab from './AdminManagerTab';
import { Users, Shield, UserCog } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [error, setError] = useState<string | null>(null);

  const handleRolesListError = (err: string) => {
    setError(err || 'Erro ao carregar cargos e permissões.');
  };

  return (
    <div className="h-full w-full bg-gray-50 overflow-hidden">
      <div className="h-full flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-gray-200 h-12 mb-4 rounded-lg">
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2 py-2 px-3 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700 hover:text-urbana-gold transition-all duration-200"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger 
              value="admin-manager" 
              className="flex items-center gap-2 py-2 px-3 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700 hover:text-urbana-gold transition-all duration-200"
            >
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">Admin/Gerente</span>
              <span className="sm:hidden">Admin</span>
            </TabsTrigger>
            <TabsTrigger 
              value="roles" 
              className="flex items-center gap-2 py-2 px-3 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700 hover:text-urbana-gold transition-all duration-200"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Permissões</span>
              <span className="sm:hidden">Perm.</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="users" className="h-full m-0 overflow-hidden">
              <Card className="bg-white border-gray-200 h-full flex flex-col">
                <CardHeader className="pb-3 px-4 flex-shrink-0">
                  <CardTitle className="text-gray-900 text-lg">Usuários do Sistema</CardTitle>
                  <CardDescription className="text-gray-700 text-sm">
                    Gerencie os usuários cadastrados no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto p-4">
                    <UsersTab />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admin-manager" className="h-full m-0 overflow-hidden">
              <Card className="bg-white border-gray-200 h-full flex flex-col">
                <CardHeader className="pb-3 px-4 flex-shrink-0">
                  <CardTitle className="text-gray-900 text-lg">Administradores e Gerentes</CardTitle>
                  <CardDescription className="text-gray-700 text-sm">
                    Gerencie os usuários administrativos do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto p-4">
                    <AdminManagerTab />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="roles" className="h-full m-0 overflow-hidden">
              <Card className="bg-white border-gray-200 h-full flex flex-col">
                <CardHeader className="pb-3 px-4 flex-shrink-0">
                  <CardTitle className="text-gray-900 text-lg">Cargos e Permissões</CardTitle>
                  <CardDescription className="text-gray-700 text-sm">
                    Configure cargos e permissões do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto p-4">
                    {error ? (
                      <div className="p-4 bg-red-100 text-red-700 rounded border border-red-300">
                        {error}
                      </div>
                    ) : (
                      <UserRolesList onError={handleRolesListError} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default UserManagement;
