
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GalleryHorizontal, Image, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface BannerImage {
  id: number;
  imageUrl: string;
  title: string;
  subtitle: string;
  description: string;
}

interface GalleryImage {
  id: number;
  src: string;
  alt: string;
}

const BannerGallerySettings: React.FC = () => {
  const { toast } = useToast();
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([
    {
      id: 1,
      imageUrl: '/hero-background.jpg',
      title: 'Experiência Premium',
      subtitle: 'em Barbearia',
      description: 'A arte da barbearia tradicional com sofisticação moderna'
    },
    {
      id: 2,
      imageUrl: '/banner-2.jpg',
      title: 'Estilo & Precisão',
      subtitle: 'para Cavalheiros',
      description: 'Cortes clássicos com um toque contemporâneo'
    },
    {
      id: 3,
      imageUrl: '/banner-3.jpg',
      title: 'Ambiente Exclusivo',
      subtitle: 'para Relaxar',
      description: 'Um espaço onde tradição e conforto se encontram'
    }
  ]);

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([
    { id: 1, src: "/gallery-1.jpg", alt: "Corte Clássico" },
    { id: 2, src: "/gallery-2.jpg", alt: "Barba Estilizada" },
    { id: 3, src: "/gallery-3.jpg", alt: "Ambiente Premium" },
    { id: 4, src: "/gallery-4.jpg", alt: "Atendimento Exclusivo" },
    { id: 5, src: "/gallery-5.jpg", alt: "Produtos de Qualidade" },
    { id: 6, src: "/gallery-6.jpg", alt: "Experiência Completa" },
  ]);

  const [newBanner, setNewBanner] = useState<Omit<BannerImage, 'id'>>({
    imageUrl: '',
    title: '',
    subtitle: '',
    description: ''
  });

  const [newGalleryImage, setNewGalleryImage] = useState<Omit<GalleryImage, 'id'>>({
    src: '',
    alt: ''
  });

  const [editingBanner, setEditingBanner] = useState<BannerImage | null>(null);
  const [editingGallery, setEditingGallery] = useState<GalleryImage | null>(null);

  const handleAddBanner = () => {
    if (!newBanner.imageUrl || !newBanner.title) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha URL da imagem e título",
        variant: "destructive",
      });
      return;
    }
    
    const newId = Math.max(0, ...bannerImages.map(img => img.id)) + 1;
    setBannerImages([...bannerImages, { ...newBanner, id: newId }]);
    setNewBanner({
      imageUrl: '',
      title: '',
      subtitle: '',
      description: ''
    });
    
    toast({
      title: "Banner adicionado",
      description: "O novo banner foi adicionado com sucesso",
    });
  };

  const handleAddGalleryImage = () => {
    if (!newGalleryImage.src || !newGalleryImage.alt) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha URL da imagem e descrição",
        variant: "destructive",
      });
      return;
    }
    
    const newId = Math.max(0, ...galleryImages.map(img => img.id)) + 1;
    setGalleryImages([...galleryImages, { ...newGalleryImage, id: newId }]);
    setNewGalleryImage({
      src: '',
      alt: ''
    });
    
    toast({
      title: "Imagem adicionada",
      description: "A nova imagem foi adicionada à galeria",
    });
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

  const handleDeleteGallery = (id: number) => {
    setGalleryImages(galleryImages.filter(img => img.id !== id));
    toast({
      title: "Imagem removida",
      description: "A imagem foi removida da galeria",
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
    <div className="space-y-6">
      <Tabs defaultValue="banner" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="banner" className="flex items-center gap-2">
            <GalleryHorizontal className="h-4 w-4" />
            Banners Rotativos
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Galeria de Fotos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="banner" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Banners da Página Inicial</CardTitle>
            </CardHeader>
            <CardContent>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newImageUrl">URL da Imagem</Label>
                        <Input 
                          id="newImageUrl" 
                          value={newBanner.imageUrl}
                          onChange={(e) => setNewBanner({
                            ...newBanner,
                            imageUrl: e.target.value
                          })}
                          placeholder="/banner-image.jpg"
                        />
                      </div>
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
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                    <Button onClick={handleAddBanner} className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Banner
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Galeria de Fotos</CardTitle>
            </CardHeader>
            <CardContent>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newImageSrc">URL da Imagem</Label>
                        <Input 
                          id="newImageSrc" 
                          value={newGalleryImage.src}
                          onChange={(e) => setNewGalleryImage({
                            ...newGalleryImage,
                            src: e.target.value
                          })}
                          placeholder="/gallery-image.jpg"
                        />
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
                    </div>
                    <Button onClick={handleAddGalleryImage} className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" /> Adicionar à Galeria
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BannerGallerySettings;
