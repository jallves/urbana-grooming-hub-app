
export interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  published: boolean;
  created_at: string;
  display_order: number;
}

class GalleryService {
  private storageKey = 'barbearia_gallery_photos';

  // Salvar foto na galeria
  async savePhoto(photoData: {
    src: string;
    alt: string;
    file?: File;
  }): Promise<GalleryPhoto> {
    try {
      const photos = this.getPhotos();
      
      // Se há um arquivo, criar URL local
      let finalSrc = photoData.src;
      if (photoData.file) {
        finalSrc = URL.createObjectURL(photoData.file);
      }

      const newPhoto: GalleryPhoto = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        src: finalSrc,
        alt: photoData.alt,
        published: true,
        created_at: new Date().toISOString(),
        display_order: photos.length
      };

      const updatedPhotos = [...photos, newPhoto];
      this.persistPhotos(updatedPhotos);
      
      // Notificar mudança global
      this.notifyGalleryUpdate(updatedPhotos);
      
      console.log('✅ Foto salva com sucesso:', newPhoto);
      return newPhoto;
    } catch (error) {
      console.error('❌ Erro ao salvar foto:', error);
      throw error;
    }
  }

  // Obter todas as fotos
  getPhotos(): GalleryPhoto[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const photos = JSON.parse(stored);
        return Array.isArray(photos) ? photos : [];
      }
      return this.getDefaultPhotos();
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
      return this.getDefaultPhotos();
    }
  }

  // Obter fotos publicadas para homepage
  getPublishedPhotos(): GalleryPhoto[] {
    return this.getPhotos()
      .filter(photo => photo.published)
      .sort((a, b) => a.display_order - b.display_order);
  }

  // Atualizar foto
  async updatePhoto(id: string, updates: Partial<GalleryPhoto>): Promise<boolean> {
    try {
      const photos = this.getPhotos();
      const index = photos.findIndex(p => p.id === id);
      
      if (index === -1) return false;
      
      photos[index] = { ...photos[index], ...updates };
      this.persistPhotos(photos);
      this.notifyGalleryUpdate(photos);
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      return false;
    }
  }

  // Remover foto
  async deletePhoto(id: string): Promise<boolean> {
    try {
      const photos = this.getPhotos();
      const filteredPhotos = photos.filter(p => p.id !== id);
      
      this.persistPhotos(filteredPhotos);
      this.notifyGalleryUpdate(filteredPhotos);
      
      return true;
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      return false;
    }
  }

  // Reordenar fotos
  async reorderPhotos(photoId: string, direction: 'up' | 'down'): Promise<boolean> {
    try {
      const photos = this.getPhotos();
      const currentIndex = photos.findIndex(p => p.id === photoId);
      
      if (currentIndex === -1) return false;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= photos.length) return false;
      
      // Trocar posições
      [photos[currentIndex], photos[newIndex]] = [photos[newIndex], photos[currentIndex]];
      
      // Atualizar display_order
      photos.forEach((photo, index) => {
        photo.display_order = index;
      });
      
      this.persistPhotos(photos);
      this.notifyGalleryUpdate(photos);
      
      return true;
    } catch (error) {
      console.error('Erro ao reordenar fotos:', error);
      return false;
    }
  }

  // Persistir no localStorage
  private persistPhotos(photos: GalleryPhoto[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(photos));
      console.log(`💾 ${photos.length} fotos salvas no localStorage`);
    } catch (error) {
      console.error('Erro ao persistir fotos:', error);
    }
  }

  // Notificar atualização global
  private notifyGalleryUpdate(photos: GalleryPhoto[]): void {
    // Evento para homepage
    window.dispatchEvent(new CustomEvent('galleryUpdated', { 
      detail: { photos } 
    }));
    
    // Evento para forçar refresh
    window.dispatchEvent(new CustomEvent('galleryRefresh'));
    
    console.log('📡 Galeria atualizada - evento disparado');
  }

  // Fotos padrão
  private getDefaultPhotos(): GalleryPhoto[] {
    const defaultPhotos = [
      { src: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500&h=400&fit=crop", alt: "Corte Clássico Masculino" },
      { src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&h=400&fit=crop", alt: "Barba Estilizada Profissional" },
      { src: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=500&h=400&fit=crop", alt: "Ambiente Premium da Barbearia" },
      { src: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=500&h=400&fit=crop", alt: "Atendimento Exclusivo e Personalizado" },
      { src: "https://images.unsplash.com/photo-1622286346003-c8b29c15e5ad?w=500&h=400&fit=crop", alt: "Produtos de Qualidade Premium" },
      { src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&h=400&fit=crop", alt: "Experiência Completa de Barbearia" }
    ];

    return defaultPhotos.map((photo, index) => ({
      id: `default_${index + 1}`,
      src: photo.src,
      alt: photo.alt,
      published: true,
      created_at: new Date().toISOString(),
      display_order: index
    }));
  }

  // Limpar cache e recarregar
  clearCache(): void {
    localStorage.removeItem(this.storageKey);
    this.notifyGalleryUpdate([]);
  }
}

export const galleryService = new GalleryService();
