import React from 'react';
import { FormField, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { BarberFormValues } from '@/components/admin/barbers/hooks/useBarberForm';

interface StaffProfileImageProps {
  form: UseFormReturn<BarberFormValues>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading?: boolean;
}

const StaffProfileImage: React.FC<StaffProfileImageProps> = ({ form, handleFileChange, isUploading }) => {
  const currentImageUrl = form.watch('image_url');

  return (
    <FormField
      control={form.control}
      name="image_url"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Foto do profissional</FormLabel>
          <div className="space-y-4">
            {currentImageUrl && (
              <div className="flex justify-center">
                <img 
                  src={currentImageUrl} 
                  alt="Imagem de perfil" 
                  className="h-32 w-32 object-cover rounded-full border-2 border-primary shadow-lg"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="flex-1"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <input type="hidden" {...field} value={field.value || ''} />
            </div>
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                <span>Fazendo upload...</span>
              </div>
            )}
          </div>
          <FormDescription>
            Escolha uma foto para o perfil (JPG, PNG ou WEBP - máx. 5MB)
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default StaffProfileImage;
