
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GalleryHorizontal, Image } from "lucide-react";
import { BannerImage, GalleryImage } from '@/types/settings';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import BannerManager from './media/BannerManager';
import GalleryManager from './media/GalleryManager';

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

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([
    { id: 1, src: "/gallery-1.jpg", alt: "Corte Clássico" },
    { id: 2, src: "/gallery-2.jpg", alt: "Barba Estilizada" },
    { id: 3, src: "/gallery-3.jpg", alt: "Ambiente Premium" },
    { id: 4, src: "/gallery-4.jpg", alt: "Atendimento Exclusivo" },
    { id: 5, src: "/gallery-5.jpg", alt: "Produtos de Qualidade" },
    { id: 6, src: "/gallery-6.jpg", alt: "Experiência Completa" },
  ]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="banner" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="banner" className="flex items-center gap-2">
            <GalleryHorizontal className="h-4 w-4" />
            Banners Rotativos
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Galeria de Fotos
          </TabsTrigger>
        </TabsList>
        
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

        <TabsContent value="gallery" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Galeria de Fotos</CardTitle>
            </CardHeader>
            <CardContent>
              <GalleryManager 
                galleryImages={galleryImages}
                setGalleryImages={setGalleryImages}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BannerGallerySettings;
