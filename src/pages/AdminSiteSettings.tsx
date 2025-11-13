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
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6 bg-gray-100 border border-gray-200 p-1 gap-1">
              <TabsTrigger 
                value="banners" 
                className="bg-gradient-to-r from-pink-600 to-rose-600 text-white font-raleway font-semibold py-2 sm:py-3 rounded-md data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] transition-all"
              >
                <Image className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">🎨 Banners</span>
                <span className="sm:hidden">Ban</span>
              </TabsTrigger>
              <TabsTrigger 
                value="gallery"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-raleway font-semibold py-2 sm:py-3 rounded-md data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] transition-all"
              >
                <Image className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">📸 Galeria</span>
                <span className="sm:hidden">Gal</span>
              </TabsTrigger>
              <TabsTrigger 
                value="services"
                className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-raleway font-semibold py-2 sm:py-3 rounded-md data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] transition-all"
              >
                <Star className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">⭐ Destaque</span>
                <span className="sm:hidden">Dest</span>
              </TabsTrigger>
              <TabsTrigger 
                value="general"
                className="bg-gradient-to-r from-slate-600 to-gray-600 text-white font-raleway font-semibold py-2 sm:py-3 rounded-md data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] transition-all"
              >
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">⚙️ Config</span>
                <span className="sm:hidden">Conf</span>
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
