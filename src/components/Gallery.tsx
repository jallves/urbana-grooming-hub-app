
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

  if (loading) {
    return <LoadingState />;
  }

  const handleShowNext = () => showNext(images.length);
  const handleShowPrevious = () => showPrevious(images.length);

  return (
    <section id="gallery" className="urbana-section py-24 bg-gradient-to-b from-urbana-gray/20 to-white">
      <div className="urbana-container">
        <GalleryHeader />
        
        <ModernGalleryGrid 
          images={images} 
          onSelectImage={setSelectedImage} 
        />

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
