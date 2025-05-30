
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Image as ImageIcon, 
  Grid, 
  Eye, 
  Edit3, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  RefreshCw,
  Upload,
  Check,
  X
} from "lucide-react";
import { useSupabaseGallery } from '@/hooks/useSupabaseGallery';

const DatabaseGalleryManager: React.FC = () => {
  const {
    photos,
    loading,
    uploading,
    fetchPhotos,
    fetchAllPhotos,
    uploadPhoto,
    updatePhoto,
    deletePhoto,
    reorderPhoto
  } = useSupabaseGallery();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAltText, setEditAltText] = useState('');
  
  // Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAltText, setUploadAltText] = useState('');

  React.useEffect(() => {
    fetchAllPhotos(); // Para admin, buscar todas as fotos
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('O arquivo deve ter no máximo 5MB');
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      if (!uploadTitle) {
        const fileName = file.name.split('.')[0];
        setUploadTitle(fileName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadTitle.trim() || !uploadAltText.trim()) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    const success = await uploadPhoto(selectedFile, uploadTitle, uploadAltText);
    
    if (success) {
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadTitle('');
      setUploadAltText('');
      
      const fileInput = document.getElementById('db-gallery-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      showNotification('✅ Foto salva permanentemente no banco de dados!');
    } else {
      showNotification('❌ Erro ao salvar foto');
    }
  };

  const handleEdit = (photo: any) => {
    setEditingId(photo.id);
    setEditTitle(photo.title);
    setEditAltText(photo.alt_text);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim() || !editAltText.trim()) return;
    
    const success = await updatePhoto(editingId, { 
      title: editTitle,
      alt_text: editAltText
    });
    
    if (success) {
      setEditingId(null);
      setEditTitle('');
      setEditAltText('');
      showNotification('✅ Foto atualizada com sucesso');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta foto permanentemente?')) return;
    
    const success = await deletePhoto(id);
    if (success) {
      showNotification('✅ Foto deletada permanentemente');
    }
  };

  const handleTogglePublish = async (photo: any) => {
    const success = await updatePhoto(photo.id, { 
      published: !photo.published 
    });
    
    if (success) {
      showNotification(
        photo.published ? '✅ Foto removida da homepage' : '✅ Foto publicada na homepage'
      );
    }
  };

  const showNotification = (message: string) => {
    console.log(message);
    
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 p-4 rounded-lg bg-green-500 text-white font-medium transform transition-all duration-300';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 4000);
  };

  const publishedCount = photos.filter(p => p.published).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500">Carregando galeria do banco de dados...</p>
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
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Galeria Permanente</h2>
                <p className="text-gray-500 text-sm">
                  💾 Fotos salvas no banco de dados Supabase
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
              <Button variant="outline" size="sm" onClick={fetchAllPhotos}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Permanente para Banco de Dados
          </CardTitle>
          <p className="text-sm text-gray-500">
            🔒 As fotos ficam salvas permanentemente e não desaparecem
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="db-gallery-upload">Selecionar Imagem</Label>
            <Input
              id="db-gallery-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
            />
          </div>

          {previewUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full max-w-xs h-48 object-cover rounded-md border"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="upload-title">Título *</Label>
              <Input
                id="upload-title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Ex: Corte moderno masculino"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-alt">Descrição *</Label>
              <Input
                id="upload-alt"
                value={uploadAltText}
                onChange={(e) => setUploadAltText(e.target.value)}
                placeholder="Ex: Cliente satisfeito com novo visual"
              />
            </div>
          </div>

          <Button 
            onClick={handleUpload}
            disabled={!selectedFile || !uploadTitle.trim() || !uploadAltText.trim() || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando no banco de dados...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4 mr-2" />
                Salvar Permanentemente no Banco
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Gallery Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Grid className="h-5 w-5" />
              Gerenciar Fotos do Banco ({photos.length})
            </CardTitle>
            <Badge variant={publishedCount > 0 ? 'default' : 'secondary'}>
              <Eye className="h-3 w-3 mr-1" />
              {publishedCount} na homepage
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
                Nenhuma foto no banco
              </h3>
              <p className="text-gray-500 mb-4">
                Use o upload acima para adicionar fotos permanentemente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {photos.map((photo, index) => (
                <div key={photo.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <img 
                        src={photo.image_url} 
                        alt={photo.alt_text}
                        className="w-full h-full object-cover rounded-md"
                      />
                      <Badge 
                        variant={photo.published ? 'default' : 'secondary'}
                        className="absolute -top-2 -right-2 text-xs"
                      >
                        {photo.published ? 'PUB' : 'OFF'}
                      </Badge>
                    </div>

                    <div className="flex-1 space-y-2">
                      {editingId === photo.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Título"
                          />
                          <Input
                            value={editAltText}
                            onChange={(e) => setEditAltText(e.target.value)}
                            placeholder="Descrição"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-medium">{photo.title}</h4>
                          <p className="text-sm text-gray-500">{photo.alt_text}</p>
                          <p className="text-xs text-gray-400">
                            Criada: {new Date(photo.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reorderPhoto(photo.id, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reorderPhoto(photo.id, 'down')}
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

      {/* Status */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-green-900 mb-1">
                💾 Sistema de Banco de Dados Ativo
              </p>
              <p className="text-green-700">
                Suas fotos agora são salvas permanentemente no banco de dados Supabase. 
                Elas não desaparecem mais quando você sai do site!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseGalleryManager;
