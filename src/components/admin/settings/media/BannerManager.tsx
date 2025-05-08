
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BannerImage } from '@/types/settings';
import { BannerFormProps, ImageUpload } from './types';
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

const BannerManager: React.FC<BannerFormProps> = ({ bannerImages, setBannerImages }) => {
  const { toast } = useToast();
  const { uploadFile, uploading } = useImageUpload();
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const [bannerUpload, setBannerUpload] = useState<ImageUpload | null>(null);
  const [editingBanner, setEditingBanner] = useState<BannerImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [newBanner, setNewBanner] = useState<Omit<BannerImage, 'id'>>({
    imageUrl: '',
    title: '',
    subtitle: '',
    description: ''
  });

  // Fetch banner images from Supabase
  useEffect(() => {
    const fetchBannerImages = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('banner_images')
          .select('*')
          .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          const formattedData: BannerImage[] = data.map(item => ({
            id: parseInt(item.id.toString().replace(/-/g, '').substring(0, 8), 16),
            imageUrl: item.image_url,
            title: item.title,
            subtitle: item.subtitle,
            description: item.description || ''
          }));
          setBannerImages(formattedData);
        }
      } catch (error) {
        console.error('Error fetching banner images:', error);
        toast({
          title: "Erro ao carregar banners",
          description: "Não foi possível carregar os banners do banco de dados",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBannerImages();
  }, [setBannerImages, toast]);

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

  const handleAddBanner = async () => {
    if (!newBanner.title) {
      toast({
        title: "Campo obrigatório",
        description: "O título é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    try {
      let imageUrl = newBanner.imageUrl;
      
      // Upload file if provided
      if (bannerUpload) {
        imageUrl = await uploadFile(bannerUpload.file, 'banners', 'banner-images');
      }
      
      if (!imageUrl) {
        toast({
          title: "Imagem obrigatória",
          description: "Adicione uma URL de imagem ou faça upload de um arquivo",
          variant: "destructive",
        });
        return;
      }
      
      // Insert new banner into Supabase
      const { data, error } = await supabase
        .from('banner_images')
        .insert({
          image_url: imageUrl,
          title: newBanner.title,
          subtitle: newBanner.subtitle,
          description: newBanner.description,
          display_order: bannerImages.length,
          is_active: true
        })
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const newBannerWithId: BannerImage = {
          id: parseInt(data[0].id.toString().replace(/-/g, '').substring(0, 8), 16),
          imageUrl: data[0].image_url,
          title: data[0].title,
          subtitle: data[0].subtitle,
          description: data[0].description || ''
        };
        
        setBannerImages([...bannerImages, newBannerWithId]);
        
        setNewBanner({
          imageUrl: '',
          title: '',
          subtitle: '',
          description: ''
        });
        
        setBannerUpload(null);
        if (bannerFileInputRef.current) {
          bannerFileInputRef.current.value = '';
        }
        
        toast({
          title: "Banner adicionado",
          description: "O novo banner foi adicionado com sucesso",
        });
      }
    } catch (error) {
      console.error('Error adding banner:', error);
      toast({
        title: "Erro ao adicionar banner",
        description: "Ocorreu um erro ao adicionar o banner",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (bannerImages.length <= 1) {
      toast({
        title: "Operação não permitida",
        description: "É necessário manter pelo menos um banner",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Find the UUID in the original format from our database
      const bannerToDelete = bannerImages.find(img => img.id === id);
      if (!bannerToDelete) return;
      
      // Delete from Supabase by matching imageUrl since we don't have the original UUID
      const { error } = await supabase
        .from('banner_images')
        .delete()
        .eq('image_url', bannerToDelete.imageUrl);
      
      if (error) throw error;
      
      setBannerImages(bannerImages.filter(img => img.id !== id));
      toast({
        title: "Banner removido",
        description: "O banner foi removido com sucesso",
      });
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast({
        title: "Erro ao remover banner",
        description: "Ocorreu um erro ao remover o banner",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBanner = async () => {
    if (!editingBanner) return;
    
    try {
      // Find the banner in Supabase by matching imageUrl
      const { data, error } = await supabase
        .from('banner_images')
        .update({
          image_url: editingBanner.imageUrl,
          title: editingBanner.title,
          subtitle: editingBanner.subtitle,
          description: editingBanner.description
        })
        .eq('image_url', editingBanner.imageUrl)
        .select();
      
      if (error) throw error;
      
      setBannerImages(bannerImages.map(img => 
        img.id === editingBanner.id ? editingBanner : img
      ));
      
      setEditingBanner(null);
      toast({
        title: "Banner atualizado",
        description: "As alterações foram salvas com sucesso",
      });
    } catch (error) {
      console.error('Error updating banner:', error);
      toast({
        title: "Erro ao atualizar banner",
        description: "Ocorreu um erro ao atualizar o banner",
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
            <TableHead>Título</TableHead>
            <TableHead>Subtítulo</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bannerImages.map((banner) => (
            <TableRow key={banner.id}>
              <TableCell>
                <div className="relative h-14 w-24 rounded overflow-hidden">
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </TableCell>
              <TableCell>{banner.title}</TableCell>
              <TableCell>{banner.subtitle}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingBanner(banner)}
                      >
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Banner</DialogTitle>
                        <DialogDescription>
                          Atualize as informações do banner.
                        </DialogDescription>
                      </DialogHeader>
                      {editingBanner && (
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="imageUrl">URL da Imagem</Label>
                            <Input 
                              id="imageUrl" 
                              value={editingBanner.imageUrl}
                              onChange={(e) => setEditingBanner({
                                ...editingBanner,
                                imageUrl: e.target.value
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="title">Título</Label>
                            <Input 
                              id="title" 
                              value={editingBanner.title}
                              onChange={(e) => setEditingBanner({
                                ...editingBanner,
                                title: e.target.value
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="subtitle">Subtítulo</Label>
                            <Input 
                              id="subtitle" 
                              value={editingBanner.subtitle}
                              onChange={(e) => setEditingBanner({
                                ...editingBanner,
                                subtitle: e.target.value
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea 
                              id="description" 
                              value={editingBanner.description}
                              onChange={(e) => setEditingBanner({
                                ...editingBanner,
                                description: e.target.value
                              })}
                            />
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button onClick={handleUpdateBanner}>Salvar alterações</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteBanner(banner.id)}
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
    </div>
  );
};

export default BannerManager;
