import React from 'react';
import { Scissors, Clock, Star, Award, Coffee, Shield } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ServiceProps {
  title: string;
  price: string;
  description: string | null;
  index: number;
}

const ServiceCard: React.FC<ServiceProps> = ({ title, price, description, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    viewport={{ once: true }}
    className="group"
  >
    <Card className="relative bg-[#121620] border border-cyan-600 rounded-xl shadow-[0_0_15px_rgb(6,182,212,0.5)] hover:shadow-[0_0_25px_rgb(6,182,212,0.9)] transition-shadow duration-400 h-full flex flex-col p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
          <Scissors className="w-7 h-7 text-white" />
        </div>
        <span className="text-cyan-400 font-mono font-semibold text-lg">{price}</span>
      </div>

      <h3 className="text-2xl font-semibold text-white group-hover:text-cyan-400 transition-colors duration-300 mb-3 font-mono">
        {title}
      </h3>

      <p className="text-gray-300 flex-grow font-sans">{description ?? "Serviço premium de barbearia com atenção aos detalhes."}</p>

      {/* Accent underline */}
      <div className="mt-6 h-1 w-16 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 rounded-full group-hover:scale-x-110 transition-transform duration-300" />
    </Card>
  </motion.div>
);

const Services: React.FC = () => {
  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const features = [
    {
      icon: <Award className="h-9 w-9 text-cyan-400" />,
      title: "Profissionais Certificados",
      description: "Equipe com certificações e anos de experiência em técnicas modernas e clássicas."
    },
    {
      icon: <Clock className="h-9 w-9 text-cyan-400" />,
      title: "Pontualidade Garantida",
      description: "Agendamentos precisos e serviços eficientes, respeitando seu tempo."
    },
    {
      icon: <Coffee className="h-9 w-9 text-cyan-400" />,
      title: "Experiência Completa",
      description: "Ambiente relaxante com bebidas cortesia e música ambiente selecionada."
    },
    {
      icon: <Shield className="h-9 w-9 text-cyan-400" />,
      title: "Higiene Premium",
      description: "Protocolos rigorosos de limpeza e esterilização para sua segurança."
    },
    {
      icon: <Star className="h-9 w-9 text-cyan-400" />,
      title: "Atendimento Personalizado",
      description: "Cada cliente é único. Serviços adaptados ao seu estilo pessoal."
    },
    {
      icon: <Scissors className="h-9 w-9 text-cyan-400" />,
      title: "Técnicas Modernas",
      description: "Combinamos tradição com as mais modernas técnicas e equipamentos."
    }
  ];

  const formatPrice = (price: number) => `R$ ${price.toFixed(2).replace('.', ',')}`;

  return (
    <section id="services" className="relative py-20 bg-gradient-to-b from-[#0a0f19] via-[#121620] to-[#0a0f19] overflow-hidden text-white">
      {/* Background highlights */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-24 left-12 w-72 h-72 bg-cyan-600 rounded-full blur-3xl mix-blend-screen"></div>
        <div className="absolute bottom-24 right-12 w-96 h-96 bg-blue-700 rounded-full blur-3xl mix-blend-screen"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-5xl font-playfair font-extrabold text-cyan-400 mb-4">
            Nossos <span className="text-white">Serviços</span>
          </h2>
          <p className="text-lg text-gray-300 font-mono">
            Descubra uma experiência única onde tradição e modernidade se encontram. Cada serviço é uma obra de arte dedicada ao seu estilo pessoal.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 mb-20">
          {features.map(({ icon, title, description }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-xl bg-[#18212f] border border-cyan-600 shadow-[0_0_10px_rgb(6,182,212,0.3)] hover:shadow-[0_0_18px_rgb(6,182,212,0.7)] transition-shadow duration-300"
            >
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-lg bg-cyan-900 text-cyan-400 mx-auto text-4xl">
                {icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white font-mono">{title}</h3>
              <p className="text-gray-300 font-sans">{description}</p>
            </motion.div>
          ))}
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-cyan-500 border-r-transparent mb-6"></div>
            <p className="text-gray-400 text-lg font-medium font-mono">Carregando serviços premium...</p>
          </motion.div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 max-w-md mx-auto"
          >
            <div className="w-20 h-20 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-500 text-4xl">⚠</span>
            </div>
            <p className="text-2xl font-mono font-semibold text-red-500 mb-3">Erro ao carregar serviços</p>
            <p className="text-gray-400 font-sans">Por favor, tente novamente mais tarde.</p>
          </motion.div>
        ) : services && services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <ServiceCard
                key={service.id}
                title={service.name}
                price={formatPrice(service.price)}
                description={service.description}
                index={i}
              />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 max-w-md mx-auto"
          >
            <div className="w-20 h-20 bg-cyan-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Scissors className="h-10 w-10 text-cyan-400" />
            </div>
            <p className="text-2xl font-mono text-white mb-3">Em breve, novos serviços</p>
            <p className="text-gray-400 font-sans">Estamos preparando experiências incríveis para você!</p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Services;
