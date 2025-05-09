
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { ImageUpload } from './types';
import ImageUploader from './ImageUploader';

interface GalleryFormProps {
  newImage: {
    src: string;
    alt: string;
  };
  setNewImage: React.Dispatch<React.SetStateAction<{
    src: string;
    alt: string;
  }>>;
  galleryUpload: ImageUpload | null;
  setGalleryUpload: React.Dispatch<React.SetStateAction<ImageUpload | null>>;
  galleryFileInputRef: React.RefObject<HTMLInputElement>;
  handleGalleryFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddGalleryImage: () => Promise<void>;
  uploading: boolean;
}

const GalleryForm: React.FC<GalleryFormProps> = ({
  newImage,
  setNewImage,
  galleryUpload,
  setGalleryUpload,
  galleryFileInputRef,
  handleGalleryFileChange,
  handleAddGalleryImage,
  uploading
}) => {
  return (
    <div className="border rounded-md p-4 mt-6">
      <h3 className="text-lg font-medium mb-4">Adicionar Nova Imagem</h3>
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="galleryImage">Imagem da Galeria</Label>
            <ImageUploader
              imageUrl={newImage.src}
              setImageUrl={(url) => setNewImage({
                ...newImage,
                src: url
              })}
              upload={galleryUpload}
              setUpload={setGalleryUpload}
              fileInputRef={galleryFileInputRef}
              handleFileChange={handleGalleryFileChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newAlt">Descrição</Label>
          <Input 
            id="newAlt" 
            value={newImage.alt}
            onChange={(e) => setNewImage({
              ...newImage,
              alt: e.target.value
            })}
            placeholder="Descrição da imagem"
          />
        </div>
        
        <Button 
          onClick={handleAddGalleryImage} 
          className="flex items-center"
          disabled={uploading}
        >
          <Plus className="h-4 w-4 mr-2" /> 
          {uploading ? "Enviando..." : "Adicionar à Galeria"}
        </Button>
      </div>
    </div>
  );
};

export default GalleryForm;
