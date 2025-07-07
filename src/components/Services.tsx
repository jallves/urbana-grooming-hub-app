import React, { useRef } from "react";
import { Award, Clock, Star, Shield, Coffee, Scissors } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ServiceProps {
  title: string;
  price: string;
  description: string | null;
  index: number;
}

const ServiceCard: React.FC<ServiceProps> = ({ title, price, description, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
      className="group"
    >
      <Card className="relative bg-urbana-black/90 backdrop-blur-lg border border-urbana-gold/30 rounded-xl shadow-xl hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-all duration-500 h-full flex flex-col p-8 hover:scale-105 hover:border-urbana-gold/60">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-urbana-gold to-yellow-400 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Scissors size={32} className="text-urbana-black" />
          </div>
          <span className="text-urbana-gold font-playfair font-bold text-2xl">{price}</span>
        </div>

        <h3 className="text-3xl font-bold text-urbana-light group-hover:text-urbana-gold transition-colors duration-300 mb-4 font-playfair">
          {title}
        </h3>

        <p className="text-urbana-light/80 flex-grow font-raleway text-lg leading-relaxed">
          {description ?? "Serviço premium de barbearia com atenção aos detalhes e técnicas modernas."}
        </p>

        <div className="mt-8 h-1 w-20 bg-gradient-to-r from-urbana-gold via-yellow-400 to-urbana-gold rounded-full group-hover:scale-x-125 transition-transform duration-500" />
      </Card>
    </motion.div>
  );
};

const Services: React.FC = () => {
  const { data: services, isLoading, error } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  const features = [
    {
      icon: <Award size={40} className="text-urbana-gold" />,
      title: "Profissionais Certificados",
      description: "Equipe com certificações e anos de experiência em técnicas modernas e clássicas.",
    },
    {
      icon: <Clock size={40} className="text-urbana-gold" />,
      title: "Pontualidade Garantida",
      description: "Agendamentos precisos e serviços eficientes, respeitando seu tempo.",
    },
    {
      icon: <Coffee size={40} className="text-urbana-gold" />,
      title: "Experiência Completa",
      description: "Ambiente relaxante com bebidas cortesia e música ambiente selecionada.",
    },
    {
      icon: <Shield size={40} className="text-urbana-gold" />,
      title: "Higiene Premium",
      description: "Protocolos rigorosos de limpeza e esterilização para sua segurança.",
    },
    {
      icon: <Star size={40} className="text-urbana-gold" />,
      title: "Atendimento Personalizado",
      description: "Cada cliente é único. Serviços adaptados ao seu estilo pessoal.",
    },
    {
      icon: <Scissors size={40} className="text-urbana-gold" />,
      title: "Técnicas Modernas",
      description: "Combinamos tradição com as mais modernas técnicas e equipamentos.",
    },
  ];

  const formatPrice = (price: number) =>
    `R$ ${price.toFixed(2).replace(".", ",")}`;

  return (
    <section
      id="services"
      className="relative py-20 bg-gradient-to-b from-urbana-black via-urbana-brown to-urbana-black text-urbana-light overflow-hidden"
    >
      {/* Modern background elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-32 left-20 w-96 h-96 bg-urbana-gold rounded-full blur-3xl mix-blend-screen animate-pulse" />
        <div
          className="absolute bottom-32 right-20 w-80 h-80 bg-yellow-400 rounded-full blur-3xl mix-blend-screen animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="urbana-container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <h2 className="text-6xl md:text-7xl font-playfair font-bold text-urbana-gold mb-8">
            Nossos{" "}
            <span className="text-urbana-light drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]">
              Serviços
            </span>
          </h2>
          <p className="text-urbana-light/90 font-raleway text-xl md:text-2xl leading-relaxed">
            Descubra uma experiência única onde tradição e modernidade se
            encontram. Cada serviço é uma obra de arte dedicada ao seu estilo
            pessoal.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-20">
          {features.map(({ icon, title, description }, i) => {
            const ref = React.createRef<HTMLDivElement>();
            const isInView = useInView(ref, { once: true, margin: "-50px" });
            return (
              <motion.div
                ref={ref}
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.15, ease: "easeOut" }}
                className="group text-center p-8 rounded-xl bg-urbana-black/50 backdrop-blur-lg border border-urbana-gold/20 shadow-lg hover:shadow-[0_0_25px_rgba(255,215,0,0.2)] hover:border-urbana-gold/40 transition-all duration-500 hover:scale-105"
              >
                <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-xl bg-gradient-to-br from-urbana-gold/20 to-yellow-400/20 text-urbana-gold mx-auto group-hover:scale-110 transition-transform duration-300">
                  {icon}
                </div>
                <h3 className="text-2xl font-bold mb-6 font-playfair text-urbana-light group-hover:text-urbana-gold transition-colors duration-300">
                  {title}
                </h3>
                <p className="text-urbana-light/70 font-raleway text-lg leading-relaxed">
                  {description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <div className="inline-block h-20 w-20 animate-spin rounded-full border-4 border-urbana-gold border-r-transparent mb-8"></div>
            <p className="text-urbana-gold text-2xl font-bold font-playfair">
              Carregando serviços premium...
            </p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32 max-w-md mx-auto"
          >
            <div className="w-24 h-24 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-red-400 text-5xl">⚠</span>
            </div>
            <p className="text-3xl font-playfair font-bold text-red-400 mb-4">
              Erro ao carregar serviços
            </p>
            <p className="text-urbana-light/70 font-raleway text-xl">
              Por favor, tente novamente mais tarde.
            </p>
          </motion.div>
        ) : services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
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
            className="text-center py-32 max-w-md mx-auto"
          >
            <div className="w-24 h-24 bg-urbana-gold/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-urbana-gold text-5xl">📋</span>
            </div>
            <p className="text-3xl font-playfair font-bold text-urbana-gold mb-4">
              Nenhum serviço disponível
            </p>
            <p className="text-urbana-light/70 font-raleway text-xl">
              Em breve teremos novos serviços disponíveis.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Services;
