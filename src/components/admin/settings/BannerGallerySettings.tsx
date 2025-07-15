
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
    <div className="space-y-6">
      <Tabs defaultValue="database-gallery" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-300">
          <TabsTrigger 
            value="database-gallery" 
            className="flex items-center gap-2 data-[state=active]:bg-gray-100 data-[state=active]:text-black text-gray-700"
          >
            <Database className="h-4 w-4" />
            Galeria Permanente
          </TabsTrigger>
          <TabsTrigger 
            value="banner" 
            className="flex items-center gap-2 data-[state=active]:bg-gray-100 data-[state=active]:text-black text-gray-700"
          >
            <GalleryHorizontal className="h-4 w-4" />
            Banners Rotativos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="database-gallery" className="space-y-6 mt-6">
          <Card className="bg-white border-gray-300">
            <CardHeader>
              <CardTitle className="text-black">Galeria de Fotos</CardTitle>
            </CardHeader>
            <CardContent>
              <DatabaseGalleryManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banner" className="space-y-6 mt-6">
          <Card className="bg-white border-gray-300">
            <CardHeader>
              <CardTitle className="text-black">Banners da Página Inicial</CardTitle>
            </CardHeader>
            <CardContent>
              <BannerManager 
                bannerImages={bannerImages}
                setBannerImages={setBannerImages}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BannerGallerySettings;
