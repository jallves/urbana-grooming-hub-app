
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Download, Share2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GalleryImage as GalleryImageType } from "@/types/settings";

interface LightboxModalProps {
  selectedImage: number;
  images: GalleryImageType[];
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

const LightboxModal: React.FC<LightboxModalProps> = ({
  selectedImage,
  images,
  onClose,
  onPrevious,
  onNext
}) => {
  const currentImage = images[selectedImage];

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrevious();
      if (e.key === 'ArrowRight') onNext();
    };

    document.addEventListener('keydown', handleKeyPress);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, onPrevious, onNext]);

  if (!currentImage) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentImage.alt,
          text: `Confira este trabalho da Barbearia Urbana: ${currentImage.alt}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage.src;
    link.download = `barbearia-urbana-${currentImage.alt.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    link.click();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-0 left-0 right-0 z-10 p-6"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                {selectedImage + 1} de {images.length}
              </Badge>
              <h3 className="text-white font-semibold text-lg">{currentImage.alt}</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-white hover:bg-white/10"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-white hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Navigation Buttons */}
        <Button
          variant="ghost"
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10 rounded-full p-3"
          disabled={selectedImage === 0}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10 rounded-full p-3"
          disabled={selectedImage === images.length - 1}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>

        {/* Main Image */}
        <motion.div
          key={selectedImage}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center h-full p-20"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={currentImage.src}
            alt={currentImage.alt}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </motion.div>

        {/* Thumbnails */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <div className="flex gap-2 bg-black/50 rounded-lg p-2 backdrop-blur-sm">
            {images.slice(Math.max(0, selectedImage - 2), selectedImage + 3).map((image, index) => {
              const actualIndex = Math.max(0, selectedImage - 2) + index;
              return (
                <button
                  key={image.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = actualIndex;
                    if (newIndex !== selectedImage) {
                      // Calculate direction and call appropriate function
                      if (newIndex > selectedImage) {
                        for (let i = selectedImage; i < newIndex; i++) {
                          onNext();
                        }
                      } else {
                        for (let i = selectedImage; i > newIndex; i--) {
                          onPrevious();
                        }
                      }
                    }
                  }}
                  className={`
                    w-16 h-16 rounded-md overflow-hidden transition-all duration-200
                    ${actualIndex === selectedImage 
                      ? 'ring-2 ring-urbana-gold scale-110' 
                      : 'opacity-60 hover:opacity-100'
                    }
                  `}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LightboxModal;
