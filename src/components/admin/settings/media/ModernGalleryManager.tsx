
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Grid, Eye } from "lucide-react";
import { useModernGalleryOperations } from './hooks/useModernGalleryOperations';
import ModernGalleryCard from './components/ModernGalleryCard';
import ModernGalleryUpload from './components/ModernGalleryUpload';

const ModernGalleryManager: React.FC = () => {
  const {
    galleryImages,
    isLoading,
    uploading,
    addImage,
    updateImage,
    deleteImage,
    reorderImages
  } = useModernGalleryOperations();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500">Carregando galeria...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Galeria de Fotos</h2>
                <p className="text-gray-500 text-sm">
                  Gerencie as imagens que aparecem na homepage
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{galleryImages.length}</div>
                <div className="text-xs text-gray-500">Imagens</div>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Visível no site
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <ModernGalleryUpload 
        onUpload={addImage}
        uploading={uploading}
      />

      {/* Gallery Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Grid className="h-5 w-5" />
              Imagens da Galeria ({galleryImages.length})
            </CardTitle>
            {galleryImages.length > 0 && (
              <Badge variant="outline">
                Ordene arrastando ou use as setas
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {galleryImages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma imagem na galeria
              </h3>
              <p className="text-gray-500 mb-4">
                Adicione a primeira imagem para começar sua galeria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {galleryImages.map((image, index) => (
                <ModernGalleryCard
                  key={image.id}
                  image={image}
                  index={index}
                  totalImages={galleryImages.length}
                  onUpdate={updateImage}
                  onDelete={deleteImage}
                  onReorder={reorderImages}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      {galleryImages.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">
                  📸 Suas imagens são publicadas automaticamente!
                </p>
                <p className="text-blue-700">
                  Todas as alterações feitas aqui aparecem imediatamente na galeria da homepage. 
                  Use as setas para reordenar as imagens conforme desejado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModernGalleryManager;
