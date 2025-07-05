
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
    <div className="p-4">
      <h4 className="text-md font-semibold mb-2 text-white">Lista de Permissões</h4>
      <p className="text-black-400">Gerencie os cargos e permissões dos usuários</p>
    </div>
  );
};

const AdminBarbers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'barbers' | 'roles'>('barbers');

  return (
    <AdminRoute>
      <AdminLayout title="Equipe">
        <div className="space-y-8">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'barbers' | 'roles')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10">
              <TabsTrigger value="barbers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-500">
                <UserCheck className="h-4 w-4 mr-2" />
                Barbeiros
              </TabsTrigger>
              <TabsTrigger value="roles" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500">
                <ListFilter className="h-4 w-4 mr-2" />
                Permissões
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="barbers" className="mt-6">
              <ModernCard
                title="Gestão de Barbeiros"
                description="Gerencie barbeiros e permissões do sistema"
                gradient="from-indigo-500/10 to-blue-600/10"
              >
                <BarberManagement />
              </ModernCard>
            </TabsContent>
            
            <TabsContent value="roles" className="mt-6">
              <ModernCard
                title="Controle de Acessos"
                description="Gerencie cargos e permissões dos usuários"
                gradient="from-purple-500/10 to-indigo-600/10"
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
