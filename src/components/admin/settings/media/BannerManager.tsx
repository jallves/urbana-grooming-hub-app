
import React, { useState, useRef } from 'react';
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
  
  const [newBanner, setNewBanner] = useState<Omit<BannerImage, 'id'>>({
    imageUrl: '',
    title: '',
    subtitle: '',
    description: ''
  });

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
      
      const newId = Math.max(0, ...bannerImages.map(img => img.id)) + 1;
      const newBannerWithId = { 
        ...newBanner, 
        id: newId,
        imageUrl 
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
    } catch (error) {
      toast({
        title: "Erro ao adicionar banner",
        description: "Ocorreu um erro ao adicionar o banner",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBanner = (id: number) => {
    if (bannerImages.length <= 1) {
      toast({
        title: "Operação não permitida",
        description: "É necessário manter pelo menos um banner",
        variant: "destructive",
      });
      return;
    }
    
    setBannerImages(bannerImages.filter(img => img.id !== id));
    toast({
      title: "Banner removido",
      description: "O banner foi removido com sucesso",
    });
  };

  const handleUpdateBanner = () => {
    if (!editingBanner) return;
    
    setBannerImages(bannerImages.map(img => 
      img.id === editingBanner.id ? editingBanner : img
    ));
    
    setEditingBanner(null);
    toast({
      title: "Banner atualizado",
      description: "As alterações foram salvas com sucesso",
    });
  };

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
