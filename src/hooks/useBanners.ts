import { useState, useEffect } from 'react';
import { BannerImage } from '@/types/settings';

const DEFAULT_BANNER: BannerImage = {
  id: 'default',
  title: 'Costa Urbana Barbearia',
  subtitle: 'Estilo & Elegância',
  image_url: '/costa-urbana-logo.png',
  button_text: 'Agendar Agora',
  button_link: '/painel-cliente/login',
  is_active: true,
  display_order: 1
};

export const useBanners = () => {
  const [banners, setBanners] = useState<BannerImage[]>([DEFAULT_BANNER]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Banner table doesn't exist, just use default
  const fetchBanners = async () => {
    setBanners([DEFAULT_BANNER]);
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  return { banners, loading, error, refetch: fetchBanners };
};