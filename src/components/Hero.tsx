
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BannerImage } from "@/types/settings";
import { useToast } from "@/hooks/use-toast";

const Hero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch banner images from Supabase
  useEffect(() => {
    const fetchBannerImages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('banner_images')
          .select('*')
          .order('display_order', { ascending: true })
          .eq('is_active', true);
        
        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          const formattedData: BannerImage[] = data.map(item => ({
            id: parseInt(item.id.toString().replace(/-/g, '').substring(0, 8), 16),
            imageUrl: item.image_url,
            title: item.title,
            subtitle: item.subtitle,
            description: item.description || ''
          }));
          setBannerImages(formattedData);
        } else {
          // Fallback to default banners if no data is available
          setBannerImages([
            {
              id: 1,
              imageUrl: '/hero-background.jpg',
              title: 'Experiência Premium',
              subtitle: 'em Barbearia',
              description: 'A arte da barbearia tradicional com sofisticação moderna'
            },
            {
              id: 2,
              imageUrl: '/banner-2.jpg',
              title: 'Estilo & Precisão',
              subtitle: 'para Cavalheiros',
              description: 'Cortes clássicos com um toque contemporâneo'
            },
            {
              id: 3,
              imageUrl: '/banner-3.jpg',
              title: 'Ambiente Exclusivo',
              subtitle: 'para Relaxar',
              description: 'Um espaço onde tradição e conforto se encontram'
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading banner images:', error);
        toast({
          title: "Erro ao carregar banners",
          description: "Não foi possível carregar os banners do banco de dados",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBannerImages();
  }, [toast]);

  useEffect(() => {
    if (bannerImages.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [bannerImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  if (loading || bannerImages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-urbana-black">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-t-4 border-urbana-gold border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Vintage Filter */}
      <AnimatePresence mode="wait">
        {bannerImages.map((slide, index) => (
          currentSlide === index && (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 z-0"
            >
              <div 
                className="absolute inset-0 bg-urbana-black"
                style={{
                  backgroundImage: `url('${slide.imageUrl}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundBlendMode: 'soft-light',
                  filter: 'sepia(15%)',
                  opacity: 0.9,
                }}
              />
            </motion.div>
          )
        ))}
      </AnimatePresence>
      
      {/* Vintage Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `url('/vintage-pattern.png')`,
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide} 
        className="absolute left-4 z-20 text-white opacity-60 hover:opacity-100 transition-opacity rounded-full p-2 bg-black/20 hover:bg-black/40"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button 
        onClick={nextSlide} 
        className="absolute right-4 z-20 text-white opacity-60 hover:opacity-100 transition-opacity rounded-full p-2 bg-black/20 hover:bg-black/40"
      >
        <ChevronRight size={24} />
      </button>
      
      {/* Content */}
      <div className="urbana-container z-10 text-center">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-white"
          >
            <h1 className="font-playfair text-5xl md:text-7xl font-bold mb-6">
              {bannerImages[currentSlide].title}<br />
              <span className="text-urbana-gold">{bannerImages[currentSlide].subtitle}</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-gray-200">
              {bannerImages[currentSlide].description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black px-8 py-6 text-lg relative overflow-hidden group"
                asChild
              >
                <a href="#appointment">
                  <span className="relative z-10">Agendar Horário</span>
                  <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                </a>
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg relative overflow-hidden group"
                asChild
              >
                <a href="#services">
                  <span className="relative z-10">Nossos Serviços</span>
                  <span className="absolute inset-0 bg-urbana-gold/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                </a>
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Slide Indicators */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 z-10">
          {bannerImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? "bg-urbana-gold w-8" : "bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-urbana-black to-transparent z-10" />
    </div>
  );
};

export default Hero;
