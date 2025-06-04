
import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Team from '../components/Team';
import Footer from '../components/Footer';
import Gallery from '../components/Gallery';
import WhatsAppButton from '../components/WhatsAppButton';
import { useEffect, useState } from 'react';
import BarberSelectionField from '../components/BarberSelectionField';
import { fetchBarbers, checkAvailability } from '../services/appointmentService';

const Index = () => {
  console.log('Rendering Index page');
  const HomePage = () => {
  const [barbers, setBarbers] = useState<StaffMember[]>([]);
  const [availability, setAvailability] = useState<BarberAvailabilityInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        <Footer />
      </div>
      <WhatsAppButton />
    </div>
  );
};

export default Index;
