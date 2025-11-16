import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Settings2, Bell } from "lucide-react";
import TEFHomologacao from '@/components/admin/tef/TEFHomologacao';
import TEFSettingsForm from '@/components/admin/tef/TEFSettingsForm';
import VapidKeyGenerator from '@/components/admin/settings/VapidKeyGenerator';

const AdminSettings: React.FC = () => {
  return (
    <AdminLayout 
      title="Configurações do Sistema" 
      description="Configure o TEF, notificações push e outras integrações"
      icon="⚙️"
    >
      <div className="w-full h-full p-6">
        <Tabs defaultValue="push-notifications" className="w-full">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger 
              value="push-notifications"
              className="data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notificações Push
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

          <TabsContent value="push-notifications" className="mt-6">
            <VapidKeyGenerator />
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
