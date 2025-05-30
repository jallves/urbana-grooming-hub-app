
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon, Check, AlertCircle } from "lucide-react";
import { galleryService } from '@/services/galleryService';

const AutoGalleryUpload: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validar arquivos
    const validFiles = selectedFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        showNotification('Apenas arquivos de imagem são permitidos', 'error');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Arquivo deve ter no máximo 5MB', 'error');
        return false;
      }
      return true;
    });

    setFiles(validFiles);
    
    // Criar previews
    const previewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
    
    // Auto-gerar legenda baseada no primeiro arquivo
    if (validFiles.length > 0 && !caption) {
      const fileName = validFiles[0].name.split('.')[0];
      const autoCaption = fileName
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      setCaption(autoCaption);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      showNotification('Selecione pelo menos uma imagem', 'error');
      return;
    }

    if (!caption.trim()) {
      showNotification('Adicione uma descrição para as imagens', 'error');
      return;
    }

    setUploading(true);
    setUploadStatus('idle');

    try {
      // Upload de cada arquivo
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const photoCaption = files.length > 1 ? `${caption} ${i + 1}` : caption;
        
        await galleryService.savePhoto({
          src: '',
          alt: photoCaption,
          file: file
        });
      }

      setUploadStatus('success');
      showNotification(`✅ ${files.length} foto(s) publicada(s) na galeria!`, 'success');
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadStatus('error');
      showNotification('Erro ao publicar fotos', 'error');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFiles([]);
    setPreviews([]);
    setCaption('');
    setUploadStatus('idle');
    
    // Reset input
    const fileInput = document.getElementById('gallery-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    console.log(`${type === 'error' ? '❌' : '✅'} ${message}`);
    
    // Criar notificação visual
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white font-medium transform transition-all duration-300 ${
      type === 'error' ? 'bg-red-500' : 'bg-green-500'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 4000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Automático para Galeria
        </CardTitle>
        <p className="text-sm text-gray-500">
          Publique fotos diretamente na galeria da homepage
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div className="space-y-4">
          <Label htmlFor="gallery-upload">Selecionar Imagens</Label>
          <Input
            id="gallery-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
          />
        </div>

        {/* Previews */}
        {previews.length > 0 && (
          <div className="space-y-2">
            <Label>Preview das Imagens ({previews.length})</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative">
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full h-24 object-cover rounded-md border"
                  />
                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Caption */}
        <div className="space-y-2">
          <Label htmlFor="caption">Descrição/Legenda *</Label>
          <Input
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Ex: Corte premium executado hoje, Novo estilo de barba..."
            required
          />
          <p className="text-xs text-gray-500">
            Esta descrição aparecerá na galeria da homepage
          </p>
        </div>

        {/* Upload Button */}
        <Button 
          onClick={handleUpload}
          disabled={files.length === 0 || !caption.trim() || uploading}
          className="w-full"
          variant={uploadStatus === 'success' ? 'default' : 'default'}
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Publicando na galeria...
            </>
          ) : uploadStatus === 'success' ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Fotos Publicadas!
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4 mr-2" />
              Publicar {files.length > 0 ? `${files.length} foto(s)` : 'na Galeria'}
            </>
          )}
        </Button>

        {/* Status Messages */}
        {uploadStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700 font-medium">
                Fotos publicadas com sucesso na galeria da homepage!
              </p>
            </div>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-700 font-medium">
                Erro ao publicar fotos. Tente novamente.
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <ImageIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">🚀 Publicação Automática:</p>
              <ul className="space-y-1">
                <li>• Fotos aparecem imediatamente na homepage</li>
                <li>• Suporte a múltiplas imagens</li>
                <li>• Máximo 5MB por imagem</li>
                <li>• Formatos: JPG, PNG, GIF, WebP</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoGalleryUpload;
