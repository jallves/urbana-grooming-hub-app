
import React, { useState, useEffect } from 'react';
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { GalleryImageType } from "@/types/settings";
import GalleryImage from './gallery/GalleryImage';
import LightboxModal from './gallery/LightboxModal';
import CarouselSection from './gallery/CarouselSection';

const Gallery: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [images, setImages] = useState<GalleryImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch gallery images from Supabase
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('gallery_images')
          .select('*')
          .order('display_order', { ascending: true })
          .eq('is_active', true);
        
        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          const formattedData: GalleryImageType[] = data.map(item => ({
            id: parseInt(item.id.toString().replace(/-/g, '').substring(0, 8), 16),
            src: item.src,
            alt: item.alt
          }));
          setImages(formattedData);
        } else {
          // Fallback to default images if no data is available
          setImages([
            { id: 1, src: "/gallery-1.jpg", alt: "Corte Clássico" },
            { id: 2, src: "/gallery-2.jpg", alt: "Barba Estilizada" },
            { id: 3, src: "/gallery-3.jpg", alt: "Ambiente Premium" },
            { id: 4, src: "/gallery-4.jpg", alt: "Atendimento Exclusivo" },
            { id: 5, src: "/gallery-5.jpg", alt: "Produtos de Qualidade" },
            { id: 6, src: "/gallery-6.jpg", alt: "Experiência Completa" },
          ]);
        }
      } catch (error) {
        console.error('Error loading gallery images:', error);
        toast({
          title: "Erro ao carregar galeria",
          description: "Não foi possível carregar as imagens da galeria do banco de dados",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, [toast]);

  const closeModal = () => {
    setSelectedImage(null);
  };

  const showNext = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % images.length);
    }
  };

  const showPrevious = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + images.length) % images.length);
    }
  };

  if (loading) {
    return (
      <section id="gallery" className="urbana-section py-24">
        <div className="urbana-container text-center">
          <div className="w-16 h-16 border-t-4 border-urbana-gold border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando galeria...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="urbana-section py-24">
      <div className="urbana-container">
        <div className="flex flex-col items-center mb-12">
          <div className="flex items-center w-full max-w-md justify-center mb-6">
            <Separator className="w-16 bg-urbana-gold h-[1px]" />
            <span className="px-4 text-urbana-gold font-semibold uppercase tracking-wider text-sm">Nossa Galeria</span>
            <Separator className="w-16 bg-urbana-gold h-[1px]" />
          </div>
          <h2 className="urbana-heading text-center">Conheça Nosso Trabalho</h2>
          <p className="urbana-subheading text-center">Nossos maiores orgulhos são os resultados que entregamos aos nossos clientes</p>
        </div>

        <CarouselSection images={images} onSelectImage={setSelectedImage} />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <GalleryImage 
              key={index} 
              src={image.src} 
              alt={image.alt} 
              delay={index * 0.1} 
              onClick={() => setSelectedImage(index)}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-urbana-brown hover:text-urbana-gold transition-colors"
          >
            <span className="mr-2">Veja mais no nosso Instagram</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
        </div>
      </div>

      {selectedImage !== null && (
        <LightboxModal 
          selectedImage={selectedImage}
          images={images}
          onClose={closeModal}
          onPrevious={showPrevious}
          onNext={showNext}
        />
      )}
    </section>
  );
};

export default Gallery;
