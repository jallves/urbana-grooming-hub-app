
import React, { Suspense } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Team from '../components/Team';
import Appointment from '../components/Appointment';
import Footer from '../components/Footer';
import Gallery from '../components/Gallery';
import WhatsAppButton from '../components/WhatsAppButton';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// Create query client outside component to avoid recreation on render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const Index = () => {
  // We don't need to do anything special here, as AuthContext is already 
  // wrapping the entire application and will maintain the user's session

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <Navbar />
        <div className="pt-16"> {/* Added padding-top to account for the fixed navbar */}
          <Hero />
          <div className="relative">
            <div className="absolute inset-0 bg-urbana-gray/10 skew-y-3 -z-10 -mt-16 h-[120vh]"></div>
            <Services />
          </div>
          <Gallery />
          <Team />
          <Appointment />
          <Footer />
        </div>
        <WhatsAppButton />
      </div>
    </QueryClientProvider>
  );
};

export default Index;
