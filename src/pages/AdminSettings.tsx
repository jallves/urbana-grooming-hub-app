
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
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 rounded-lg p-1">
              <TabsTrigger 
                value="shop" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 text-gray-700 py-2 px-4 text-sm font-medium transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Barbearia</span>
              </TabsTrigger>
              <TabsTrigger 
                value="media" 
                className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-900 text-gray-700 py-2 px-4 text-sm font-medium transition-colors"
              >
                <Image className="h-4 w-4" />
                <span>Banners & Galeria</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="flex items-center gap-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 text-gray-700 py-2 px-4 text-sm font-medium transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>Usuários</span>
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
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminSettings;
