
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Image, Users } from "lucide-react";
import ShopSettingsForm from '@/components/admin/settings/ShopSettingsForm';
import UserManagement from '@/components/admin/settings/UserManagement';
import BannerGallerySettings from '@/components/admin/settings/BannerGallerySettings';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('shop');
  
  return (
    <AdminLayout title="Configurações">
      <div className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/40 border border-white/10">
            <TabsTrigger value="shop" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500">
              <Settings className="h-4 w-4" />
              Barbearia
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500">
              <Image className="h-4 w-4" />
              Banners & Galeria
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="shop" className="space-y-6 mt-6">
            <ModernCard
              title="Configurações da Barbearia"
              description="Gerencie as configurações gerais e personalize a aparência do seu site"
              gradient="from-blue-500/10 to-purple-600/10"
            >
              <ShopSettingsForm />
            </ModernCard>
          </TabsContent>
          
          <TabsContent value="media" className="space-y-6 mt-6">
            <ModernCard
              title="Banners e Galeria"
              description="Gerencie imagens, banners e galeria do site"
              gradient="from-green-500/10 to-blue-600/10"
            >
              <BannerGallerySettings />
            </ModernCard>
          </TabsContent>

          <TabsContent value="users" className="space-y-6 mt-6">
            <ModernCard
              title="Gestão de Usuários"
              description="Gerencie usuários e permissões do sistema"
              gradient="from-purple-500/10 to-pink-600/10"
            >
              <UserManagement />
            </ModernCard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
