import React from 'react';
import { Scissors, Clock, Star, Award, Coffee, Shield } from 'lucide-react';
import { Card } from "@/components/ui/card";
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
    <Card className="relative bg-white border border-yellow-500/50 rounded-xl shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:shadow-[0_0_25px_rgba(255,215,0,0.6)] transition-shadow duration-400 h-full flex flex-col p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
          <Scissors className="w-7 h-7 text-black" />
        </div>
        <span className="text-yellow-600 font-mono font-semibold text-lg">{price}</span>
      </div>

      <h3 className="text-2xl font-semibold text-black group-hover:text-yellow-600 transition-colors duration-300 mb-3 font-mono">
        {title}
      </h3>

      <p className="text-neutral-700 flex-grow font-sans">{description ?? "Serviço premium de barbearia com atenção aos detalhes."}</p>

      <div className="mt-6 h-1 w-16 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-full group-hover:scale-x-110 transition-transform duration-300" />
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
    { icon: <Award className="h-9 w-9 text-yellow-600" />, title: "Profissionais Certificados", description: "Equipe com certificações e anos de experiência em técnicas modernas e clássicas." },
    { icon: <Clock className="h-9 w-9 text-yellow-600" />, title: "Pontualidade Garantida", description: "Agendamentos precisos e serviços eficientes, respeitando seu tempo." },
    { icon: <Coffee className="h-9 w-9 text-yellow-600" />, title: "Experiência Completa", description: "Ambiente relaxante com bebidas cortesia e música ambiente selecionada." },
    { icon: <Shield className="h-9 w-9 text-yellow-600" />, title: "Higiene Premium", description: "Protocolos rigorosos de limpeza e esterilização para sua segurança." },
    { icon: <Star className="h-9 w-9 text-yellow-600" />, title: "Atendimento Personalizado", description: "Cada cliente é único. Serviços adaptados ao seu estilo pessoal." },
    { icon: <Scissors className="h-9 w-9 text-yellow-600" />, title: "Técnicas Modernas", description: "Combinamos tradição com as mais modernas técnicas e equipamentos." }
  ];

  const formatPrice = (price: number) => `R$ ${price.toFixed(2).replace('.', ',')}`;

  return (
    <section id="services" className="relative py-20 bg-white overflow-hidden text-black">
      {/* Highlights tecnológicos */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-24 left-12 w-72 h-72 bg-yellow-400 rounded-full blur-3xl mix-blend-multiply"></div>
        <div className="absolute bottom-24 right-12 w-96 h-96 bg-yellow-300 rounded-full blur-3xl mix-blend-multiply"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Cabeçalho */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-5xl font-playfair font-extrabold text-yellow-600 mb-4">
            Nossos <span className="text-black">Serviços</span>
          </h2>
          <p className="text-gray-600 font-mono text-lg">
            Descubra uma experiência onde <span className="text-yellow-600 font-semibold">tradição</span> e <span className="text-yellow-600 font-semibold">tecnologia</span> se unem para elevar o seu estilo.
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
              className="text-center p-6 rounded-xl bg-white border border-yellow-400 shadow-[0_0_10px_rgba(255,215,0,0.2)] hover:shadow-[0_0_20px_rgba(255,215,0,0.5)] transition-shadow duration-300"
            >
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-lg bg-yellow-100 text-yellow-600 mx-auto text-4xl">
                {icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 font-mono text-black">{title}</h3>
              <p className="text-gray-700 font-sans">{description}</p>
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
            <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-yellow-500 border-r-transparent mb-6"></div>
            <p className="text-yellow-600 text-lg font-medium font-mono">Carregando serviços premium...</p>
          </motion.div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 max-w-md mx-auto"
          >
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-500 text-4xl">⚠</span>
            </div>
            <p className="text-2xl font-mono font-semibold text-red-500 mb-3">Erro ao carregar serviços</p>
            <p className="text-gray-600 font-sans">Por favor, tente novamente mais tarde.</p>
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
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Scissors className="h-10 w-10 text-yellow-600" />
            </div>
            <p className="text-2xl font-mono mb-3 text-black">Em breve, novos serviços</p>
            <p className="text-gray-600 font-sans">Estamos preparando experiências incríveis para você!</p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Services;
