
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShopSettingsForm from './ShopSettingsForm';
import UserManagement from './UserManagement';
import BannerGallerySettings from './BannerGallerySettings';
import { Settings, Users, Image } from "lucide-react";

const GeneralSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações Gerais</h1>
        <p className="text-gray-500">Gerencie as configurações da barbearia, banners, galeria e permissões de usuários</p>
      </div>

      <Tabs defaultValue="shop">
        <TabsList>
          <TabsTrigger value="shop" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Barbearia
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Banners & Galeria
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários e Permissões
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="shop" className="mt-6">
          <ShopSettingsForm />
        </TabsContent>
        
        <TabsContent value="media" className="mt-6">
          <BannerGallerySettings />
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeneralSettings;
