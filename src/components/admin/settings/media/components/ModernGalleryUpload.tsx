
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon, X } from "lucide-react";

interface ModernGalleryUploadProps {
  onUpload: (imageData: { alt: string }, file?: File) => Promise<boolean>;
  uploading: boolean;
}

const ModernGalleryUpload: React.FC<ModernGalleryUploadProps> = ({
  onUpload,
  uploading
}) => {
  const [newImage, setNewImage] = useState({ alt: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('O arquivo deve ter no máximo 5MB');
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Auto-generate alt text from filename if empty
      if (!newImage.alt) {
        const fileName = file.name.split('.')[0];
        setNewImage(prev => ({ 
          ...prev, 
          alt: fileName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !newImage.alt.trim()) {
      alert('Por favor, selecione uma imagem e adicione uma descrição');
      return;
    }

    const success = await onUpload(newImage, selectedFile);
    
    if (success) {
      // Reset form
      setNewImage({ alt: '' });
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setNewImage({ alt: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Adicionar Nova Imagem à Galeria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload Area */}
        <div className="space-y-2">
          <Label htmlFor="image-upload">Selecionar Imagem</Label>
          <div className="flex items-center gap-4">
            <Input
              id="image-upload"
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileSelect}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
            />
            {selectedFile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="space-y-2">
            <Label>Preview da Imagem</Label>
            <div className="relative w-full max-w-xs">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-md border"
              />
            </div>
          </div>
        )}

        {/* Alt Text Input */}
        <div className="space-y-2">
          <Label htmlFor="alt-text">Descrição da Imagem *</Label>
          <Input
            id="alt-text"
            value={newImage.alt}
            onChange={(e) => setNewImage(prev => ({ ...prev, alt: e.target.value }))}
            placeholder="Ex: Corte de cabelo moderno, Ambiente da barbearia..."
            required
          />
          <p className="text-xs text-gray-500">
            Esta descrição aparecerá quando a imagem for exibida na galeria da homepage
          </p>
        </div>

        {/* Upload Button */}
        <Button 
          onClick={handleUpload}
          disabled={!selectedFile || !newImage.alt.trim() || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Publicando na galeria...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4 mr-2" />
              Publicar na Galeria da Homepage
            </>
          )}
        </Button>

        {/* Instructions */}
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <ImageIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-green-700">
              <p className="font-medium mb-1">🚀 Atualização Instantânea:</p>
              <p>As imagens adicionadas aqui aparecerão automaticamente na galeria da homepage!</p>
              <p className="mt-1 font-medium">💡 Dica: Após adicionar, atualize a página da homepage para ver as mudanças.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernGalleryUpload;
