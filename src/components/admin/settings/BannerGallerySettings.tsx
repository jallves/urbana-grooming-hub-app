
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
      id: 1,
      imageUrl: '/hero-background.jpg',
      title: 'Experiência Premium',
      subtitle: 'em Barbearia',
      description: 'A arte da barbearia tradicional com sofisticação moderna'
    },
    {
      id: 2,
      imageUrl: '/banner-2.jpg',
      title: 'Estilo & Precisão',
      subtitle: 'para Cavalheiros',
      description: 'Cortes clássicos com um toque contemporâneo'
    },
    {
      id: 3,
      imageUrl: '/banner-3.jpg',
      title: 'Ambiente Exclusivo',
      subtitle: 'para Relaxar',
      description: 'Um espaço onde tradição e conforto se encontram'
    }
  ]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="database-gallery" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="database-gallery" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Galeria Permanente
          </TabsTrigger>
          <TabsTrigger value="banner" className="flex items-center gap-2">
            <GalleryHorizontal className="h-4 w-4" />
            Banners Rotativos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="database-gallery" className="space-y-6 mt-6">
          <DatabaseGalleryManager />
        </TabsContent>

        <TabsContent value="banner" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Banners da Página Inicial</CardTitle>
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
