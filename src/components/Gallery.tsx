
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import GalleryImage from './gallery/GalleryImage';
import LightboxModal from './gallery/LightboxModal';
import { useLightbox } from '@/hooks/useLightbox';

interface GalleryPhoto {
  id: string;
  title: string;
  alt_text: string;
  image_url: string;
  description: string | null;
  published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const Gallery: React.FC = () => {
  const [images, setImages] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedImage, setSelectedImage, closeModal, showNext, showPrevious } = useLightbox();

  // Default images as fallback
  const defaultImages: GalleryPhoto[] = [
    {
      id: '1',
      title: 'Trabalho Profissional',
      alt_text: 'Barbeiro trabalhando com precisão',
      image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      description: 'Nosso time de profissionais trabalhando',
      display_order: 1,
      published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Ambiente Sofisticado',
      alt_text: 'Interior moderno e elegante da barbearia',
      image_url: 'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      description: 'Ambiente confortável e moderno',
      display_order: 2,
      published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Ferramentas Profissionais',
      alt_text: 'Equipamentos de alta qualidade para barbearia',
      image_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      description: 'Equipamentos profissionais de última geração',
      display_order: 3,
      published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        console.log('🔍 Buscando fotos da galeria...');
        
        const { data, error } = await supabase
          .from('gallery_photos')
          .select('*')
          .eq('published', true)
          .order('display_order', { ascending: true });

        if (error) {
          console.error('❌ Erro ao buscar fotos:', error);
          setImages(defaultImages);
        } else if (data && data.length > 0) {
          console.log(`✅ ${data.length} fotos carregadas com sucesso`);
          setImages(data as GalleryPhoto[]);
        } else {
          console.log('⚠️ Nenhuma foto publicada, usando imagens padrão');
          setImages(defaultImages);
        }
      } catch (error) {
        console.error('❌ Erro crítico ao carregar galeria:', error);
        setImages(defaultImages);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();

    // Real-time subscription para atualizações
    const channel = supabase
      .channel('gallery_photos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gallery_photos'
        },
        (payload) => {
          console.log('🔄 Galeria atualizada em tempo real:', payload);
          fetchImages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gray-900">
        <div className="w-full mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Nossa Galeria</h2>
            <p className="text-xl text-gray-400">Conheça nosso trabalho</p>
          </div>
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-gray-900 via-urbana-black to-gray-900 relative overflow-hidden">
      {/* Geometric pattern background */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 215, 0, 0.8) 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }} />
      
      {/* Golden glow orbs */}
      <div className="absolute top-40 left-20 w-64 h-64 bg-urbana-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-20 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl" />
      
      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <h2 
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-tight font-playfair tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #FFA500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 60px rgba(255, 215, 0, 0.3)'
            }}
          >
            Nossa Galeria
          </h2>
          <p className="text-xl md:text-2xl lg:text-3xl text-gray-300 font-raleway font-light tracking-wide">Conheça nosso trabalho e inspire-se</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {images.map((image, index) => (
            <GalleryImage
              key={image.id}
              src={image.image_url}
              alt={image.alt_text}
              delay={index * 0.05}
              onClick={() => setSelectedImage(index)}
            />
          ))}
        </div>
      </div>

      {selectedImage !== null && (
        <LightboxModal
          selectedImage={selectedImage}
          images={images.map((img, idx) => ({
            id: idx,
            src: img.image_url,
            alt: img.title || img.alt_text
          }))}
          onClose={closeModal}
          onPrevious={() => showPrevious(images.length)}
          onNext={() => showNext(images.length)}
        />
      )}
    </section>
  );
};

export default Gallery;
