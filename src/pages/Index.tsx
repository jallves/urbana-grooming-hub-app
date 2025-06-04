import React from 'react';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Footer from '../components/Footer';
import Gallery from '../components/Gallery';
import WhatsAppButton from '../components/WhatsAppButton';

// Carregamento dinâmico para melhor performance
const Team = dynamic(() => import('../components/Team'), {
  ssr: false,
  loading: () => (
    <section id="team" className="urbana-section bg-black">
      <div className="urbana-container">
        <div className="text-center mb-16">
          <h2 className="urbana-heading text-white">Nossa Equipe</h2>
          <p className="urbana-subheading text-gray-300">Carregando nossa equipe...</p>
        </div>
      </div>
    </section>
  )
});

const Index = () => {
  return (
    <div className="min-h-screen bg-amber-50 text-gray-900 overflow-x-hidden font-sans">
      <Navbar />
      <main>
        <Hero />
        <div className="relative">
          <div className="absolute inset-0 bg-amber-100/30 skew-y-3 -z-10 -mt-16 h-[120vh]"></div>
          <Services />
        </div>
        <Gallery />
        <Team />
        <Footer />
      </main>
      <WhatsAppButton />
    </div>
  );
};

export default Index;