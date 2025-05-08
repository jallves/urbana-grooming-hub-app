
import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Team from '../components/Team';
import Appointment from '../components/Appointment';
import Footer from '../components/Footer';
import Gallery from '../components/Gallery';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <div className="relative">
        <div className="absolute inset-0 bg-urbana-light skew-y-3 -z-10 -mt-16 h-[120vh]"></div>
        <Services />
      </div>
      <Gallery />
      <Team />
      <Appointment />
      <Footer />
    </div>
  );
};

export default Index;
