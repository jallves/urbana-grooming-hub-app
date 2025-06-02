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
    <div className="min-h-screen bg-amber-50 text-amber-900 overflow-x-hidden">
      <Navbar />
      
      <main>
        <Hero />
        
        {/* Seção de Serviços com fundo amarelo suave */}
        <section className="relative py-16">
          <div 
            className="absolute inset-0 bg-amber-100 transform -skew-y-3 origin-top-left"
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

// Exportação única (removida a duplicata)
export default Index;
