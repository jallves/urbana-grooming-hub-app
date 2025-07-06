
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminRoute from '@/components/auth/AdminRoute';
import { UserCheck, ListFilter } from 'lucide-react';
import BarberManagement from '@/components/admin/barbers/BarberManagement';
import ModernCard from '@/components/ui/containers/ModernCard';

// Componente para gerenciar permissões - Responsivo
const UserRolesList: React.FC = () => {
  return (
    <div className="p-2 sm:p-4 md:p-6">
      <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 text-gray-900 dark:text-white">
        Lista de Permissões
      </h4>
      <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
        Gerencie os cargos e permissões dos usuários
      </p>
    </div>
  );
};

const AdminBarbers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'barbers' | 'roles'>('barbers');

  return (
    <AdminRoute>
      <AdminLayout title="Equipe">
        <div className="space-y-3 px-2 py-2 sm:space-y-4 sm:px-3 sm:py-3 md:space-y-6 md:px-4 md:py-4 lg:space-y-8 lg:px-6 lg:py-6 w-full max-w-full overflow-hidden">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'barbers' | 'roles')}
            className="w-full max-w-full"
          >
            {/* TabsList responsivo com melhor adaptação mobile */}
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5 sm:p-1 h-auto min-h-[40px] sm:min-h-[44px]">
              <TabsTrigger 
                value="barbers" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-500 data-[state=active]:text-white py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-all rounded-md"
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline text-xs sm:text-sm">Barbeiros</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="roles" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-all rounded-md"
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <ListFilter className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline text-xs sm:text-sm">Permissões</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            {/* Tab Content para Barbeiros */}
            <TabsContent value="barbers" className="mt-3 sm:mt-4 md:mt-6 w-full">
              <ModernCard
                title="Gestão de Barbeiros"
                description="Gerencie barbeiros e permissões do sistema"
                gradient="from-indigo-500/10 to-blue-600/10"
                className="w-full max-w-full"
                headerClassName="px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4"
                contentClassName="overflow-x-auto p-2 sm:p-3 md:p-4"
              >
                {/* Container com scroll horizontal para mobile */}
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[280px] sm:min-w-[400px] md:min-w-[600px] lg:min-w-full">
                    <BarberManagement />
                  </div>
                </div>
              </ModernCard>
            </TabsContent>
            
            {/* Tab Content para Permissões */}
            <TabsContent value="roles" className="mt-3 sm:mt-4 md:mt-6 w-full">
              <ModernCard
                title="Controle de Acessos"
                description="Gerencie cargos e permissões dos usuários"
                gradient="from-purple-500/10 to-indigo-600/10"
                className="w-full max-w-full"
                headerClassName="px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4"
                contentClassName="p-0"
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
