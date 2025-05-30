
import React from 'react';
import { Scissors, Clock, Star } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ServiceProps {
  title: string;
  price: string;
  description: string | null;
}

const ServiceCard: React.FC<ServiceProps> = ({ title, price, description }) => {
  return (
    <Card className="group relative overflow-hidden bg-white hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
      <CardContent className="p-8">
        <div className="flex justify-between items-start mb-6">
          <h3 className="font-playfair text-2xl font-bold text-urbana-black leading-tight max-w-[70%]">
            {title}
          </h3>
          <div className="text-right">
            <span className="text-3xl font-playfair font-bold text-urbana-gold">
              {price}
            </span>
          </div>
        </div>
        
        <div className="h-px bg-gradient-to-r from-urbana-gold/30 to-transparent mb-6"></div>
        
        <p className="text-urbana-gray text-base leading-relaxed">
          {description || "Serviço premium de barbearia"}
        </p>
        
        <div className="absolute top-0 right-0 w-20 h-20 bg-urbana-gold/5 rounded-bl-full group-hover:scale-110 transition-transform duration-300"></div>
      </CardContent>
    </Card>
  );
};

const Services: React.FC = () => {
  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        throw error;
      }
      
      return data || [];
    }
  });

  const features = [
    {
      icon: <Scissors className="h-8 w-8 text-urbana-gold" />,
      title: "Profissionais Experientes",
      description: "Nossa equipe de profissionais qualificados oferece serviços de qualidade premium."
    },
    {
      icon: <Clock className="h-8 w-8 text-urbana-gold" />,
      title: "Serviço Eficiente",
      description: "Respeitamos seu tempo e garantimos um serviço rápido e de qualidade."
    },
    {
      icon: <Star className="h-8 w-8 text-urbana-gold" />,
      title: "Experiência Premium",
      description: "Desfrute de bebidas gratuitas e um ambiente relaxante."
    }
  ];

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  return (
    <section id="services" className="py-20 bg-gradient-to-b from-urbana-light to-gray-50">
      <div className="urbana-container">
        {/* Header modernizado */}
        <div className="text-center mb-20">
          <div className="inline-block">
            <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold text-urbana-black mb-6 relative">
              Nossos Serviços
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-urbana-gold rounded-full"></div>
            </h2>
          </div>
          <p className="text-xl md:text-2xl text-urbana-gray max-w-3xl mx-auto leading-relaxed mt-8">
            Experimente um cuidado premium com nossa gama de serviços profissionais
          </p>
        </div>

        {/* Features section modernizada */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-urbana-gold/10 rounded-full mb-6 group-hover:bg-urbana-gold/20 transition-all duration-300 group-hover:scale-110">
                {feature.icon}
              </div>
              <h3 className="text-xl font-playfair font-bold mb-4 text-urbana-black">
                {feature.title}
              </h3>
              <p className="text-urbana-gray leading-relaxed max-w-sm mx-auto">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Services grid */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-urbana-gold border-r-transparent mb-4"></div>
            <p className="text-urbana-gray text-lg">Carregando serviços...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 text-2xl">⚠</span>
              </div>
              <p className="text-xl font-semibold text-red-600 mb-2">Erro ao carregar serviços</p>
              <p className="text-urbana-gray">Por favor, tente novamente mais tarde.</p>
            </div>
          </div>
        ) : services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                title={service.name}
                price={formatPrice(service.price)}
                description={service.description}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-urbana-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scissors className="h-8 w-8 text-urbana-gold" />
              </div>
              <p className="text-xl text-urbana-gray">Nenhum serviço disponível no momento.</p>
              <p className="text-urbana-gray/70 mt-2">Em breve teremos novidades!</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;
