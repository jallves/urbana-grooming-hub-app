
import React from 'react';
import GalleryHeader from './gallery/GalleryHeader';
import LoadingState from './gallery/LoadingState';
import LightboxModal from './gallery/LightboxModal';
import ModernGalleryGrid from './gallery/ModernGalleryGrid';
import GalleryFooter from './gallery/GalleryFooter';
import { useGalleryImages } from '@/hooks/useGalleryImages';
import { useLightbox } from '@/hooks/useLightbox';

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
    <section id="gallery" className="urbana-section py-24 bg-gradient-to-b from-urbana-gray/20 to-white">
      <div className="urbana-container">
        <GalleryHeader />
        
        {images.length > 0 ? (
          <ModernGalleryGrid 
            images={images} 
            onSelectImage={setSelectedImage} 
          />
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">📷</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Galeria em breve
            </h3>
            <p className="text-gray-500">
              Estamos preparando nossa galeria de fotos para você
            </p>
          </div>
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
