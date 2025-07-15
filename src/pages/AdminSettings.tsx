
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Image, Users } from "lucide-react";
import ShopSettingsForm from '@/components/admin/settings/ShopSettingsForm';
import UserManagement from '@/components/admin/settings/UserManagement';
import BannerGallerySettings from '@/components/admin/settings/BannerGallerySettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('shop');
  
  return (
    <AdminRoute>
      <AdminLayout title="Configurações">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-300 rounded-lg p-1">
              <TabsTrigger 
                value="shop" 
                className="flex items-center gap-2 data-[state=active]:bg-gray-100 data-[state=active]:text-black text-gray-700 py-2 px-3 text-sm font-medium"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Barbearia</span>
                <span className="sm:hidden">Barb.</span>
              </TabsTrigger>
              <TabsTrigger 
                value="media" 
                className="flex items-center gap-2 data-[state=active]:bg-gray-100 data-[state=active]:text-black text-gray-700 py-2 px-3 text-sm font-medium"
              >
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Banners & Galeria</span>
                <span className="sm:hidden">Mídia</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="flex items-center gap-2 data-[state=active]:bg-gray-100 data-[state=active]:text-black text-gray-700 py-2 px-3 text-sm font-medium"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Usuários</span>
                <span className="sm:hidden">User.</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="shop" className="space-y-6 mt-6">
              <Card className="w-full bg-white border-gray-300">
                <CardHeader>
                  <CardTitle className="text-black">Configurações da Barbearia</CardTitle>
                  <CardDescription className="text-gray-600">
                    Gerencie as configurações gerais e personalize a aparência do seu site
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ShopSettingsForm />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="media" className="space-y-6 mt-6">
              <Card className="w-full bg-white border-gray-300">
                <CardHeader>
                  <CardTitle className="text-black">Banners e Galeria</CardTitle>
                  <CardDescription className="text-gray-600">
                    Gerencie imagens, banners e galeria do site
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BannerGallerySettings />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6 mt-6">
              <Card className="w-full bg-white border-gray-300">
                <CardHeader>
                  <CardTitle className="text-black">Gestão de Usuários</CardTitle>
                  <CardDescription className="text-gray-600">
                    Gerencie usuários e permissões do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserManagement />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminSettings;
