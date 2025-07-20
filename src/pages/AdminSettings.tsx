
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Image, Users } from "lucide-react";
import ShopSettingsForm from '@/components/admin/settings/ShopSettingsForm';
import UserManagement from '@/components/admin/settings/UserManagement';
import BannerGallerySettings from '@/components/admin/settings/BannerGallerySettings';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('shop');
  
  return (
    <AdminRoute>
      <AdminLayout title="Configurações">
        <div className="h-full min-h-0 flex flex-col bg-gray-950 text-gray-100">
          <div className="p-3 sm:p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800 border border-gray-700 h-auto mb-3">
                <TabsTrigger 
                  value="shop" 
                  className="flex items-center gap-1 sm:gap-2 py-2 px-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-gray-300"
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Barbearia</span>
                  <span className="sm:hidden">Barb.</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="media" 
                  className="flex items-center gap-1 sm:gap-2 py-2 px-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-gray-300"
                >
                  <Image className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Banners & Galeria</span>
                  <span className="sm:hidden">Mídia</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-1 sm:gap-2 py-2 px-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-gray-300"
                >
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Usuários</span>
                  <span className="sm:hidden">User.</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 min-h-0">
                <TabsContent value="shop" className="h-full m-0">
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg h-full overflow-auto">
                    <div className="p-3 sm:p-4 border-b border-gray-700">
                      <h3 className="text-lg font-semibold text-urbana-gold">Configurações da Barbearia</h3>
                      <p className="text-sm text-gray-400">Gerencie as configurações gerais e personalize a aparência do seu site</p>
                    </div>
                    <div className="p-3 sm:p-4">
                      <ShopSettingsForm />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="media" className="h-full m-0">
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg h-full overflow-auto">
                    <div className="p-3 sm:p-4 border-b border-gray-700">
                      <h3 className="text-lg font-semibold text-urbana-gold">Banners e Galeria</h3>
                      <p className="text-sm text-gray-400">Gerencie imagens, banners e galeria do site</p>
                    </div>
                    <div className="p-3 sm:p-4">
                      <BannerGallerySettings />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="users" className="h-full m-0">
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg h-full overflow-auto">
                    <div className="p-3 sm:p-4 border-b border-gray-700">
                      <h3 className="text-lg font-semibold text-urbana-gold">Gestão de Usuários</h3>
                      <p className="text-sm text-gray-400">Gerencie usuários e permissões do sistema</p>
                    </div>
                    <div className="p-3 sm:p-4">
                      <UserManagement />
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminSettings;
