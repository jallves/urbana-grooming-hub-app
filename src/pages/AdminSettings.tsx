
import React, { useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import GeneralSettings from '../components/admin/settings/GeneralSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Image } from "lucide-react";
import BannerGallerySettings from '../components/admin/settings/BannerGallerySettings';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações da Barbearia</h1>
          <p className="text-gray-500">Gerencie as configurações gerais e personalize a aparência do seu site</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Gerais
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Banners & Galeria
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6 mt-6">
            <GeneralSettings />
          </TabsContent>
          
          <TabsContent value="media" className="space-y-6 mt-6">
            <BannerGallerySettings />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
