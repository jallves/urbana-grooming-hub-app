
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Image, Users } from "lucide-react";
import ShopSettingsForm from '@/components/admin/settings/ShopSettingsForm';
import UserManagement from '@/components/admin/settings/UserManagement';
import BannerGallerySettings from '@/components/admin/settings/BannerGallerySettings';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('shop');
  
  return (
    <AdminRoute>
      <AdminLayout title="Configurações">
        <div className="space-y-6 sm:space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-gray-200 rounded-lg p-1">
              <TabsTrigger 
                value="shop" 
                className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-gray-700 py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-all"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Barbearia</span>
                <span className="sm:hidden">Barb.</span>
              </TabsTrigger>
              <TabsTrigger 
                value="media" 
                className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-gray-700 py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-all"
              >
                <Image className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Banners & Galeria</span>
                <span className="sm:hidden">Mídia</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white text-gray-700 py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-all"
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Usuários</span>
                <span className="sm:hidden">User.</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="shop" className="space-y-6 mt-6">
              <ModernCard
                title="Configurações da Barbearia"
                description="Gerencie as configurações gerais e personalize a aparência do seu site"
                className="w-full max-w-full"
                contentClassName="overflow-hidden"
              >
                <div className="w-full overflow-hidden">
                  <ShopSettingsForm />
                </div>
              </ModernCard>
            </TabsContent>
            
            <TabsContent value="media" className="space-y-6 mt-6">
              <ModernCard
                title="Banners e Galeria"
                description="Gerencie imagens, banners e galeria do site"
                className="w-full max-w-full"
                contentClassName="overflow-hidden"
              >
                <div className="w-full overflow-hidden">
                  <BannerGallerySettings />
                </div>
              </ModernCard>
            </TabsContent>

            <TabsContent value="users" className="space-y-6 mt-6">
              <ModernCard
                title="Gestão de Usuários"
                description="Gerencie usuários e permissões do sistema"
                className="w-full max-w-full"
                contentClassName="overflow-hidden"
              >
                <div className="w-full overflow-hidden">
                  <UserManagement />
                </div>
              </ModernCard>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminSettings;
