import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Settings2, Users } from "lucide-react";
import TEFHomologacao from '@/components/admin/tef/TEFHomologacao';
import TEFSettingsForm from '@/components/admin/tef/TEFSettingsForm';
import UserManagement from '@/components/admin/settings/UserManagement';

const AdminSettings: React.FC = () => {
  return (
    <AdminLayout 
      title="Configurações do Sistema" 
      description="Configure o TEF e suas integrações de pagamento"
      icon="⚙️"
    >
      <div className="w-full h-full p-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-white border border-gray-200 grid grid-cols-3">
            <TabsTrigger 
              value="users"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger 
              value="tef-homologacao"
              className="data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              TEF Homologação
            </TabsTrigger>
            <TabsTrigger 
              value="tef-settings"
              className="data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Configurações TEF
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6 h-[calc(100vh-250px)]">
            <UserManagement />
          </TabsContent>

          <TabsContent value="tef-homologacao" className="mt-6">
            <TEFHomologacao />
          </TabsContent>

          <TabsContent value="tef-settings" className="mt-6">
            <TEFSettingsForm />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
