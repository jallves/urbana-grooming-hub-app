
import React from 'react';
import { Button } from "@/components/ui/button";

const Hero: React.FC = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-urbana-black"
        style={{
          backgroundImage: `url('/hero-background.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
          opacity: 0.8,
        }}
      />
      
      {/* Content */}
      <div className="urbana-container z-10 text-center">
        <div className="max-w-3xl mx-auto text-white animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Premium Grooming Experience
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">
            Experience the art of traditional barbering with modern sophistication
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-urbana-gold hover:bg-urbana-gold/90 text-white px-8 py-6 text-lg"
              asChild
            >
              <a href="#appointment">Book Appointment</a>
            </Button>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg"
              asChild
            >
              <a href="#services">Our Services</a>
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-urbana-black to-transparent z-10" />
    </div>
  );
};

export default Hero;
