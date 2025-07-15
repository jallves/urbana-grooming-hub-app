
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Camera } from 'lucide-react';

const BannerGallerySettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('banners');

  return (
    <Card className="w-full bg-white border border-gray-200 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-medium text-black">
          Banners e Galeria
        </CardTitle>
        <CardDescription className="text-gray-600 text-sm">
          Gerencie imagens, banners e galeria do site
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-50 border border-gray-200 h-10">
            <TabsTrigger 
              value="banners" 
              className="flex items-center gap-2 py-2 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-700 text-sm font-normal"
            >
              <Image className="h-4 w-4" />
              <span>Banners</span>
            </TabsTrigger>
            <TabsTrigger 
              value="gallery" 
              className="flex items-center gap-2 py-2 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-700 text-sm font-normal"
            >
              <Camera className="h-4 w-4" />
              <span>Galeria</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="banners" className="mt-4 w-full">
            <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
              <Image className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-medium text-black mb-2">Gerenciamento de Banners</h3>
              <p className="text-gray-600 text-sm">Configure os banners que aparecerão no site</p>
            </div>
          </TabsContent>
          
          <TabsContent value="gallery" className="mt-4 w-full">
            <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-medium text-black mb-2">Galeria de Fotos</h3>
              <p className="text-gray-600 text-sm">Gerencie as fotos da galeria do site</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BannerGallerySettings;
