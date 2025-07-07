
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

const ServiceCard: React.FC<ServiceProps> = ({ title, price, description, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Card className="group relative overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 border-0 shadow-lg hover:-translate-y-2 h-full">
        <CardContent className="p-8 h-full flex flex-col">
          {/* Modern service icon */}
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Scissors className="w-8 h-8 text-urbana-gold" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-urbana-gold/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-playfair text-2xl font-bold text-urbana-black leading-tight group-hover:text-urbana-gold transition-colors duration-300">
                {title}
              </h3>
              <div className="text-right ml-4">
                <div className="relative">
                  <span className="text-3xl font-playfair font-bold text-urbana-gold group-hover:scale-110 inline-block transition-transform duration-300">
                    {price}
                  </span>
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-urbana-gold/0 via-urbana-gold/50 to-urbana-gold/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
              </div>
            </div>
            
            <div className="relative mb-6">
              <div className="h-px bg-gradient-to-r from-urbana-gold/0 via-urbana-gold/30 to-urbana-gold/0 group-hover:via-urbana-gold/60 transition-all duration-500"></div>
              <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-urbana-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            
            <p className="text-urbana-gray text-base leading-relaxed group-hover:text-urbana-black/80 transition-colors duration-300">
              {description || "Serviço premium de barbearia com atenção aos detalhes"}
            </p>
          </div>
          
          {/* Modern decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-urbana-gold/5 to-transparent rounded-bl-full group-hover:scale-125 transition-transform duration-500"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-urbana-gold/5 to-transparent rounded-tr-full group-hover:scale-125 transition-transform duration-500"></div>
        </CardContent>
      </Card>
    </motion.div>
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
      icon: <Award className="h-8 w-8 text-urbana-gold" />,
      title: "Profissionais Certificados",
      description: "Nossa equipe possui certificações e anos de experiência em técnicas modernas e clássicas."
    },
    {
      icon: <Clock className="h-8 w-8 text-urbana-gold" />,
      title: "Pontualidade Garantida",
      description: "Respeitamos seu tempo com agendamentos precisos e serviços eficientes."
    },
    {
      icon: <Coffee className="h-8 w-8 text-urbana-gold" />,
      title: "Experiência Completa",
      description: "Ambiente relaxante com bebidas cortesia e música ambiente cuidadosamente selecionada."
    },
    {
      icon: <Shield className="h-8 w-8 text-urbana-gold" />,
      title: "Higiene Premium",
      description: "Protocolos rigorosos de limpeza e esterilização para sua segurança."
    },
    {
      icon: <Star className="h-8 w-8 text-urbana-gold" />,
      title: "Atendimento Personalizado",
      description: "Cada cliente é único. Adaptamos nossos serviços ao seu estilo pessoal."
    },
    {
      icon: <Scissors className="h-8 w-8 text-urbana-gold" />,
      title: "Técnicas Modernas",
      description: "Combinamos tradição com as mais modernas técnicas e equipamentos."
    }
  ];

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  return (
    <section id="services" className="relative py-24 bg-gradient-to-b from-white via-gray-50/50 to-white overflow-hidden">
      {/* Modern background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-urbana-gold rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-urbana-gold rounded-full blur-3xl"></div>
      </div>

      <div className="urbana-container relative z-10">
        {/* Modern header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="relative inline-block">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="absolute -top-4 -left-4 w-8 h-8 border-2 border-urbana-gold rounded-full opacity-30"
            ></motion.div>
            
            <h2 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold text-urbana-black mb-6 relative">
              Nossos <span className="text-urbana-gold">Serviços</span>
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 1, delay: 0.5 }}
                viewport={{ once: true }}
                className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-urbana-gold/0 via-urbana-gold to-urbana-gold/0 rounded-full"
              ></motion.div>
            </h2>
            
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="absolute -bottom-4 -right-4 w-6 h-6 bg-urbana-gold rounded-full opacity-40"
            ></motion.div>
          </div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-xl md:text-2xl text-urbana-gray max-w-4xl mx-auto leading-relaxed mt-8"
          >
            Descubra uma experiência única onde tradição e modernidade se encontram. 
            Cada serviço é uma obra de arte dedicada ao seu estilo pessoal.
          </motion.p>
        </motion.div>

        {/* Modern features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group text-center"
            >
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-urbana-gold/10 to-urbana-gold/5 rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                {feature.icon}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-urbana-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-xl font-playfair font-bold mb-4 text-urbana-black group-hover:text-urbana-gold transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-urbana-gray leading-relaxed max-w-sm mx-auto group-hover:text-urbana-black/80 transition-colors duration-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Services grid */}
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-urbana-gold border-r-transparent mb-6"></div>
            <p className="text-urbana-gray text-xl font-playfair">Carregando serviços premium...</p>
          </motion.div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-red-600 text-3xl">⚠</span>
              </div>
              <p className="text-2xl font-playfair font-semibold text-red-600 mb-3">Erro ao carregar serviços</p>
              <p className="text-urbana-gray">Por favor, tente novamente mais tarde.</p>
            </div>
          </motion.div>
        ) : services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <ServiceCard
                key={service.id}
                title={service.name}
                price={formatPrice(service.price)}
                description={service.description}
                index={index}
              />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-urbana-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Scissors className="h-10 w-10 text-urbana-gold" />
              </div>
              <p className="text-2xl font-playfair text-urbana-black mb-3">Em breve, novos serviços</p>
              <p className="text-urbana-gray">Estamos preparando experiências incríveis para você!</p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Services;
