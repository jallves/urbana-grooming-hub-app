
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCheck, Shield } from 'lucide-react';
import BarberManagement from '@/components/admin/barbers/BarberManagement';
import BarberAccessManagement from '@/components/admin/barbers/BarberAccessManagement';

const AdminBarbers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'barbers' | 'access'>('barbers');

  return (
    <AdminLayout 
      title="Gestão de Barbeiros" 
      description="Gerencie a equipe e permissões de acesso"
      icon="✂️"
    >
      <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6 space-y-4 sm:space-y-6 bg-gray-50">
        <Tabs
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'barbers' | 'access')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 border border-gray-200 rounded-lg p-1 mb-6 gap-1">
            <TabsTrigger 
              value="barbers" 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-md text-sm font-semibold transition-all font-raleway data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]"
            >
              <div className="flex items-center justify-center sm:justify-start">
                <UserCheck className="h-4 w-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">👤 Gestão de Barbeiros</span>
                <span className="sm:hidden">Barbeiros</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="access" 
              className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 px-4 rounded-md text-sm font-semibold transition-all font-raleway data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]"
            >
              <div className="flex items-center justify-center sm:justify-start">
                <Shield className="h-4 w-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">🔐 Permissões de Acesso</span>
                <span className="sm:hidden">Acesso</span>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="barbers" className="w-full">
            <BarberManagement />
          </TabsContent>
          
          <TabsContent value="access" className="w-full">
            <BarberAccessManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminBarbers;
