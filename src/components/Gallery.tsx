
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Eye, X } from 'lucide-react';

interface GalleryImage {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
}

const Gallery: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  console.log('Gallery component - loading:', loading, 'images count:', images.length);

  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        console.log('🖼️ Carregando galeria da homepage do banco de dados...');
        
        const { data, error } = await supabase
          .from('gallery_images')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (error) {
          console.error('Erro ao carregar galeria:', error);
          // Fallback para imagens padrão
          setImages([
            {
              id: '1',
              image_url: '/gallery-1.jpg',
              title: 'Corte Clássico',
              description: 'Técnica tradicional de barbearia'
            },
            {
              id: '2',
              image_url: '/gallery-2.jpg',
              title: 'Barba & Bigode',
              description: 'Cuidado completo com pelos faciais'
            },
            {
              id: '3',
              image_url: '/gallery-3.jpg',
              title: 'Ambiente Premium',
              description: 'Espaço exclusivo e confortável'
            }
          ]);
        } else if (data && data.length > 0) {
          console.log('Galeria carregada:', data.length, 'imagens');
          setImages(data);
        } else {
          // Fallback se não há dados
          setImages([
            {
              id: '1',
              image_url: '/gallery-1.jpg',
              title: 'Corte Clássico',
              description: 'Técnica tradicional de barbearia'
            },
            {
              id: '2',
              image_url: '/gallery-2.jpg',
              title: 'Barba & Bigode',
              description: 'Cuidado completo com pelos faciais'
            },
            {
              id: '3',
              image_url: '/gallery-3.jpg',
              title: 'Ambiente Premium',
              description: 'Espaço exclusivo e confortável'
            }
          ]);
        }
      } catch (error) {
        console.error('Erro ao carregar galeria:', error);
        // Fallback para imagens padrão
        setImages([
          {
            id: '1',
            image_url: '/gallery-1.jpg',
            title: 'Corte Clássico',
            description: 'Técnica tradicional de barbearia'
          },
          {
            id: '2',
            image_url: '/gallery-2.jpg',
            title: 'Barba & Bigode',
            description: 'Cuidado completo com pelos faciais'
          },
          {
            id: '3',
            image_url: '/gallery-3.jpg',
            title: 'Ambiente Premium',
            description: 'Espaço exclusivo e confortável'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadGalleryImages();
  }, []);

  if (loading) {
    return (
      <div className="py-20 bg-urbana-black text-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-urbana-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-urbana-gold">Carregando galeria...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-20 bg-urbana-black text-white">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-urbana-gold">
            Nossa Galeria
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Conheça nosso ambiente exclusivo e os resultados do nosso trabalho
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative group cursor-pointer overflow-hidden rounded-lg bg-urbana-brown"
              onClick={() => setSelectedImage(image)}
            >
              <div className="aspect-square">
                <img
                  src={image.image_url}
                  alt={image.title || 'Galeria Costa Urbana'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-gallery.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Eye className="text-white h-8 w-8" />
                </div>
              </div>
              {image.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-semibold">{image.title}</h3>
                  {image.description && (
                    <p className="text-white/80 text-sm">{image.description}</p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Modal para visualizar imagem */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl w-full">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-urbana-gold transition-colors"
              >
                <X className="h-8 w-8" />
              </button>
              <img
                src={selectedImage.image_url}
                alt={selectedImage.title || 'Galeria Costa Urbana'}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              {selectedImage.title && (
                <div className="mt-4 text-center">
                  <h3 className="text-white text-xl font-semibold">{selectedImage.title}</h3>
                  {selectedImage.description && (
                    <p className="text-white/80">{selectedImage.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;
