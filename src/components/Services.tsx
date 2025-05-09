
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
    <Card className="urbana-card">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl text-urbana-black">{title}</h3>
          <span className="font-playfair text-lg font-bold text-urbana-gold">{price}</span>
        </div>
        <Separator className="my-3 bg-urbana-gold/20" />
        <p className="text-urbana-gray mt-2">{description || "Serviço premium de barbearia"}</p>
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
    <section id="services" className="urbana-section bg-urbana-light">
      <div className="urbana-container">
        <div className="text-center mb-16">
          <h2 className="urbana-heading">Nossos Serviços</h2>
          <p className="urbana-subheading">Experimente um cuidado premium com nossa gama de serviços profissionais</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="mx-auto mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-urbana-black">{feature.title}</h3>
              <p className="text-urbana-gray">{feature.description}</p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-urbana-gold border-r-transparent"></div>
            <p className="mt-4 text-urbana-gray">Carregando serviços...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">
            <p className="text-lg font-semibold">Erro ao carregar serviços</p>
            <p className="text-sm mt-2">Por favor, tente novamente mais tarde.</p>
          </div>
        ) : services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="text-center py-12">
            <p className="text-lg text-urbana-gray">Nenhum serviço disponível no momento.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;
