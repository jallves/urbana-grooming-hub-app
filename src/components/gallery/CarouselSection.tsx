
import React from 'react';
import GalleryImage from './GalleryImage';
import type { GalleryImage as GalleryImageType } from "@/types/settings";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface CarouselSectionProps {
  images: GalleryImageType[];
  onSelectImage: (index: number) => void;
}

const CarouselSection: React.FC<CarouselSectionProps> = ({ images, onSelectImage }) => {
  const displayedImages = images.slice(0, 3); // Only show first 3 images in carousel
  
  return (
    <div className="mb-12">
      <Carousel className="w-full">
        <CarouselContent>
          {displayedImages.map((image, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-2 h-full">
                <GalleryImage 
                  src={image.src} 
                  alt={image.alt} 
                  delay={0.1} 
                  onClick={() => onSelectImage(index)}
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
  );
};

export default CarouselSection;
