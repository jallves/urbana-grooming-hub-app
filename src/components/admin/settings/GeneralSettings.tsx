
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShopSettingsForm from './ShopSettingsForm';
import UserManagement from './UserManagement';

const GeneralSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações Gerais</h1>
        <p className="text-gray-500">Gerencie as configurações da barbearia e permissões de usuários</p>
      </div>

      <Tabs defaultValue="shop">
        <TabsList>
          <TabsTrigger value="shop">Barbearia</TabsTrigger>
          <TabsTrigger value="users">Usuários e Permissões</TabsTrigger>
        </TabsList>
        
        <TabsContent value="shop" className="mt-6">
          <ShopSettingsForm />
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeneralSettings;
