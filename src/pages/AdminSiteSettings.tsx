import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Image, Star, Settings } from 'lucide-react';
import BannerManager from '@/components/admin/settings/media/BannerManager';
import GalleryManager from '@/components/admin/settings/media/GalleryManager';
import FeaturedServicesManager from '@/components/admin/settings/site/FeaturedServicesManager';
import GeneralSettingsManager from '@/components/admin/settings/site/GeneralSettingsManager';
import { BannerImage, GalleryImage } from '@/types/settings';

const AdminSiteSettings: React.FC = () => {
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  return (
    <AdminLayout 
      title="Gestão do Site" 
      description="Gerencie banners, galeria, serviços em destaque e configurações gerais"
      icon="🌐"
    >
      <div className="w-full h-full flex flex-col bg-gray-50">
        {/* Tabs */}
        <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
          <Tabs defaultValue="banners" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6 bg-white border border-gray-200">
              <TabsTrigger 
                value="banners" 
                className="font-raleway data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black"
              >
                <Image className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Banners</span>
              </TabsTrigger>
              <TabsTrigger 
                value="gallery"
                className="font-raleway data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black"
              >
                <Image className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Galeria</span>
              </TabsTrigger>
              <TabsTrigger 
                value="services"
                className="font-raleway data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black"
              >
                <Star className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Serviços Destaque</span>
              </TabsTrigger>
              <TabsTrigger 
                value="general"
                className="font-raleway data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black"
              >
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Configurações</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="banners" className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl font-playfair font-bold text-gray-900 mb-2">
                    🎨 Banners Rotativos
                  </h2>
                  <p className="text-sm text-gray-600 font-raleway">
                    Gerencie os banners que aparecem no topo da página inicial
                  </p>
                </div>
                <BannerManager 
                  bannerImages={bannerImages} 
                  setBannerImages={setBannerImages} 
                />
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl font-playfair font-bold text-gray-900 mb-2">
                    📸 Galeria de Fotos
                  </h2>
                  <p className="text-sm text-gray-600 font-raleway">
                    Adicione fotos dos trabalhos da barbearia para exibir na home
                  </p>
                </div>
                <GalleryManager 
                  galleryImages={galleryImages} 
                  setGalleryImages={setGalleryImages} 
                />
              </div>
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl font-playfair font-bold text-gray-900 mb-2">
                    ⭐ Serviços em Destaque
                  </h2>
                  <p className="text-sm text-gray-600 font-raleway">
                    Selecione quais serviços aparecerão na página inicial do site
                  </p>
                </div>
                <FeaturedServicesManager />
              </div>
            </TabsContent>

            <TabsContent value="general" className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl font-playfair font-bold text-gray-900 mb-2">
                    ⚙️ Configurações Gerais
                  </h2>
                  <p className="text-sm text-gray-600 font-raleway">
                    Configure informações básicas, redes sociais e textos do site
                  </p>
                </div>
                <GeneralSettingsManager />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSiteSettings;
