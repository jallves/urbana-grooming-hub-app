
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadFileToStorage } from '@/components/admin/settings/media/api/storageApi';

export interface GalleryPhoto {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  alt_text: string;
  published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const useSupabaseGallery = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Buscar fotos do banco de dados
  const fetchPhotos = async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando fotos no banco de dados...');
      
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('published', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar fotos:', error);
        throw error;
      }

      console.log(`📸 ${data?.length || 0} fotos encontradas no banco`);
      setPhotos(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar galeria:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar todas as fotos (incluindo não publicadas) para admin
  const fetchAllPhotos = async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando todas as fotos para admin...');
      
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar fotos:', error);
        throw error;
      }

      console.log(`📸 ${data?.length || 0} fotos encontradas (admin)`);
      setPhotos(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar galeria:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  // Upload de foto
  const uploadPhoto = async (file: File, title: string, altText: string): Promise<boolean> => {
    try {
      setUploading(true);
      console.log('🚀 Iniciando upload da foto:', title);

      // 1. Upload do arquivo para storage
      const imageUrl = await uploadFileToStorage(file, 'gallery-photos', 'uploads');
      console.log('✅ Arquivo enviado para storage:', imageUrl);

      // 2. Salvar dados no banco
      const { data, error } = await supabase
        .from('gallery_photos')
        .insert([{
          title: title,
          alt_text: altText,
          image_url: imageUrl,
          published: true,
          display_order: photos.length
        }])
        .select();

      if (error) {
        console.error('❌ Erro ao salvar no banco:', error);
        throw error;
      }

      console.log('✅ Foto salva no banco de dados:', data);
      
      // Recarregar fotos
      await fetchPhotos();
      return true;
    } catch (error) {
      console.error('❌ Erro no upload:', error);
      return false;
    } finally {
      setUploading(false);
    }
  };

  // Atualizar foto
  const updatePhoto = async (id: string, updates: Partial<GalleryPhoto>): Promise<boolean> => {
    try {
      console.log('🔄 Atualizando foto:', id);
      
      const { error } = await supabase
        .from('gallery_photos')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao atualizar:', error);
        throw error;
      }

      console.log('✅ Foto atualizada com sucesso');
      await fetchAllPhotos(); // Usar fetchAllPhotos para atualizar lista de admin
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar foto:', error);
      return false;
    }
  };

  // Toggle publicação da foto
  const togglePublished = async (id: string, currentState: boolean): Promise<boolean> => {
    try {
      console.log(`🔄 ${currentState ? 'Despublicando' : 'Publicando'} foto:`, id);
      
      const { error } = await supabase
        .from('gallery_photos')
        .update({
          published: !currentState,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao alterar status:', error);
        throw error;
      }

      console.log(`✅ Foto ${!currentState ? 'publicada' : 'despublicada'} com sucesso`);
      await fetchAllPhotos();
      return true;
    } catch (error) {
      console.error('❌ Erro ao alterar status de publicação:', error);
      return false;
    }
  };

  // Deletar foto
  const deletePhoto = async (id: string): Promise<boolean> => {
    try {
      console.log('🗑️ Deletando foto:', id);
      
      const { error } = await supabase
        .from('gallery_photos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao deletar:', error);
        throw error;
      }

      console.log('✅ Foto deletada com sucesso');
      await fetchPhotos();
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar foto:', error);
      return false;
    }
  };

  // Reordenar fotos
  const reorderPhoto = async (id: string, direction: 'up' | 'down'): Promise<boolean> => {
    try {
      const currentIndex = photos.findIndex(p => p.id === id);
      if (currentIndex === -1) return false;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= photos.length) return false;

      // Trocar display_order entre as duas fotos
      const currentPhoto = photos[currentIndex];
      const targetPhoto = photos[newIndex];

      await updatePhoto(currentPhoto.id, { display_order: targetPhoto.display_order });
      await updatePhoto(targetPhoto.id, { display_order: currentPhoto.display_order });

      return true;
    } catch (error) {
      console.error('❌ Erro ao reordenar:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  return {
    photos,
    loading,
    uploading,
    fetchPhotos,
    fetchAllPhotos,
    uploadPhoto,
    updatePhoto,
    togglePublished,
    deletePhoto,
    reorderPhoto
  };
};
