import { User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Gallery from '@/components/Gallery';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';

const Index = () => {
  return (
    <div className="w-full min-h-screen bg-urbana-black">
      {/* Navbar */}
      <Navbar />
      
      {/* Hero Section - Tela inteira */}
      <section className="w-full">
        <Hero />
      </section>
      
      {/* Services - Sem padding lateral */}
      <section className="w-full py-12">
        <Services />
      </section>
      
      {/* Gallery - Sem padding lateral */}
      <section className="w-full py-12">
        <Gallery />
      </section>
      
      {/* Footer - Tela inteira */}
      <footer className="w-full">
        <Footer />
      </footer>
      
      {/* WhatsApp Button */}
      <WhatsAppButton />
    </div>
  );
};

export default Index;

