
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GalleryHorizontal, Database } from "lucide-react";
import { BannerImage } from '@/types/settings';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import BannerManager from './media/BannerManager';
import DatabaseGalleryManager from './media/components/DatabaseGalleryManager';

const BannerGallerySettings: React.FC = () => {
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([
    {
      id: '1',
      image_url: '/hero-background.jpg',
      title: 'Experiência Premium',
      subtitle: 'em Barbearia',
      description: 'A arte da barbearia tradicional com sofisticação moderna',
      button_text: 'Agendar Agora',
      button_link: '/cliente/login',
      is_active: true,
      display_order: 1
    },
    {
      id: '2',
      image_url: '/banner-2.jpg',
      title: 'Estilo & Precisão',
      subtitle: 'para Cavalheiros',
      description: 'Cortes clássicos com um toque contemporâneo',
      button_text: 'Agendar Agora',
      button_link: '/cliente/login',
      is_active: true,
      display_order: 2
    },
    {
      id: '3',
      image_url: '/banner-3.jpg',
      title: 'Ambiente Exclusivo',
      subtitle: 'para Relaxar',
      description: 'Um espaço onde tradição e conforto se encontram',
      button_text: 'Agendar Agora',
      button_link: '/cliente/login',
      is_active: true,
      display_order: 3
    }
  ]);

  return (
    <div className="h-full w-full bg-transparent overflow-hidden">
      <div className="h-full flex flex-col">
        <Tabs defaultValue="database-gallery" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-gray-700 h-12 mb-4 rounded-lg">
            <TabsTrigger 
              value="database-gallery" 
              className="flex items-center gap-2 py-2 px-3 text-sm font-medium data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200"
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Galeria Permanente</span>
              <span className="sm:hidden">Galeria</span>
            </TabsTrigger>
            <TabsTrigger 
              value="banner" 
              className="flex items-center gap-2 py-2 px-3 text-sm font-medium data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200"
            >
              <GalleryHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Banners Rotativos</span>
              <span className="sm:hidden">Banners</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="database-gallery" className="h-full m-0 overflow-hidden">
              <Card className="bg-gray-800/50 border-gray-700 h-full flex flex-col">
                <CardHeader className="pb-3 px-4 flex-shrink-0">
                  <CardTitle className="text-white text-lg">Galeria de Fotos</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto">
                    <DatabaseGalleryManager />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banner" className="h-full m-0 overflow-hidden">
              <Card className="bg-gray-800/50 border-gray-700 h-full flex flex-col">
                <CardHeader className="pb-3 px-4 flex-shrink-0">
                  <CardTitle className="text-white text-lg">Banners da Página Inicial</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto">
                    <BannerManager 
                      bannerImages={bannerImages}
                      setBannerImages={setBannerImages}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default BannerGallerySettings;
