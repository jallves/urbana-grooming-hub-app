
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Edit3, Upload, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { useSupabaseGallery } from '@/hooks/useSupabaseGallery';
import { useToast } from '@/hooks/use-toast';

const DatabaseGalleryManager: React.FC = () => {
  const { photos, loading, uploading, uploadPhoto, deletePhoto, updatePhoto, togglePublished, reorderPhoto, fetchAllPhotos } = useSupabaseGallery();
  const { toast } = useToast();
  
  // Carregar todas as fotos (incluindo não publicadas) ao montar
  useEffect(() => {
    fetchAllPhotos();
  }, []);
  
  const [newPhoto, setNewPhoto] = useState({
    title: '',
    altText: '',
    file: null as File | null
  });
  
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: '', altText: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewPhoto(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleAddPhoto = async () => {
    if (!newPhoto.file || !newPhoto.title.trim() || !newPhoto.altText.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos e selecione uma imagem",
        variant: "destructive"
      });
      return;
    }

    const success = await uploadPhoto(newPhoto.file, newPhoto.title, newPhoto.altText);
    if (success) {
      setNewPhoto({ title: '', altText: '', file: null });
      const fileInput = document.getElementById('photo-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleEdit = (photo: any) => {
    setEditingPhoto(photo.id);
    setEditData({ title: photo.title, altText: photo.alt_text });
  };

  const handleUpdatePhoto = async () => {
    if (!editingPhoto) return;
    
    const success = await updatePhoto(editingPhoto, {
      title: editData.title,
      alt_text: editData.altText
    });
    
    if (success) {
      setEditingPhoto(null);
      setEditData({ title: '', altText: '' });
    }
  };

  return (
    <div className="h-full w-full bg-transparent overflow-hidden">
      <div className="h-full flex flex-col space-y-4 p-4">
        
        {/* Add Photo Form */}
        <Card className="bg-gray-800/50 border-gray-700 flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Nova Foto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="photo-title" className="text-gray-300 text-sm">Título</Label>
                <Input
                  id="photo-title"
                  value={newPhoto.title}
                  onChange={(e) => setNewPhoto(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Corte moderno"
                  className="bg-gray-900 border-gray-600 text-white placeholder-gray-400 h-9"
                />
              </div>
              <div>
                <Label htmlFor="photo-alt" className="text-gray-300 text-sm">Texto Alternativo</Label>
                <Input
                  id="photo-alt"
                  value={newPhoto.altText}
                  onChange={(e) => setNewPhoto(prev => ({ ...prev, altText: e.target.value }))}
                  placeholder="Descrição para acessibilidade"
                  className="bg-gray-900 border-gray-600 text-white placeholder-gray-400 h-9"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <Label htmlFor="photo-file" className="text-gray-300 text-sm">Imagem</Label>
                <Input
                  id="photo-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="bg-gray-900 border-gray-600 text-white h-9"
                />
              </div>
              <Button
                onClick={handleAddPhoto}
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-9"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span className="ml-2">Adicionar</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Photos Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <Card key={photo.id} className="bg-gray-800/50 border-gray-700 overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={photo.image_url}
                      alt={photo.alt_text}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        photo.published 
                          ? 'bg-green-500/80 text-white' 
                          : 'bg-gray-500/80 text-white'
                      }`}>
                        {photo.published ? '✓ Publicado' : '○ Rascunho'}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    {editingPhoto === photo.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editData.title}
                          onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Título"
                          className="bg-gray-900 border-gray-600 text-white text-sm h-8"
                        />
                        <Input
                          value={editData.altText}
                          onChange={(e) => setEditData(prev => ({ ...prev, altText: e.target.value }))}
                          placeholder="Texto alternativo"
                          className="bg-gray-900 border-gray-600 text-white text-sm h-8"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleUpdatePhoto}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white flex-1 h-8"
                          >
                            Salvar
                          </Button>
                          <Button
                            onClick={() => setEditingPhoto(null)}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1 h-8"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-white text-sm font-medium truncate">{photo.title}</h3>
                        <p className="text-gray-400 text-xs truncate">{photo.alt_text}</p>
                        <div className="grid grid-cols-4 gap-1 mt-2">
                          <Button
                            onClick={() => togglePublished(photo.id, photo.published)}
                            size="sm"
                            variant="outline"
                            className={`border-gray-600 hover:bg-gray-700 px-2 h-8 ${
                              photo.published ? 'text-green-400' : 'text-gray-400'
                            }`}
                            title={photo.published ? 'Despublicar' : 'Publicar'}
                          >
                            {photo.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </Button>
                          <Button
                            onClick={() => handleEdit(photo)}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 px-2 h-8"
                            title="Editar"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => reorderPhoto(photo.id, 'up')}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 px-2 h-8"
                            title="Mover para cima"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => reorderPhoto(photo.id, 'down')}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 px-2 h-8"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          onClick={() => deletePhoto(photo.id)}
                          size="sm"
                          variant="destructive"
                          className="w-full mt-2 h-8"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseGalleryManager;
