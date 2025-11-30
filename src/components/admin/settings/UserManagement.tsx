
import React, { useState } from 'react';
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
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-gray-200 rounded-xl p-1.5 h-12 shadow-sm">
          <TabsTrigger 
            value="users" 
            className="flex items-center justify-center gap-2 h-full rounded-lg text-sm font-medium transition-all duration-200
              bg-white/60 text-gray-700 border border-gray-200/50
              data-[state=active]:bg-white data-[state=active]:text-[#C5A15B] 
              data-[state=active]:shadow-md data-[state=active]:border-[#C5A15B]/30"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger 
            value="admin-manager" 
            className="flex items-center justify-center gap-2 h-full rounded-lg text-sm font-medium transition-all duration-200
              bg-white/60 text-gray-700 border border-gray-200/50
              data-[state=active]:bg-white data-[state=active]:text-[#C5A15B] 
              data-[state=active]:shadow-md data-[state=active]:border-[#C5A15B]/30"
          >
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">Admin/Gerente</span>
          </TabsTrigger>
          <TabsTrigger 
            value="roles" 
            className="flex items-center justify-center gap-2 h-full rounded-lg text-sm font-medium transition-all duration-200
              bg-white/60 text-gray-700 border border-gray-200/50
              data-[state=active]:bg-white data-[state=active]:text-[#C5A15B] 
              data-[state=active]:shadow-md data-[state=active]:border-[#C5A15B]/30"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Permissões</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#C5A15B]" />
                Usuários do Sistema
              </h3>
              <p className="text-gray-500 text-sm mt-0.5">Gerencie os usuários cadastrados no sistema</p>
            </div>
            <div className="p-5">
              <UsersTab />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="admin-manager" className="mt-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <UserCog className="h-4 w-4 text-[#C5A15B]" />
                Administradores e Gerentes
              </h3>
              <p className="text-gray-500 text-sm mt-0.5">Gerencie os usuários administrativos do sistema</p>
            </div>
            <div className="p-5">
              <AdminManagerTab />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="roles" className="mt-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#C5A15B]" />
                Cargos e Permissões
              </h3>
              <p className="text-gray-500 text-sm mt-0.5">Configure cargos e permissões do sistema</p>
            </div>
            <div className="p-5">
              {error ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                  {error}
                </div>
              ) : (
                <UserRolesList onError={handleRolesListError} />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;
