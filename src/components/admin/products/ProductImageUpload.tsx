import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProductImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({ 
  images, 
  onImagesChange 
}) => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);

      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não suportado. Use: JPG, PNG ou WebP');
        return;
      }

      // Validar tamanho (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Arquivo muito grande. Tamanho máximo: 5MB');
        return;
      }

      // Gerar nome único
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      // Adicionar à lista de imagens
      onImagesChange([...images, publicUrl]);
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadImage(file);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Label>Imagens do Produto</Label>
      
      {/* Grid de imagens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((url, index) => (
          <div 
            key={index} 
            className="relative aspect-square bg-muted rounded-lg overflow-hidden border-2 border-border group"
          >
            <img 
              src={url} 
              alt={`Produto ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeImage(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Botão de upload */}
        <label 
          className={`
            relative aspect-square bg-muted rounded-lg border-2 border-dashed border-border
            hover:border-primary hover:bg-muted/50 transition-colors cursor-pointer
            flex flex-col items-center justify-center gap-2 text-muted-foreground
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
              <span className="text-xs sm:text-sm">Enviando...</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-xs sm:text-sm text-center px-2">
                Adicionar Foto
              </span>
            </>
          )}
        </label>
      </div>

      {/* Dica */}
      <p className="text-xs sm:text-sm text-muted-foreground">
        Formatos aceitos: JPG, PNG, WebP • Tamanho máximo: 5MB
      </p>
    </div>
  );
};
