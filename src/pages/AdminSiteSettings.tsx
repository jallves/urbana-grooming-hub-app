import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Star } from 'lucide-react';
import BannerManager from '@/components/admin/settings/media/BannerManager';
import GalleryManager from '@/components/admin/settings/media/GalleryManager';
import FeaturedServicesManager from '@/components/admin/settings/site/FeaturedServicesManager';
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
      <div className="w-full h-full flex flex-col bg-white">
        {/* Tabs */}
        <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
          <Tabs defaultValue="banners" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 bg-slate-50 border border-slate-200 p-1 gap-1 rounded-xl">
              <TabsTrigger 
                value="banners" 
                className="font-raleway font-semibold py-2 sm:py-2.5 lg:py-3 px-2 sm:px-3 rounded-lg text-slate-500 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:border data-[state=active]:border-rose-200 data-[state=active]:shadow-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 text-[10px] sm:text-sm"
              >
                <Image className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Banner</span>
              </TabsTrigger>
              <TabsTrigger 
                value="gallery"
                className="font-raleway font-semibold py-2 sm:py-2.5 lg:py-3 px-2 sm:px-3 rounded-lg text-slate-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:border data-[state=active]:border-violet-200 data-[state=active]:shadow-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 text-[10px] sm:text-sm"
              >
                <Image className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Galeria</span>
              </TabsTrigger>
              <TabsTrigger 
                value="services"
                className="font-raleway font-semibold py-2 sm:py-2.5 lg:py-3 px-2 sm:px-3 rounded-lg text-slate-500 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:border data-[state=active]:border-amber-200 data-[state=active]:shadow-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 text-[10px] sm:text-sm"
              >
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Destaque</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="banners" className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl font-playfair font-bold text-slate-800 mb-1">
                    🎨 Banners Rotativos
                  </h2>
                  <p className="text-sm text-slate-500 font-raleway">
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
              <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl font-playfair font-bold text-slate-800 mb-1">
                    📸 Galeria de Fotos
                  </h2>
                  <p className="text-sm text-slate-500 font-raleway">
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
              <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl font-playfair font-bold text-slate-800 mb-1">
                    ⭐ Serviços em Destaque
                  </h2>
                  <p className="text-sm text-slate-500 font-raleway">
                    Selecione quais serviços aparecerão na página inicial do site
                  </p>
                </div>
                <FeaturedServicesManager />
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSiteSettings;
