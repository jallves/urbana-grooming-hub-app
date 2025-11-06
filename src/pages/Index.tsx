import { User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Statistics from '@/components/Statistics';
import Gallery from '@/components/Gallery';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { ScrollProgress } from '@/components/ui/scroll-progress';
import { GoldenDivider } from '@/components/decorative/GoldenDivider';

const Index = () => {
  return (
    <div className="w-full min-h-screen bg-urbana-black scroll-smooth relative">
      {/* Noise texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-[100] opacity-[0.015]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Scroll Progress Indicator */}
      <ScrollProgress />
      
      {/* Navbar */}
      <Navbar />
      
      {/* Hero Section - Tela inteira */}
      <section className="w-full">
        <Hero />
      </section>
      
      {/* Decorative divider */}
      <div className="w-full bg-gradient-to-b from-urbana-black to-urbana-brown py-8">
        <GoldenDivider variant="geometric" />
      </div>
      
      {/* Services - Sem padding lateral */}
      <section className="w-full py-12 transition-all duration-700">
        <Services />
      </section>
      
      {/* Decorative divider */}
      <div className="w-full bg-gradient-to-b from-urbana-brown to-urbana-black py-8">
        <GoldenDivider variant="ornate" />
      </div>
      
      {/* Statistics Section */}
      <section className="w-full transition-all duration-700">
        <Statistics />
      </section>
      
      {/* Decorative divider */}
      <div className="w-full bg-gradient-to-b from-urbana-brown to-urbana-black py-8">
        <GoldenDivider variant="geometric" />
      </div>
      
      {/* Gallery - Sem padding lateral */}
      <section className="w-full py-12 transition-all duration-700">
        <Gallery />
      </section>
      
      {/* Decorative divider */}
      <div className="w-full bg-gradient-to-b from-urbana-black to-urbana-brown py-8">
        <GoldenDivider variant="geometric" />
      </div>
      
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

