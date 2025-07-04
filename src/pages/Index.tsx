import { User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Team from '@/components/Team';
import Services from '@/components/Services';
import Gallery from '@/components/Gallery';
import Appointment from '@/components/Appointment';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <Hero />
      <Services />
      <Team />
      <Gallery />
      <Appointment />
      <Footer />
      <WhatsAppButton />
      
      {/* Link para o Painel do Cliente */}
      <div className="fixed bottom-4 left-4 z-50">
        <a 
          href="/painel-cliente/login"
          className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition-all"
        >
          <User className="h-4 w-4" />
          Painel Cliente
        </a>
      </div>
    </div>
  );
};

export default Index;
