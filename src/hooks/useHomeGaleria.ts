import { useState, useEffect, useCallback } from 'react';
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
  const [data, setData] = useState<GalleryPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchGaleria = useCallback(async () => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout | null = null;

    setStatus('loading');
    setError(null);

    try {
      let timedOut = false;

      timeoutId = setTimeout(() => {
        timedOut = true;
      }, 8000);

      const { data: images, error: fetchError } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (timeoutId) clearTimeout(timeoutId);

      if (cancelled) return;

      if (timedOut && !images) {
        console.warn('[Galeria Hook] Timeout - usando fallback');
        setData(defaultImages);
        setStatus('success');
        return;
      }

      if (fetchError) {
        console.error('[Galeria Hook] ❌ Erro:', fetchError.message);
        setData(defaultImages);
        setStatus('success');
      } else if (images && images.length > 0) {
        console.log('[Galeria Hook] ✅ Carregadas:', images.length, 'imagens');
        setData(images);
        setStatus('success');
      } else {
        console.log('[Galeria Hook] ⚠️ Sem imagens - usando fallback');
        setData(defaultImages);
        setStatus('success');
      }
    } catch (err: any) {
      if (cancelled) return;
      if (timeoutId) clearTimeout(timeoutId);
      
      console.error('[Galeria Hook] Exceção:', err?.message);
      setData(defaultImages);
      setStatus('success');
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    console.log('[useHomeGaleria] 🚀 Iniciando fetch de galeria...');
    fetchGaleria();

    // Real-time subscription
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
          console.log('[Galeria Hook] Atualização em tempo real');
          fetchGaleria();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGaleria]);

  const refetch = useCallback(() => {
    fetchGaleria();
  }, [fetchGaleria]);

  return { status, data, error, refetch };
};
