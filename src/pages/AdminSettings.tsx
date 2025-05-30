
import React, { useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Image, Users } from "lucide-react";
import ShopSettingsForm from '../components/admin/settings/ShopSettingsForm';
import UserManagement from '../components/admin/settings/UserManagement';
import BannerGallerySettings from '../components/admin/settings/BannerGallerySettings';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('shop');
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações da Barbearia</h1>
          <p className="text-gray-500">Gerencie as configurações gerais e personalize a aparência do seu site</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              Usuários
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="shop" className="space-y-6 mt-6">
            <ShopSettingsForm />
          </TabsContent>
          
          <TabsContent value="media" className="space-y-6 mt-6">
            <BannerGallerySettings />
          </TabsContent>

          <TabsContent value="users" className="space-y-6 mt-6">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
