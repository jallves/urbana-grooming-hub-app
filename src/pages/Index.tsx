// pages/index.js (atualizado)
import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Team from '../components/Team';
import Footer from '../components/Footer';
import Gallery from '../components/Gallery';
import WhatsAppButton from '../components/WhatsAppButton';
import ContactForm from '../components/ContactForm'; // Novo componente

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <div>
        <Hero />
        <div className="relative">
          <div className="absolute inset-0 bg-urbana-gray/10 skew-y-3 -z-10 -mt-16 h-[120vh]"></div>
          <Services />
        </div>
        <Gallery />
        <Team />
        
        {/* Nova seção de contato */}
        <section className="py-20 bg-gradient-to-br from-background to-urbana-gray/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl font-bold text-urbana-primary mb-4">
                Fale Conosco
              </h2>
              <p className="text-lg text-urbana-gray max-w-2xl mx-auto">
                Tire suas dúvidas ou solicite um orçamento através do nosso formulário
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
        
        <Footer />
      </div>
      <WhatsAppButton />
    </div>
  );
};

export default Index;
