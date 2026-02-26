import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Upload, Loader2 } from 'lucide-react';
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
  const [localPreviews, setLocalPreviews] = useState<{ file: File; previewUrl: string }[]>([]);

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não suportado. Use: JPG, PNG ou WebP');
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Arquivo muito grande. Tamanho máximo: 5MB');
        return;
      }

      // Show local preview immediately
      const previewUrl = URL.createObjectURL(file);
      setLocalPreviews(prev => [...prev, { file, previewUrl }]);

      // Generate unique filename - upload directly to root of bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

      console.log('📤 Fazendo upload da imagem:', fileName);

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('products')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        // Remove local preview on error
        setLocalPreviews(prev => prev.filter(p => p.previewUrl !== previewUrl));
        URL.revokeObjectURL(previewUrl);
        throw uploadError;
      }

      console.log('✅ Upload realizado:', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      console.log('🔗 URL pública gerada:', publicUrl);

      // Remove local preview and add real URL
      setLocalPreviews(prev => prev.filter(p => p.previewUrl !== previewUrl));
      URL.revokeObjectURL(previewUrl);

      const newImages = [...images, publicUrl];
      console.log('📸 Atualizando lista de imagens:', newImages);
      onImagesChange(newImages);
      
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        await uploadImage(files[i]);
      }
      e.target.value = '';
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = images[index];
    
    try {
      const url = new URL(imageUrl);
      // Extract file path after /object/public/products/
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/products\/(.+)$/);
      
      if (pathMatch) {
        const filePath = pathMatch[1];
        console.log('🗑️ Removendo imagem do storage:', filePath);
        
        const { error } = await supabase.storage
          .from('products')
          .remove([filePath]);
        
        if (error) {
          console.error('Erro ao deletar do storage:', error);
        } else {
          console.log('✅ Imagem removida do storage');
        }
      }
    } catch (error) {
      console.error('Erro ao processar URL da imagem:', error);
    }
    
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.success('Imagem removida');
  };

  // All images to display: saved images + local previews being uploaded
  const allImages = [
    ...images.map((url, i) => ({ url, key: `saved-${i}`, isLocal: false, index: i })),
    ...localPreviews.map((p, i) => ({ url: p.previewUrl, key: `local-${i}`, isLocal: true, index: -1 })),
  ];

  return (
    <div className="space-y-4">
      <Label>Imagens do Produto</Label>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {allImages.map((img) => (
          <div 
            key={img.key} 
            className="relative aspect-square bg-muted rounded-lg overflow-hidden border-2 border-border group"
          >
            <img 
              src={img.url} 
              alt="Produto"
              className="w-full h-full object-cover"
            />
            {img.isLocal ? (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(img.index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {/* Upload button */}
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
            multiple
          />
          <Upload className="h-6 w-6 sm:h-8 sm:w-8" />
          <span className="text-xs sm:text-sm text-center px-2">
            Adicionar Foto
          </span>
        </label>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground">
        Formatos aceitos: JPG, PNG, WebP • Tamanho máximo: 5MB • Múltiplas fotos permitidas
      </p>
    </div>
  );
};
