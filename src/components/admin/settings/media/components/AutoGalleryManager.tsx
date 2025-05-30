
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Image as ImageIcon, 
  Grid, 
  Eye, 
  Edit3, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  RefreshCw 
} from "lucide-react";
import { galleryService, GalleryPhoto } from '@/services/galleryService';
import AutoGalleryUpload from './AutoGalleryUpload';

const AutoGalleryManager: React.FC = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');

  const loadPhotos = () => {
    setLoading(true);
    try {
      const allPhotos = galleryService.getPhotos();
      setPhotos(allPhotos);
      console.log(`📸 ${allPhotos.length} fotos carregadas no painel admin`);
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
    
    // Listener para atualizações
    const handleGalleryUpdate = () => {
      loadPhotos();
    };

    window.addEventListener('galleryUpdated', handleGalleryUpdate);
    return () => {
      window.removeEventListener('galleryUpdated', handleGalleryUpdate);
    };
  }, []);

  const handleEdit = (photo: GalleryPhoto) => {
    setEditingId(photo.id);
    setEditCaption(photo.alt);
  };

  const handleSaveEdit = async (photoId: string) => {
    if (!editCaption.trim()) return;
    
    const success = await galleryService.updatePhoto(photoId, { 
      alt: editCaption.trim() 
    });
    
    if (success) {
      setEditingId(null);
      setEditCaption('');
      loadPhotos();
      showNotification('Descrição atualizada com sucesso');
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Tem certeza que deseja remover esta foto da galeria?')) return;
    
    const success = await galleryService.deletePhoto(photoId);
    if (success) {
      loadPhotos();
      showNotification('Foto removida da galeria');
    }
  };

  const handleReorder = async (photoId: string, direction: 'up' | 'down') => {
    const success = await galleryService.reorderPhotos(photoId, direction);
    if (success) {
      loadPhotos();
    }
  };

  const handleTogglePublish = async (photo: GalleryPhoto) => {
    const success = await galleryService.updatePhoto(photo.id, { 
      published: !photo.published 
    });
    
    if (success) {
      loadPhotos();
      showNotification(
        photo.published ? 'Foto removida da homepage' : 'Foto publicada na homepage'
      );
    }
  };

  const showNotification = (message: string) => {
    console.log(`✅ ${message}`);
    
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 p-4 rounded-lg bg-green-500 text-white font-medium transform transition-all duration-300';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const publishedCount = photos.filter(p => p.published).length;

  if (loading) {
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
                <h2 className="text-xl font-semibold">Galeria Automática</h2>
                <p className="text-gray-500 text-sm">
                  Sistema integrado painel ↔ homepage
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{photos.length}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{publishedCount}</div>
                <div className="text-xs text-gray-500">Publicadas</div>
              </div>
              <Button variant="outline" size="sm" onClick={loadPhotos}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <AutoGalleryUpload />

      {/* Gallery Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Grid className="h-5 w-5" />
              Gerenciar Galeria ({photos.length} fotos)
            </CardTitle>
            <Badge variant={publishedCount > 0 ? 'default' : 'secondary'}>
              <Eye className="h-3 w-3 mr-1" />
              {publishedCount} visíveis no site
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma foto na galeria
              </h3>
              <p className="text-gray-500 mb-4">
                Use o upload automático acima para adicionar fotos
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {photos.map((photo, index) => (
                <div key={photo.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {/* Imagem */}
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <img 
                        src={photo.src} 
                        alt={photo.alt}
                        className="w-full h-full object-cover rounded-md"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=100&h=100&fit=crop";
                        }}
                      />
                      <Badge 
                        variant={photo.published ? 'default' : 'secondary'}
                        className="absolute -top-2 -right-2 text-xs"
                      >
                        {photo.published ? 'ON' : 'OFF'}
                      </Badge>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 space-y-2">
                      {editingId === photo.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editCaption}
                            onChange={(e) => setEditCaption(e.target.value)}
                            placeholder="Descrição da foto"
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleSaveEdit(photo.id)}
                              disabled={!editCaption.trim()}
                            >
                              Salvar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingId(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-medium">{photo.alt}</h4>
                          <p className="text-sm text-gray-500">
                            Adicionada em {new Date(photo.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReorder(photo.id, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReorder(photo.id, 'down')}
                          disabled={index === photos.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(photo)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(photo.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant={photo.published ? 'default' : 'secondary'}
                        onClick={() => handleTogglePublish(photo)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {photo.published ? 'Publicada' : 'Oculta'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      {photos.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Eye className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-green-900 mb-1">
                  ✅ Sistema Automático Ativo
                </p>
                <p className="text-green-700">
                  Todas as fotos publicadas aparecem automaticamente na galeria da homepage. 
                  Use os controles acima para gerenciar visibilidade e ordem das imagens.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutoGalleryManager;
