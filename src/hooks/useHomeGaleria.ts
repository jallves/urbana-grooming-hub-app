import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Status = 'loading' | 'success' | 'error';

interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  is_active?: boolean;
  display_order?: number;
}

const defaultImages: GalleryPhoto[] = [
  {
    id: '1',
    src: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    alt: 'Barbeiro trabalhando com precisão',
    is_active: true,
    display_order: 1,
  },
  {
    id: '2',
    src: 'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    alt: 'Interior moderno e elegante da barbearia',
    is_active: true,
    display_order: 2,
  },
  {
    id: '3',
    src: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    alt: 'Equipamentos de alta qualidade para barbearia',
    is_active: true,
    display_order: 3,
  },
];

export const useHomeGaleria = () => {
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<GalleryPhoto[]>(defaultImages);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    console.log('[Galeria Hook] 🚀 Inicializando...');

    const fetchGaleria = async () => {
      console.log('[Galeria Hook] 📡 Buscando dados...');
      
      try {
        // Timeout de 10 segundos
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Timeout')), 10000);
        });

        const fetchPromise = supabase
          .from('gallery_images')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        const { data: images, error: fetchError } = await Promise.race([
          fetchPromise,
          timeoutPromise
        ]) as any;

        clearTimeout(timeoutId);

        if (!mounted) {
          console.log('[Galeria Hook] ⚠️ Componente desmontado');
          return;
        }

        if (fetchError) {
          console.error('[Galeria Hook] ❌ Erro:', fetchError.message);
          setStatus('success'); // Usa fallback
        } else if (images && images.length > 0) {
          console.log('[Galeria Hook] ✅ Carregadas:', images.length, 'imagens');
          setData(images);
          setStatus('success');
        } else {
          console.log('[Galeria Hook] ⚠️ Nenhuma imagem ativa encontrada');
          setStatus('success'); // Usa fallback
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (!mounted) return;
        
        console.error('[Galeria Hook] ❌ Exceção:', err?.message || 'Erro desconhecido');
        setStatus('success'); // Usa fallback
      }
    };

    fetchGaleria();

    const channel = supabase
      .channel('gallery_images_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gallery_images'
        },
        () => {
          console.log('[Galeria Hook] 🔄 Atualização em tempo real');
          if (mounted) fetchGaleria();
        }
      )
      .subscribe();

    return () => {
      console.log('[Galeria Hook] 🔚 Desmontando...');
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, []);

  const refetch = async () => {
    try {
      const { data: images, error: fetchError } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) {
        console.error('[Galeria] Erro no refetch:', fetchError.message);
      } else if (images && images.length > 0) {
        setData(images);
      }
    } catch (err: any) {
      console.error('[Galeria] Exceção no refetch:', err?.message);
    }
  };

  return { status, data, error, refetch };
};
