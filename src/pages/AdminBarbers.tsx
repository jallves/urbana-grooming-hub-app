
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminRoute from '@/components/auth/AdminRoute';
import { UserCheck, ListFilter } from 'lucide-react';
import BarberManagement from '@/components/admin/barbers/BarberManagement';

// Componente para gerenciar permissões
const UserRolesList: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 bg-gray-900 rounded-lg border border-gray-700">
      <h4 className="text-lg font-semibold mb-3 text-urbana-gold font-playfair">Lista de Permissões</h4>
      <p className="text-gray-300 font-raleway text-sm">Gerencie os cargos e permissões dos usuários</p>
    </div>
  );
};

const AdminBarbers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'barbers' | 'roles'>('barbers');

  return (
    <AdminRoute>
      <AdminLayout title="Equipe">
        <div className="w-full max-w-full space-y-4 sm:space-y-6">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'barbers' | 'roles')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-gray-700 rounded-lg p-1 mb-6">
              <TabsTrigger 
                value="barbers" 
                className="data-[state=active]:bg-urbana-gold data-[state=active]:text-black text-gray-300 py-2 px-3 text-sm font-medium transition-all font-raleway"
              >
                <div className="flex items-center justify-center sm:justify-start">
                  <UserCheck className="h-4 w-4 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Barbeiros</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="roles" 
                className="data-[state=active]:bg-urbana-gold data-[state=active]:text-black text-gray-300 py-2 px-3 text-sm font-medium transition-all font-raleway"
              >
                <div className="flex items-center justify-center sm:justify-start">
                  <ListFilter className="h-4 w-4 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Permissões</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="barbers" className="w-full">
              <BarberManagement />
            </TabsContent>
            
            <TabsContent value="roles" className="w-full">
              <UserRolesList />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBarbers;
