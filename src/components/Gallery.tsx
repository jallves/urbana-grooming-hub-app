
import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
// Use a type-only import with 'type' keyword to avoid conflict with the component
import type { GalleryImage as GalleryImageType } from "@/types/settings";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const GalleryImage = ({ src, alt, delay, onClick }: { src: string; alt: string; delay: number; onClick?: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="relative aspect-square overflow-hidden group cursor-pointer"
      onClick={onClick}
    >
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-urbana-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
        <div className="p-4 text-white">
          <h3 className="font-bold text-lg">{alt}</h3>
        </div>
      </div>
    </motion.div>
  );
};

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

        <div className="mb-12">
          <Carousel className="w-full">
            <CarouselContent>
              {images.slice(0, 3).map((image, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-2 h-full">
                    <GalleryImage 
                      src={image.src} 
                      alt={image.alt} 
                      delay={0.1} 
                      onClick={() => setSelectedImage(index)}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center mt-4">
              <CarouselPrevious className="static mr-2 translate-y-0" />
              <CarouselNext className="static ml-2 translate-y-0" />
            </div>
          </Carousel>
        </div>

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

      {/* Lightbox Modal */}
      {selectedImage !== null && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-urbana-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img 
              src={images[selectedImage].src} 
              alt={images[selectedImage].alt}
              className="w-full h-auto object-contain max-h-[80vh]"
            />
            <button 
              className="absolute top-2 right-2 text-white bg-urbana-black/50 hover:bg-urbana-black p-2 rounded-full"
              onClick={closeModal}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
              <button 
                className="p-2 bg-urbana-black/50 hover:bg-urbana-black text-white rounded-full"
                onClick={(e) => { e.stopPropagation(); showPrevious(); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
            </div>
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
              <button 
                className="p-2 bg-urbana-black/50 hover:bg-urbana-black text-white rounded-full"
                onClick={(e) => { e.stopPropagation(); showNext(); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
            <div className="text-white text-center py-2">
              {images[selectedImage].alt} - {selectedImage + 1}/{images.length}
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
};

export default Gallery;
