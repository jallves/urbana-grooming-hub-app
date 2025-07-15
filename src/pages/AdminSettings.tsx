
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
        <div className="w-full h-full bg-white">
          <div className="max-w-full mx-auto p-4 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-50 border border-gray-200 rounded-md p-1 h-12">
                <TabsTrigger 
                  value="shop" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-700 py-2 px-3 text-sm font-normal transition-all duration-150"
                >
                  <Settings className="h-4 w-4" />
                  <span>Barbearia</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="media" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-700 py-2 px-3 text-sm font-normal transition-all duration-150"
                >
                  <Image className="h-4 w-4" />
                  <span>Banners & Galeria</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-700 py-2 px-3 text-sm font-normal transition-all duration-150"
                >
                  <Users className="h-4 w-4" />
                  <span>Usuários</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="shop" className="mt-4 w-full">
                <ShopSettingsForm />
              </TabsContent>
              
              <TabsContent value="media" className="mt-4 w-full">
                <BannerGallerySettings />
              </TabsContent>

              <TabsContent value="users" className="mt-4 w-full">
                <UserManagement />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminSettings;
