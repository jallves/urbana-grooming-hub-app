
import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import type { GalleryImage as GalleryImageType } from "@/types/settings";
import GalleryImage from './GalleryImage';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Grid, LayoutGrid, Filter } from "lucide-react";

interface ModernGalleryGridProps {
  images: GalleryImageType[];
  onSelectImage: (index: number) => void;
}

const ModernGalleryGrid: React.FC<ModernGalleryGridProps> = ({ images, onSelectImage }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');
  const [filter, setFilter] = useState<string>('all');
  const [itemsToShow, setItemsToShow] = useState(6);

  // Extract categories from images
  const categories = React.useMemo(() => {
    const cats = new Set(images.map(img => {
      const words = img.alt.toLowerCase().split(' ');
      return words[0] || 'outros';
    }));
    return ['all', ...Array.from(cats)];
  }, [images]);

  // Filter images based on selected filter
  const filteredImages = React.useMemo(() => {
    if (filter === 'all') return images;
    return images.filter(img => 
      img.alt.toLowerCase().includes(filter.toLowerCase())
    );
  }, [images, filter]);

  const visibleImages = filteredImages.slice(0, itemsToShow);
  const hasMore = filteredImages.length > itemsToShow;

  const loadMore = () => {
    setItemsToShow(prev => Math.min(prev + 6, filteredImages.length));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Filter Tags */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Badge
              key={category}
              variant={filter === category ? "default" : "outline"}
              className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                filter === category 
                  ? "bg-urbana-gold text-urbana-black" 
                  : "hover:bg-urbana-gray/20"
              }`}
              onClick={() => {
                setFilter(category);
                setItemsToShow(6);
              }}
            >
              {category === 'all' ? 'Todos' : category.charAt(0).toUpperCase() + category.slice(1)}
            </Badge>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="flex items-center gap-2"
          >
            <Grid className="h-4 w-4" />
            Grade
          </Button>
          <Button
            variant={viewMode === 'masonry' ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode('masonry')}
            className="flex items-center gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            Mosaico
          </Button>
        </div>
      </div>

      {/* Gallery Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6'
          }
        `}
      >
        <AnimatePresence mode="wait">
          {visibleImages.map((image, index) => (
            <motion.div
              key={`${image.id}-${filter}`}
              variants={itemVariants}
              className={`
                ${viewMode === 'masonry' ? 'break-inside-avoid mb-6' : ''}
                group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300
              `}
            >
              <div className={`
                relative aspect-square overflow-hidden
                ${viewMode === 'masonry' ? 'aspect-auto' : ''}
              `}>
                <GalleryImage 
                  src={image.src} 
                  alt={image.alt} 
                  delay={index * 0.05} 
                  onClick={() => onSelectImage(filteredImages.findIndex(img => img.id === image.id))}
                />
                
                {/* Overlay with enhanced effects */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-white font-bold text-lg mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      {image.alt}
                    </h3>
                    <div className="flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                      <Badge variant="secondary" className="bg-urbana-gold/20 text-white border-urbana-gold/30">
                        Ver Detalhes
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Zoom indicator */}
                <div className="absolute top-4 right-4 bg-black/50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-8">
          <Button 
            onClick={loadMore}
            size="lg"
            className="bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Ver Mais Trabalhos
            <span className="ml-2 text-sm opacity-75">
              ({filteredImages.length - itemsToShow} restantes)
            </span>
          </Button>
        </div>
      )}

      {/* Results Counter */}
      <div className="text-center text-sm text-urbana-gray">
        Mostrando {visibleImages.length} de {filteredImages.length} trabalhos
        {filter !== 'all' && (
          <span className="ml-2">
            • Filtro: <strong>{filter.charAt(0).toUpperCase() + filter.slice(1)}</strong>
          </span>
        )}
      </div>
    </div>
  );
};

export default ModernGalleryGrid;
