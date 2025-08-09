
import React, { useRef } from "react";
import { Scissors } from "lucide-react";
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
      <Card className="relative bg-urbana-black/90 backdrop-blur-lg border border-urbana-gold/30 rounded-xl shadow-xl hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-all duration-500 h-full flex flex-col p-6 hover:scale-105 hover:border-urbana-gold/60">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-urbana-gold to-yellow-400 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Scissors size={28} className="text-urbana-black" />
          </div>
          <span className="text-urbana-gold font-playfair font-bold text-xl">{price}</span>
        </div>

        <h3 className="text-2xl font-bold text-urbana-light group-hover:text-urbana-gold transition-colors duration-300 mb-3 font-playfair">
          {title}
        </h3>

        <p className="text-urbana-light/80 flex-grow font-raleway text-base leading-relaxed">
          {description ?? "Serviço premium de barbearia com atenção aos detalhes e técnicas modernas."}
        </p>

        <div className="mt-6 h-1 w-16 bg-gradient-to-r from-urbana-gold via-yellow-400 to-urbana-gold rounded-full group-hover:scale-x-125 transition-transform duration-500" />
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

  const formatPrice = (price: number) => `R$ ${price.toFixed(2).replace(".", ",")}`;

  return (
    <section
      id="services"
      className="relative min-h-screen py-8 bg-gradient-to-b from-urbana-black via-urbana-brown to-urbana-black text-urbana-light overflow-hidden"
    >
      {/* Modern background elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-80 h-80 bg-urbana-gold rounded-full blur-3xl mix-blend-screen animate-pulse" />
        <div
          className="absolute bottom-20 right-20 w-72 h-72 bg-yellow-400 rounded-full blur-3xl mix-blend-screen animate-pulse"
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
          className="text-center max-w-4xl mx-auto mb-8 px-4"
        >
          <h2 className="text-5xl md:text-6xl font-playfair font-bold text-urbana-gold mb-4">
            Nossos{" "}
            <span className="text-urbana-light drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]">
              Serviços
            </span>
          </h2>
          <p className="text-urbana-light/90 font-raleway text-lg md:text-xl leading-relaxed">
            Descubra uma experiência única onde tradição e modernidade se
            encontram.
          </p>
        </motion.div>

        {/* Services Grid */}
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-urbana-gold border-r-transparent mb-6"></div>
            <p className="text-urbana-gold text-xl font-bold font-playfair">
              Carregando serviços premium...
            </p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 max-w-md mx-auto"
          >
            <div className="w-20 h-20 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-400 text-4xl">⚠</span>
            </div>
            <p className="text-2xl font-playfair font-bold text-red-400 mb-3">
              Erro ao carregar serviços
            </p>
            <p className="text-urbana-light/70 font-raleway text-lg">
              Por favor, tente novamente mais tarde.
            </p>
          </motion.div>
        ) : services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            className="text-center py-16 max-w-md mx-auto"
          >
            <div className="w-20 h-20 bg-urbana-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-urbana-gold text-4xl">📋</span>
            </div>
            <p className="text-2xl font-playfair font-bold text-urbana-gold mb-3">
              Nenhum serviço disponível
            </p>
            <p className="text-urbana-light/70 font-raleway text-lg">
              Em breve teremos novos serviços disponíveis.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Services;
