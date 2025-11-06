
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
        <div className="w-full h-full bg-white overflow-hidden">
          <div className="h-full flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-gray-200 h-14 mb-4 rounded-lg">
                <TabsTrigger 
                  value="shop" 
                  className="flex items-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700 hover:text-gray-900 transition-all duration-200"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Barbearia</span>
                  <span className="sm:hidden">Barb.</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="media" 
                  className="flex items-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700 hover:text-gray-900 transition-all duration-200"
                >
                  <Image className="h-4 w-4" />
                  <span className="hidden sm:inline">Banners & Galeria</span>
                  <span className="sm:hidden">Mídia</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700 hover:text-gray-900 transition-all duration-200"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Usuários</span>
                  <span className="sm:hidden">User.</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-hidden">
                <TabsContent value="shop" className="h-full m-0 overflow-hidden">
                  <div className="bg-white border border-gray-200 rounded-lg h-full flex flex-col shadow-sm">
                    <div className="p-4 border-b border-gray-200 flex-shrink-0">
                      <h3 className="text-lg font-semibold text-gray-900">Configurações da Barbearia</h3>
                      <p className="text-sm text-gray-600">Gerencie as configurações gerais e personalize a aparência do seu site</p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-4">
                        <ShopSettingsForm />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="media" className="h-full m-0 overflow-hidden">
                  <div className="bg-white border border-gray-200 rounded-lg h-full flex flex-col shadow-sm">
                    <div className="p-4 border-b border-gray-200 flex-shrink-0">
                      <h3 className="text-lg font-semibold text-gray-900">Banners e Galeria</h3>
                      <p className="text-sm text-gray-600">Gerencie imagens, banners e galeria do site</p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-4">
                        <BannerGallerySettings />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="users" className="h-full m-0 overflow-hidden">
                  <div className="bg-white border border-gray-200 rounded-lg h-full flex flex-col shadow-sm">
                    <div className="p-4 border-b border-gray-200 flex-shrink-0">
                      <h3 className="text-lg font-semibold text-gray-900">Gestão de Usuários</h3>
                      <p className="text-sm text-gray-600">Gerencie usuários e permissões do sistema</p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-4">
                        <UserManagement />
                      </div>
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
