
import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Team from '../components/Team';
import Footer from '../components/Footer';
import Gallery from '../components/Gallery';
import WhatsAppButton from '../components/WhatsAppButton';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create query client outside component to avoid recreation on render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const Index = () => {
  console.log('Rendering Index page');

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
};

export default Index;
