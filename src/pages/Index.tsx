import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Team from '../components/Team';
import Footer from '../components/Footer';
import Gallery from '../components/Gallery';
import WhatsAppButton from '../components/WhatsAppButton';

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      
      <main>
        <Hero />
        
        {/* Seção de Serviços com background - CORRIGIDO */}
        <section className="relative py-16">
          <div 
            className="absolute inset-0 bg-gray-100 transform -skew-y-3 origin-top-left"
            style={{ 
              height: '140%',
              top: '-20%',
              zIndex: 0
            }}
          />
          <div className="container relative z-10 mx-auto px-4">
            <Services />
          </div>
        </section>
        
        <Gallery />
        <Team />
      </main>
      
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
