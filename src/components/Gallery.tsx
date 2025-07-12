import React from 'react';
import { motion } from "framer-motion";
import GalleryHeader from './gallery/GalleryHeader';
import LoadingState from './gallery/LoadingState';
import LightboxModal from './gallery/LightboxModal';
import CarouselSection from './gallery/CarouselSection';
import GalleryFooter from './gallery/GalleryFooter';
import { useGalleryImages } from '@/hooks/useGalleryImages';
import { useLightbox } from '@/hooks/useLightbox';
import { Camera } from 'lucide-react';

const Gallery: React.FC = () => {
  const { images, loading } = useGalleryImages();
  const {
    selectedImage,
    setSelectedImage,
    closeModal,
    showNext,
    showPrevious
  } = useLightbox();

  console.log('Gallery component - loading:', loading, 'images count:', images.length);

  if (loading) {
    return <LoadingState />;
  }

  const handleShowNext = () => showNext(images.length);
  const handleShowPrevious = () => showPrevious(images.length);

  return (
    <section id="gallery" className="relative min-h-screen py-24 bg-gradient-to-b from-white via-urbana-gray/5 to-white overflow-hidden">
      {/* Modern background elements */}
      <div className="absolute inset-0 opacity-3">
        <div className="absolute top-32 right-10 w-64 h-64 bg-urbana-gold rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-10 w-80 h-80 bg-urbana-gold rounded-full blur-3xl"></div>
      </div>

      <div className="urbana-container relative z-10">
        <GalleryHeader />

        {images.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <CarouselSection
              images={images}
              onSelectImage={setSelectedImage}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center py-20"
          >
            <div className="max-w-lg mx-auto">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold/10 rounded-2xl flex items-center justify-center mx-auto">
                  <Camera className="h-12 w-12 text-urbana-gold" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-urbana-gold/20 rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-2xl font-playfair font-bold text-urbana-black mb-4">
                Galeria em Construção
              </h3>
              <p className="text-urbana-gray text-lg leading-relaxed">
                Nossa galeria está sendo preparada com cuidado especial.
                Em breve você poderá ver nossos trabalhos mais incríveis!
              </p>
            </div>
          </motion.div>
        )}

        <GalleryFooter />
      </div>

      {selectedImage !== null && (
        <LightboxModal
          selectedImage={selectedImage}
          images={images}
          onClose={closeModal}
          onPrevious={handleShowPrevious}
          onNext={handleShowNext}
        />
      )}
    </section>
  );
};

export default Gallery;
