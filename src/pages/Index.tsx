import { User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Statistics from '@/components/Statistics';
import Gallery from '@/components/Gallery';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { ScrollProgress } from '@/components/ui/scroll-progress';
import { GoldenDivider } from '@/components/decorative/GoldenDivider';
import { ClientReviews } from '@/components/ClientReviews';

const Index = () => {
  return (
    <div className="w-screen min-h-screen bg-urbana-black scroll-smooth relative overflow-x-hidden">
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
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
      
      {/* Modern Section with Totem Background */}
      <div className="w-full relative">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: 'url(/totem-background.jpg)',
            backgroundAttachment: 'fixed',
          }}
        />
        
        {/* Subtle Gradient Overlay for better readability while keeping background visible */}
        <div className="absolute inset-0 bg-gradient-to-b from-urbana-brown/70 via-urbana-brown/60 to-urbana-brown/70" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Decorative divider */}
          <div className="w-full py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <GoldenDivider variant="geometric" />
            </div>
          </div>
          
          {/* Services */}
          <section className="w-full py-12 transition-all duration-700">
            <Services />
          </section>
          
          {/* Decorative divider */}
          <div className="w-full py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <GoldenDivider variant="ornate" />
            </div>
          </div>
          
          {/* Statistics Section */}
          <section className="w-full transition-all duration-700">
            <Statistics />
          </section>
          
          {/* Decorative divider */}
          <div className="w-full py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <GoldenDivider variant="geometric" />
            </div>
          </div>
          
          {/* Gallery */}
          <section className="w-full py-12 transition-all duration-700">
            <Gallery />
          </section>
          
          {/* Decorative divider */}
          <div className="w-full py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <GoldenDivider variant="geometric" />
            </div>
          </div>
          
          {/* Client Reviews */}
          <section className="w-full py-12 transition-all duration-700">
            <ClientReviews />
          </section>
          
          {/* Decorative divider */}
          <div className="w-full py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <GoldenDivider variant="ornate" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="w-full transition-all duration-700">
        <Footer />
      </footer>
      
      {/* WhatsApp Button */}
      <WhatsAppButton />
    </div>
  );
};

export default Index;

