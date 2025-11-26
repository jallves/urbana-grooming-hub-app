import React from 'react';
import { RefreshCw, Image as ImageIcon } from 'lucide-react';
import GalleryImage from './gallery/GalleryImage';
import LightboxModal from './gallery/LightboxModal';
import { useLightbox } from '@/hooks/useLightbox';
import { useHomeGaleria } from '@/hooks/useHomeGaleria';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const Gallery: React.FC = () => {
  const { status, data: images, error, refetch } = useHomeGaleria();
  const { selectedImage, setSelectedImage, closeModal, showNext, showPrevious } = useLightbox();

  // Loading state - skeleton
  if (status === 'loading') {
    return (
      <section className="py-12 md:py-20 relative overflow-hidden bg-urbana-black/50">
        <div className="w-full relative z-10 px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-urbana-gold font-playfair">
              Nossa Galeria
            </h2>
            <p className="text-xl md:text-2xl text-gray-400">Carregando conteúdo...</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="aspect-square bg-urbana-black/80 rounded-lg animate-pulse"
                style={{
                  background: 'linear-gradient(90deg, rgba(30,30,30,0.5) 25%, rgba(50,50,50,0.5) 50%, rgba(30,30,30,0.5) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite'
                }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <section className="py-12 md:py-20 relative overflow-hidden bg-urbana-black/50">
        <div className="w-full relative z-10 px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-urbana-gold font-playfair">
              Nossa Galeria
            </h2>
            <p className="text-xl md:text-2xl text-gray-400">Conheça nosso trabalho</p>
          </div>
          
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-urbana-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-urbana-gold" />
            </div>
            <p className="text-urbana-gold/70 mb-6">{error || 'Não foi possível carregar este conteúdo agora.'}</p>
            <Button
              onClick={refetch}
              className="bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black font-semibold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Success state
  return (
    <section className="py-12 md:py-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 215, 0, 0.8) 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }} />
      
      <div className="absolute top-40 left-20 w-64 h-64 bg-urbana-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-20 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl" />
      
      <div className="w-full relative z-10 px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-tight font-playfair tracking-tight relative inline-block"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #FFA500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 60px rgba(255, 215, 0, 0.3)'
            }}
          >
            Nossa Galeria
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              viewport={{ once: true }}
              className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-urbana-gold to-transparent rounded-full shadow-[0_0_15px_rgba(255,215,0,0.6)]"
            />
          </h2>
          <p className="text-xl md:text-2xl lg:text-3xl text-gray-300 font-raleway font-light tracking-wide">Conheça nosso trabalho e inspire-se</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {images.map((image, index) => (
            <GalleryImage
              key={image.id}
              src={image.src}
              alt={image.alt}
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
            src: img.src,
            alt: img.alt
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
