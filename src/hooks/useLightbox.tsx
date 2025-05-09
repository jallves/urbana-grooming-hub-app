
import { useState } from 'react';

export const useLightbox = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const closeModal = () => {
    setSelectedImage(null);
  };

  const showNext = (totalImages: number) => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % totalImages);
    }
  };

  const showPrevious = (totalImages: number) => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + totalImages) % totalImages);
    }
  };

  return {
    selectedImage,
    setSelectedImage,
    closeModal,
    showNext,
    showPrevious
  };
};
