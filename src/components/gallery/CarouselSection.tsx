
import React from 'react';
import { motion } from "framer-motion";
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="mb-12"
    >
      <Carousel 
        className="w-full group"
        plugins={[plugin.current]}
        opts={{
          align: "start",
          loop: true,
        }}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {images.map((image, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-2 h-full"
              >
                <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 group/item">
                  <GalleryImage 
                    src={image.src} 
                    alt={image.alt} 
                    delay={0.1} 
                    onClick={() => onSelectImage(index)}
                  />
                  
                  {/* Modern overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-urbana-black/60 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white font-medium text-sm truncate">
                        {image.alt}
                      </p>
                    </div>
                  </div>
                  
                  {/* Modern hover effect */}
                  <div className="absolute top-4 right-4 w-8 h-8 bg-urbana-gold/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                    <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
                  </div>
                </div>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Modern navigation */}
        <div className="flex justify-center mt-8 gap-4">
          <CarouselPrevious className="static translate-y-0 bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black border-urbana-gold hover:border-urbana-gold/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110" />
          <CarouselNext className="static translate-y-0 bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black border-urbana-gold hover:border-urbana-gold/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110" />
        </div>
      </Carousel>
    </motion.div>
  );
};

export default CarouselSection;
