
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GalleryImage } from '@/types/settings';
import { GalleryFormProps } from './types';
import { useImageUpload } from './useImageUpload';
import ImageUploader from './ImageUploader';
import { supabase } from '@/integrations/supabase/client';
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
  const [galleryUpload, setGalleryUpload] = useState<{ file: File; previewUrl: string } | null>(null);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [newImage, setNewImage] = useState<Omit<GalleryImage, 'id'>>({
    src: '',
    alt: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch gallery images from Supabase
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('gallery_images')
          .select('*')
          .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          const formattedData: GalleryImage[] = data.map(item => ({
            id: parseInt(item.id.toString().replace(/-/g, '').substring(0, 8), 16),
            src: item.src,
            alt: item.alt
          }));
          setGalleryImages(formattedData);
        }
      } catch (error) {
        console.error('Error fetching gallery images:', error);
        toast({
          title: "Erro ao carregar imagens",
          description: "Não foi possível carregar as imagens da galeria",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGalleryImages();
  }, [setGalleryImages, toast]);

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setGalleryUpload({ file, previewUrl });
      
      // Update the imageUrl in newImage
      setNewImage({
        ...newImage,
        src: previewUrl
      });
    }
  };

  const handleAddGalleryImage = async () => {
    if (!newImage.alt) {
      toast({
        title: "Campo obrigatório",
        description: "A descrição da imagem é obrigatória",
        variant: "destructive",
      });
      return;
    }
    
    try {
      let imageUrl = newImage.src;
      
      // Upload file if provided
      if (galleryUpload) {
        imageUrl = await uploadFile(galleryUpload.file, 'gallery', 'images');
      }
      
      if (!imageUrl) {
        toast({
          title: "Imagem obrigatória",
          description: "Adicione uma URL de imagem ou faça upload de um arquivo",
          variant: "destructive",
        });
        return;
      }
      
      // Insert new gallery image into Supabase
      const { data, error } = await supabase
        .from('gallery_images')
        .insert({
          src: imageUrl,
          alt: newImage.alt,
          display_order: galleryImages.length,
          is_active: true
        })
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const newGalleryImage: GalleryImage = {
          id: parseInt(data[0].id.toString().replace(/-/g, '').substring(0, 8), 16),
          src: data[0].src,
          alt: data[0].alt
        };
        
        setGalleryImages([...galleryImages, newGalleryImage]);
        
        setNewImage({
          src: '',
          alt: ''
        });
        
        setGalleryUpload(null);
        if (galleryFileInputRef.current) {
          galleryFileInputRef.current.value = '';
        }
        
        toast({
          title: "Imagem adicionada",
          description: "A imagem foi adicionada à galeria com sucesso",
        });
      }
    } catch (error) {
      console.error('Error adding gallery image:', error);
      toast({
        title: "Erro ao adicionar imagem",
        description: "Ocorreu um erro ao adicionar a imagem à galeria",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGalleryImage = async (id: number) => {
    try {
      const imageToDelete = galleryImages.find(img => img.id === id);
      if (!imageToDelete) return;
      
      // Delete from Supabase
      const { error } = await supabase
        .from('gallery_images')
        .delete()
        .eq('src', imageToDelete.src);
      
      if (error) throw error;
      
      setGalleryImages(galleryImages.filter(img => img.id !== id));
      
      toast({
        title: "Imagem removida",
        description: "A imagem foi removida da galeria com sucesso",
      });
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      toast({
        title: "Erro ao remover imagem",
        description: "Ocorreu um erro ao remover a imagem da galeria",
        variant: "destructive",
      });
    }
  };

  const handleUpdateGalleryImage = async () => {
    if (!editingImage) return;
    
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('gallery_images')
        .update({
          src: editingImage.src,
          alt: editingImage.alt
        })
        .eq('src', editingImage.src);
      
      if (error) throw error;
      
      setGalleryImages(galleryImages.map(img => 
        img.id === editingImage.id ? editingImage : img
      ));
      
      setEditingImage(null);
      
      toast({
        title: "Imagem atualizada",
        description: "As alterações foram salvas com sucesso",
      });
    } catch (error) {
      console.error('Error updating gallery image:', error);
      toast({
        title: "Erro ao atualizar imagem",
        description: "Ocorreu um erro ao atualizar a imagem da galeria",
        variant: "destructive",
      });
    }
  };

  const updateDisplayOrder = async (id: number, direction: 'up' | 'down') => {
    const currentIndex = galleryImages.findIndex(img => img.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= galleryImages.length) return;
    
    const updatedImages = [...galleryImages];
    const temp = updatedImages[currentIndex];
    updatedImages[currentIndex] = updatedImages[newIndex];
    updatedImages[newIndex] = temp;
    
    // Update display_order in the database
    try {
      const batch = [];
      
      batch.push(
        supabase
          .from('gallery_images')
          .update({ display_order: newIndex })
          .eq('src', galleryImages[currentIndex].src)
      );
      
      batch.push(
        supabase
          .from('gallery_images')
          .update({ display_order: currentIndex })
          .eq('src', galleryImages[newIndex].src)
      );
      
      await Promise.all(batch);
      
      setGalleryImages(updatedImages);
    } catch (error) {
      console.error('Error updating display order:', error);
      toast({
        title: "Erro ao reordenar imagens",
        description: "Ocorreu um erro ao atualizar a ordem das imagens",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-10 h-10 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Imagem</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Ordem</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {galleryImages.map((image, index) => (
            <TableRow key={image.id}>
              <TableCell>
                <div className="relative h-14 w-24 rounded overflow-hidden">
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </TableCell>
              <TableCell>{image.alt}</TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => updateDisplayOrder(image.id, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => updateDisplayOrder(image.id, 'down')}
                    disabled={index === galleryImages.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingImage(image)}
                      >
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Imagem</DialogTitle>
                        <DialogDescription>
                          Atualize as informações da imagem.
                        </DialogDescription>
                      </DialogHeader>
                      {editingImage && (
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="imageSrc">URL da Imagem</Label>
                            <Input 
                              id="imageSrc" 
                              value={editingImage.src}
                              onChange={(e) => setEditingImage({
                                ...editingImage,
                                src: e.target.value
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="imageAlt">Descrição</Label>
                            <Input 
                              id="imageAlt" 
                              value={editingImage.alt}
                              onChange={(e) => setEditingImage({
                                ...editingImage,
                                alt: e.target.value
                              })}
                            />
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button onClick={handleUpdateGalleryImage}>
                          Salvar alterações
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteGalleryImage(image.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
    </div>
  );
};

export default GalleryManager;
