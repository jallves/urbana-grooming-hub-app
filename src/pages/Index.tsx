import { User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Gallery from '@/components/Gallery';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';

const Index = () => {
  return (
    <div className="w-full min-h-screen bg-urbana-black overflow-x-hidden">
      {/* Navbar - Já deve ser responsivo por padrão */}
      <Navbar />
      
      {/* Hero Section - Deve se ajustar ao tamanho da tela */}
      <section className="w-full">
        <Hero />
      </section>
      
      {/* Services - Deve reorganizar em coluna em mobile */}
      <section className="w-full px-4 md:px-8 lg:px-16 py-12">
        <Services />
      </section>
      
      {/* Gallery - Deve mostrar menos itens e ser scrollável em mobile */}
      <section className="w-full px-4 md:px-8 lg:px-16 py-12">
        <Gallery />
      </section>
      
      {/* Footer - Deve empilhar os elementos em mobile */}
      <footer className="w-full">
        <Footer />
      </footer>
      
      {/* WhatsAppButton - Deve ser posicionado corretamente em mobile */}
      <WhatsAppButton />
    </div>
  );
};

export default Index;

