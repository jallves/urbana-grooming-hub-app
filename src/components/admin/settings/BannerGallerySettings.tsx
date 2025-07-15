
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Camera } from 'lucide-react';

const BannerGallerySettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('banners');

  return (
    <Card className="w-full bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">
          Banners e Galeria
        </CardTitle>
        <CardDescription className="text-gray-600">
          Gerencie imagens, banners e galeria do site
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 border border-gray-200">
            <TabsTrigger 
              value="banners" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-green-100 data-[state=active]:text-green-900 text-gray-700"
            >
              <Image className="h-4 w-4" />
              <span className="text-sm">Banners</span>
            </TabsTrigger>
            <TabsTrigger 
              value="gallery" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-900 text-gray-700"
            >
              <Camera className="h-4 w-4" />
              <span className="text-sm">Galeria</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="banners" className="mt-6 w-full">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Gerenciamento de Banners</h3>
              <p className="text-gray-600">Configure os banners que aparecerão no site</p>
            </div>
          </TabsContent>
          
          <TabsContent value="gallery" className="mt-6 w-full">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Galeria de Fotos</h3>
              <p className="text-gray-600">Gerencie as fotos da galeria do site</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BannerGallerySettings;
