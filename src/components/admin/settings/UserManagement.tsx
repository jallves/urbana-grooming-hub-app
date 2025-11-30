
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
    <div className="h-full w-full bg-gradient-to-br from-gray-50 to-gray-100/50 overflow-hidden rounded-lg">
      <div className="h-full flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-gray-200/80 h-12 mb-4 rounded-xl shadow-sm p-1">
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2 py-2.5 px-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger 
              value="admin-manager" 
              className="flex items-center gap-2 py-2.5 px-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
            >
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">Admin/Gerente</span>
            </TabsTrigger>
            <TabsTrigger 
              value="roles" 
              className="flex items-center gap-2 py-2.5 px-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Permissões</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="users" className="h-full m-0 overflow-hidden">
              <Card className="bg-white/90 backdrop-blur-sm border-gray-200/80 h-full flex flex-col shadow-sm">
                <CardHeader className="pb-4 px-5 flex-shrink-0 border-b border-gray-100">
                  <CardTitle className="text-gray-900 text-lg font-semibold">Usuários do Sistema</CardTitle>
                  <CardDescription className="text-gray-500 text-sm">
                    Gerencie os usuários cadastrados no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto p-5">
                    <UsersTab />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admin-manager" className="h-full m-0 overflow-hidden">
              <Card className="bg-white/90 backdrop-blur-sm border-gray-200/80 h-full flex flex-col shadow-sm">
                <CardHeader className="pb-4 px-5 flex-shrink-0 border-b border-gray-100">
                  <CardTitle className="text-gray-900 text-lg font-semibold">Administradores e Gerentes</CardTitle>
                  <CardDescription className="text-gray-500 text-sm">
                    Gerencie os usuários administrativos do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto p-5">
                    <AdminManagerTab />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="roles" className="h-full m-0 overflow-hidden">
              <Card className="bg-white/90 backdrop-blur-sm border-gray-200/80 h-full flex flex-col shadow-sm">
                <CardHeader className="pb-4 px-5 flex-shrink-0 border-b border-gray-100">
                  <CardTitle className="text-gray-900 text-lg font-semibold">Cargos e Permissões</CardTitle>
                  <CardDescription className="text-gray-500 text-sm">
                    Configure cargos e permissões do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto p-5">
                    {error ? (
                      <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
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
