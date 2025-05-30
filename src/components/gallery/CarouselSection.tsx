
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
import Autoplay from "embla-carousel-autoplay";

interface CarouselSectionProps {
  images: GalleryImageType[];
  onSelectImage: (index: number) => void;
}

const CarouselSection: React.FC<CarouselSectionProps> = ({ images, onSelectImage }) => {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  return (
    <div className="mb-12">
      <Carousel 
        className="w-full"
        plugins={[plugin.current]}
        opts={{
          align: "start",
          loop: true,
        }}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {images.map((image, index) => (
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
        <div className="flex justify-center mt-4 gap-2">
          <CarouselPrevious className="static translate-y-0 bg-urbana-gold hover:bg-urbana-gold/80 text-white border-urbana-gold" />
          <CarouselNext className="static translate-y-0 bg-urbana-gold hover:bg-urbana-gold/80 text-white border-urbana-gold" />
        </div>
      </Carousel>
    </div>
  );
};

export default CarouselSection;
