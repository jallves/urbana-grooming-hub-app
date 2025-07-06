
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminRoute from '@/components/auth/AdminRoute';
import { UserCheck, ListFilter } from 'lucide-react';
import BarberManagement from '@/components/admin/barbers/BarberManagement';
import ModernCard from '@/components/ui/containers/ModernCard';

// Componente para gerenciar permissões
const UserRolesList: React.FC = () => {
  return (
    <div className="p-4 sm:p-6">
      <h4 className="text-lg font-semibold mb-3 text-gray-900">Lista de Permissões</h4>
      <p className="text-gray-600">Gerencie os cargos e permissões dos usuários</p>
    </div>
  );
};

const AdminBarbers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'barbers' | 'roles'>('barbers');

  return (
    <AdminRoute>
      <AdminLayout title="Equipe">
        <div className="space-y-6 sm:space-y-8">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'barbers' | 'roles')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 border border-gray-200 rounded-lg p-1">
              <TabsTrigger 
                value="barbers" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-gray-700 py-2 px-3 text-sm font-medium transition-all"
              >
                <div className="flex items-center justify-center sm:justify-start">
                  <UserCheck className="h-4 w-4 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Barbeiros</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="roles" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white text-gray-700 py-2 px-3 text-sm font-medium transition-all"
              >
                <div className="flex items-center justify-center sm:justify-start">
                  <ListFilter className="h-4 w-4 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Permissões</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="barbers" className="mt-6">
              <ModernCard
                title="Gestão de Barbeiros"
                description="Gerencie barbeiros e permissões do sistema"
                className="w-full"
                contentClassName="overflow-x-auto"
              >
                <div className="min-w-[600px] md:min-w-full">
                  <BarberManagement />
                </div>
              </ModernCard>
            </TabsContent>
            
            <TabsContent value="roles" className="mt-6">
              <ModernCard
                title="Controle de Acessos"
                description="Gerencie cargos e permissões dos usuários"
                className="w-full"
              >
                <UserRolesList />
              </ModernCard>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBarbers;
