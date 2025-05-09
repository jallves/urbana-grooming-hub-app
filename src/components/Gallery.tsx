
import React from 'react';
import GalleryHeader from './gallery/GalleryHeader';
import LoadingState from './gallery/LoadingState';
import LightboxModal from './gallery/LightboxModal';
import CarouselSection from './gallery/CarouselSection';
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
    <section id="gallery" className="urbana-section py-24">
      <div className="urbana-container">
        <GalleryHeader />
        
        <CarouselSection 
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
