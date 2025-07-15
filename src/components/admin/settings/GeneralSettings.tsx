
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShopSettingsForm from './ShopSettingsForm';
import UserManagement from './UserManagement';
import { Settings, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const GeneralSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações Gerais</h1>
        <p className="text-gray-600">Gerencie as configurações da barbearia e permissões de usuários</p>
      </div>

      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200">
          <TabsTrigger 
            value="shop" 
            className="flex items-center gap-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-700"
          >
            <Settings className="h-4 w-4" />
            Barbearia
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="flex items-center gap-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-700"
          >
            <Users className="h-4 w-4" />
            Usuários e Permissões
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="shop" className="mt-6">
          <Card className="bg-white border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-gray-900">Configurações da Barbearia</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ShopSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <Card className="bg-white border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-gray-900">Gestão de Usuários</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeneralSettings;
