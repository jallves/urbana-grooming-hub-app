import { User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Gallery from '@/components/Gallery';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { ScrollProgress } from '@/components/ui/scroll-progress';

const Index = () => {
  return (
    <div className="w-full min-h-screen bg-urbana-black scroll-smooth">
      {/* Scroll Progress Indicator */}
      <ScrollProgress />
      
      {/* Navbar */}
      <Navbar />
      
      {/* Hero Section - Tela inteira */}
      <section className="w-full">
        <Hero />
      </section>
      
      {/* Services - Sem padding lateral */}
      <section className="w-full py-12 transition-all duration-700">
        <Services />
      </section>
      
      {/* Gallery - Sem padding lateral */}
      <section className="w-full py-12 transition-all duration-700">
        <Gallery />
      </section>
      
      {/* Footer - Tela inteira */}
      <footer className="w-full transition-all duration-700">
        <Footer />
      </footer>
      
      {/* WhatsApp Button */}
      <WhatsAppButton />
    </div>
  );
};

export default Index;

