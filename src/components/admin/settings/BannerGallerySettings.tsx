
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GalleryHorizontal, Image, Database } from "lucide-react";
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
    <div className="min-h-screen w-full bg-white">
      <div className="w-full max-w-none px-6 py-6">
        <Tabs defaultValue="database-gallery" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200 h-12">
            <TabsTrigger 
              value="database-gallery" 
              className="flex items-center gap-2 data-[state=active]:bg-gray-50 data-[state=active]:text-black text-gray-700 h-10"
            >
              <Database className="h-4 w-4" />
              Galeria Permanente
            </TabsTrigger>
            <TabsTrigger 
              value="banner" 
              className="flex items-center gap-2 data-[state=active]:bg-gray-50 data-[state=active]:text-black text-gray-700 h-10"
            >
              <GalleryHorizontal className="h-4 w-4" />
              Banners Rotativos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="database-gallery" className="mt-6 w-full">
            <Card className="bg-white border-gray-200 w-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-black text-xl">Galeria de Fotos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full">
                  <DatabaseGalleryManager />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banner" className="mt-6 w-full">
            <Card className="bg-white border-gray-200 w-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-black text-xl">Banners da Página Inicial</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full">
                  <BannerManager 
                    bannerImages={bannerImages}
                    setBannerImages={setBannerImages}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BannerGallerySettings;
