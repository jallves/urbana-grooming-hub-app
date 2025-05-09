
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
}

const BannerForm: React.FC<BannerFormProps> = ({
  newBanner,
  setNewBanner,
  bannerUpload,
  setBannerUpload,
  handleAddBanner,
  uploading
}) => {
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setBannerUpload({ file, previewUrl });
      
      // Update the imageUrl in newBanner
      setNewBanner({
        ...newBanner,
        imageUrl: previewUrl
      });
    }
  };

  return (
    <div className="border rounded-md p-4 mt-6">
      <h3 className="text-lg font-medium mb-4">Adicionar Novo Banner</h3>
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="bannerImage">Imagem do Banner</Label>
            <ImageUploader
              imageUrl={newBanner.imageUrl}
              setImageUrl={(url) => setNewBanner({
                ...newBanner,
                imageUrl: url
              })}
              upload={bannerUpload}
              setUpload={setBannerUpload}
              fileInputRef={bannerFileInputRef}
              handleFileChange={handleBannerFileChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="newTitle">Título</Label>
            <Input 
              id="newTitle" 
              value={newBanner.title}
              onChange={(e) => setNewBanner({
                ...newBanner,
                title: e.target.value
              })}
              placeholder="Título do Banner"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newSubtitle">Subtítulo</Label>
            <Input 
              id="newSubtitle" 
              value={newBanner.subtitle}
              onChange={(e) => setNewBanner({
                ...newBanner,
                subtitle: e.target.value
              })}
              placeholder="Subtítulo do Banner"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="newDescription">Descrição</Label>
          <Input 
            id="newDescription" 
            value={newBanner.description}
            onChange={(e) => setNewBanner({
              ...newBanner,
              description: e.target.value
            })}
            placeholder="Descrição breve"
          />
        </div>
        <Button 
          onClick={handleAddBanner} 
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
