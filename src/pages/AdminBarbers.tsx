
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCheck, Shield } from 'lucide-react';
import BarberManagement from '@/components/admin/barbers/BarberManagement';
import BarberAccessManagement from '@/components/admin/barbers/BarberAccessManagement';

const AdminBarbers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'barbers' | 'access'>('barbers');

  return (
    <AdminLayout title="Equipe">
      <div className="w-full space-y-4 sm:space-y-6">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'barbers' | 'access')}
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
              value="access" 
              className="data-[state=active]:bg-urbana-gold data-[state=active]:text-black text-gray-300 py-2 px-3 text-sm font-medium transition-all font-raleway"
            >
              <div className="flex items-center justify-center sm:justify-start">
                <Shield className="h-4 w-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Acesso ao Painel</span>
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
