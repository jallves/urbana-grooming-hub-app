
import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Team from '../components/Team';
import Appointment from '../components/Appointment';
import Footer from '../components/Footer';
import Gallery from '../components/Gallery';
import WhatsAppButton from '../components/WhatsAppButton';

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-16"> {/* Added padding-top to account for the fixed navbar */}
        <Hero />
        <div className="relative">
          <div className="absolute inset-0 bg-secondary/50 skew-y-3 -z-10 -mt-16 h-[120vh]"></div>
          <Services />
        </div>
        <Gallery />
        <Team />
        <Appointment />
        <Footer />
      </div>
      <WhatsAppButton />
    </div>
  );
};

export default Index;
