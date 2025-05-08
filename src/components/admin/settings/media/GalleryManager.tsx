
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, FileImage } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GalleryImage } from '@/types/settings';
import { GalleryFormProps, ImageUpload } from './types';
import { useImageUpload } from './useImageUpload';
import ImageUploader from './ImageUploader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const GalleryManager: React.FC<GalleryFormProps> = ({ galleryImages, setGalleryImages }) => {
  const { toast } = useToast();
  const { uploadFile, uploading } = useImageUpload();
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [galleryUpload, setGalleryUpload] = useState<ImageUpload | null>(null);
  const [editingGallery, setEditingGallery] = useState<GalleryImage | null>(null);
  
  const [newGalleryImage, setNewGalleryImage] = useState<Omit<GalleryImage, 'id'>>({
    src: '',
    alt: ''
  });

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setGalleryUpload({ file, previewUrl });
      
      // Update the src in newGalleryImage
      setNewGalleryImage({
        ...newGalleryImage,
        src: previewUrl
      });
    }
  };

  const handleAddGalleryImage = async () => {
    if (!newGalleryImage.alt) {
      toast({
        title: "Campo obrigatório",
        description: "A descrição é obrigatória",
        variant: "destructive",
      });
      return;
    }
    
    try {
      let src = newGalleryImage.src;
      
      // Upload file if provided
      if (galleryUpload) {
        src = await uploadFile(galleryUpload.file, 'gallery', 'gallery-images');
      }
      
      if (!src) {
        toast({
          title: "Imagem obrigatória",
          description: "Adicione uma URL de imagem ou faça upload de um arquivo",
          variant: "destructive",
        });
        return;
      }
      
      const newId = Math.max(0, ...galleryImages.map(img => img.id)) + 1;
      
      setGalleryImages([...galleryImages, { ...newGalleryImage, id: newId, src }]);
      
      setNewGalleryImage({
        src: '',
        alt: ''
      });
      
      setGalleryUpload(null);
      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = '';
      }
      
      toast({
        title: "Imagem adicionada",
        description: "A nova imagem foi adicionada à galeria",
      });
    } catch (error) {
      toast({
        title: "Erro ao adicionar imagem",
        description: "Ocorreu um erro ao adicionar a imagem à galeria",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGallery = (id: number) => {
    setGalleryImages(galleryImages.filter(img => img.id !== id));
    toast({
      title: "Imagem removida",
      description: "A imagem foi removida da galeria",
    });
  };

  const handleUpdateGallery = () => {
    if (!editingGallery) return;
    
    setGalleryImages(galleryImages.map(img => 
      img.id === editingGallery.id ? editingGallery : img
    ));
    
    setEditingGallery(null);
    toast({
      title: "Imagem atualizada",
      description: "As alterações foram salvas com sucesso",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {galleryImages.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="aspect-square relative">
              <img 
                src={image.src} 
                alt={image.alt}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-white text-sm font-medium truncate">{image.alt}</p>
                <div className="flex gap-2 mt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-7 text-xs bg-white/30 backdrop-blur-sm text-white border-white/50 hover:bg-white hover:text-black"
                        onClick={() => setEditingGallery(image)}
                      >
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Imagem da Galeria</DialogTitle>
                        <DialogDescription>
                          Atualize as informações da imagem.
                        </DialogDescription>
                      </DialogHeader>
                      {editingGallery && (
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="editSrc">URL da Imagem</Label>
                            <Input 
                              id="editSrc" 
                              value={editingGallery.src}
                              onChange={(e) => setEditingGallery({
                                ...editingGallery,
                                src: e.target.value
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editAlt">Descrição</Label>
                            <Input 
                              id="editAlt" 
                              value={editingGallery.alt}
                              onChange={(e) => setEditingGallery({
                                ...editingGallery,
                                alt: e.target.value
                              })}
                            />
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button onClick={handleUpdateGallery}>Salvar alterações</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleDeleteGallery(image.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="border rounded-md p-4 mt-6">
        <h3 className="text-lg font-medium mb-4">Adicionar Nova Imagem</h3>
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="galleryImage">Imagem para Galeria</Label>
              <ImageUploader
                imageUrl={newGalleryImage.src}
                setImageUrl={(url) => setNewGalleryImage({
                  ...newGalleryImage,
                  src: url
                })}
                upload={galleryUpload}
                setUpload={setGalleryUpload}
                fileInputRef={galleryFileInputRef}
                handleFileChange={handleGalleryFileChange}
                iconComponent={<FileImage className="h-4 w-4" />}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newImageAlt">Descrição</Label>
            <Input 
              id="newImageAlt" 
              value={newGalleryImage.alt}
              onChange={(e) => setNewGalleryImage({
                ...newGalleryImage,
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
    </div>
  );
};

export default GalleryManager;
