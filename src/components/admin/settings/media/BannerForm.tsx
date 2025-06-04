
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { BannerImage } from '@/types/settings';
import { ImageUpload } from './types';
import ImageUploader from './ImageUploader';

interface BannerFormProps {
  newBanner: Omit<BannerImage, 'id'>;
  setNewBanner: React.Dispatch<React.SetStateAction<Omit<BannerImage, 'id'>>>;
  bannerUpload: ImageUpload | null;
  setBannerUpload: React.Dispatch<React.SetStateAction<ImageUpload | null>>;
  handleAddBanner: () => Promise<void>;
  uploading: boolean;
  uploadError?: string | null;
}

const BannerForm: React.FC<BannerFormProps> = ({
  newBanner,
  setNewBanner,
  bannerUpload,
  setBannerUpload,
  handleAddBanner,
  uploading,
  uploadError = null
}) => {
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setLocalError('Tipo de arquivo não suportado. Use: JPG, PNG, GIF ou WebP');
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setLocalError('Arquivo muito grande. Tamanho máximo: 10MB');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setBannerUpload({ file, previewUrl });
      
      // Update the image_url in newBanner
      setNewBanner({
        ...newBanner,
        image_url: previewUrl
      });
    }
  };
  
  const handleAddBannerWithErrorHandling = async () => {
    setLocalError(null);
    
    if (!newBanner.title.trim()) {
      setLocalError('Título é obrigatório');
      return;
    }
    
    if (!newBanner.subtitle.trim()) {
      setLocalError('Subtítulo é obrigatório');
      return;
    }
    
    if (!bannerUpload && !newBanner.image_url) {
      setLocalError('Imagem é obrigatória');
      return;
    }
    
    try {
      await handleAddBanner();
    } catch (error) {
      setLocalError((error as Error).message);
    }
  };

  // Use either passed-in uploadError or local error
  const displayError = uploadError || localError;

  return (
    <div className="border rounded-md p-4 mt-6">
      <h3 className="text-lg font-medium mb-4">Adicionar Novo Banner</h3>
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="bannerImage">Imagem do Banner</Label>
            <ImageUploader
              imageUrl={newBanner.image_url}
              setImageUrl={(url) => setNewBanner({
                ...newBanner,
                image_url: url
              })}
              upload={bannerUpload}
              setUpload={setBannerUpload}
              fileInputRef={bannerFileInputRef}
              handleFileChange={handleBannerFileChange}
              uploadError={displayError}
              placeholder="URL da imagem ou faça upload (JPG, PNG, GIF, WebP - máx 10MB)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="newTitle">Título *</Label>
            <Input 
              id="newTitle" 
              value={newBanner.title}
              onChange={(e) => setNewBanner({
                ...newBanner,
                title: e.target.value
              })}
              placeholder="Título do Banner"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newSubtitle">Subtítulo *</Label>
            <Input 
              id="newSubtitle" 
              value={newBanner.subtitle}
              onChange={(e) => setNewBanner({
                ...newBanner,
                subtitle: e.target.value
              })}
              placeholder="Subtítulo do Banner"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="newDescription">Descrição</Label>
          <Input 
            id="newDescription" 
            value={newBanner.description || ''}
            onChange={(e) => setNewBanner({
              ...newBanner,
              description: e.target.value
            })}
            placeholder="Descrição breve (opcional)"
          />
        </div>
        <Button 
          onClick={handleAddBannerWithErrorHandling} 
          className="flex items-center"
          disabled={uploading}
        >
          <Plus className="h-4 w-4 mr-2" /> 
          {uploading ? "Enviando..." : "Adicionar Banner"}
        </Button>
      </div>
    </div>
  );
};

export default BannerForm;
