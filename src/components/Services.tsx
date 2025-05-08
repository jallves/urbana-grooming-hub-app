
import React from 'react';
import { Scissors, Clock, Star } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ServiceProps {
  title: string;
  price: string;
  description: string;
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
        <p className="text-urbana-gray mt-2">{description}</p>
      </CardContent>
    </Card>
  );
};

const Services: React.FC = () => {
  const services = [
    {
      title: "Corte Clássico",
      price: "R$ 50",
      description: "Corte de precisão adaptado ao seu estilo, inclui toalha quente e finalização."
    },
    {
      title: "Barba",
      price: "R$ 35",
      description: "Modelagem e definição da sua barba com ferramentas de precisão e tratamento com toalha quente."
    },
    {
      title: "Barboterapia",
      price: "R$ 45",
      description: "Barbear tradicional com navalha e tratamentos pré e pós-barba."
    },
    {
      title: "Combo Cabelo & Barba",
      price: "R$ 75",
      description: "Pacote completo com corte de cabelo, barba e finalização."
    },
    {
      title: "Coloração",
      price: "R$ 60+",
      description: "Aplicação profissional de cor para cobrir grisalhos ou mudar seu visual."
    },
    {
      title: "Corte Infantil",
      price: "R$ 35",
      description: "Serviço de corte suave para crianças menores de 12 anos."
    }
  ];

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              title={service.title}
              price={service.price}
              description={service.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
