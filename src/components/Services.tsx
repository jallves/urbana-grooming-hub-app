
import React, { useRef } from "react";
import { Scissors } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArtDecoCorner } from "@/components/decorative/ArtDecoCorner";

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
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.15, 
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{ 
        y: -10,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      className="group"
    >
      <Card className="relative bg-urbana-black/90 backdrop-blur-xl border-2 border-urbana-gold/50 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,215,0,0.2)] hover:shadow-[0_20px_60px_rgba(255,215,0,0.3),0_0_80px_rgba(255,215,0,0.2)] transition-all duration-500 h-full flex flex-col p-6 hover:border-urbana-gold overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-urbana-gold/10 before:via-transparent before:to-urbana-gold/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500">
        {/* Art Deco corners */}
        <ArtDecoCorner position="top-left" />
        <ArtDecoCorner position="bottom-right" />
        
        {/* Animated golden glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-urbana-gold via-yellow-400 to-urbana-gold rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
        
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
        
        {/* Geometric pattern */}
        <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 215, 0, 0.8) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />

        <div className="relative z-10 mb-6 flex items-center justify-between">
          <motion.div 
            className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-urbana-gold via-yellow-400 to-amber-500 rounded-xl shadow-[0_8px_32px_rgba(255,215,0,0.4),inset_0_2px_8px_rgba(255,255,255,0.2)] backdrop-blur-sm border border-yellow-300/20"
            whileHover={{ 
              scale: 1.15,
              rotate: 360,
              boxShadow: "0 12px 48px rgba(255,215,0,0.6), 0 0 40px rgba(255,215,0,0.4), inset 0 2px 12px rgba(255,255,255,0.3)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Scissors size={30} className="text-urbana-black drop-shadow-lg" />
          </motion.div>
          <motion.span 
            className="text-urbana-gold font-playfair font-bold text-2xl px-4 py-2 rounded-lg bg-gradient-to-r from-urbana-gold/10 to-yellow-500/10 backdrop-blur-sm border border-urbana-gold/20 shadow-[0_4px_16px_rgba(255,215,0,0.2)]"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 6px 24px rgba(255,215,0,0.4)"
            }}
          >
            {price}
          </motion.span>
        </div>

        <h3 
          className="relative z-10 text-3xl md:text-4xl font-bold text-urbana-light group-hover:text-urbana-gold transition-colors duration-300 mb-4 font-playfair leading-tight tracking-tight"
          style={{
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
          }}
        >
          {title}
        </h3>

        <p className="relative z-10 text-urbana-light/80 flex-grow font-raleway text-lg leading-relaxed font-light">
          {description ?? "Serviço premium de barbearia com atenção aos detalhes e técnicas modernas."}
        </p>

        <motion.div 
          className="relative z-10 mt-6 h-1.5 w-20 bg-gradient-to-r from-urbana-gold via-yellow-400 to-urbana-gold rounded-full shadow-[0_0_16px_rgba(255,215,0,0.6)]"
          initial={{ scaleX: 1 }}
          whileHover={{ scaleX: 2.5 }}
          transition={{ duration: 0.5 }}
        />
      </Card>
    </motion.div>
  );
};

const Services: React.FC = () => {
  const { data: services, isLoading, error } = useQuery<Array<{ id: string; nome: string; preco: number; duracao: number; show_on_home: boolean; display_order: number }>>({
    queryKey: ["featured-services"],
    queryFn: async () => {
      console.log('[PWA Services] Buscando serviços...');
      
      // Primeiro tenta buscar serviços marcados para exibição na home
      const { data: featuredData, error: featuredError } = await supabase
        .from("painel_servicos")
        .select("*")
        .eq("show_on_home", true)
        .order("display_order", { ascending: true });

      if (featuredError) {
        console.error('[PWA Services] Erro:', featuredError.message);
        throw featuredError;
      }
      
      // Se não houver serviços marcados, busca os 6 primeiros por display_order
      if (!featuredData || featuredData.length === 0) {
        console.log('[PWA Services] Buscando fallback (top 6)...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("painel_servicos")
          .select("*")
          .order("display_order", { ascending: true })
          .limit(6);
        
        if (fallbackError) {
          console.error('[PWA Services] Erro fallback:', fallbackError.message);
          throw fallbackError;
        }
        console.log('[PWA Services] ✅ Carregados (fallback):', fallbackData?.length || 0);
        return fallbackData || [];
      }
      
      console.log('[PWA Services] ✅ Carregados:', featuredData.length);
      return featuredData || [];
    },
    retry: 3,
    retryDelay: 2000,
  });

  const formatPrice = (price: number) => `R$ ${price.toFixed(2).replace(".", ",")}`;

  return (
    <section
      id="services"
      className="relative min-h-screen py-8 text-urbana-light overflow-hidden"
    >
      {/* Modern background elements with enhanced glow */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-radial from-urbana-gold via-yellow-400 to-transparent rounded-full blur-3xl mix-blend-screen shadow-[0_0_100px_rgba(255,215,0,0.3)]" />
        <div
          className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-radial from-yellow-400 via-urbana-gold to-transparent rounded-full blur-3xl mix-blend-screen shadow-[0_0_100px_rgba(255,215,0,0.3)]"
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-radial from-urbana-gold/30 to-transparent rounded-full blur-2xl"
        />
      </div>
      
      {/* Geometric golden pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(30deg, transparent 45%, rgba(255, 215, 0, 0.3) 45%, rgba(255, 215, 0, 0.3) 55%, transparent 55%), linear-gradient(150deg, transparent 45%, rgba(255, 215, 0, 0.3) 45%, rgba(255, 215, 0, 0.3) 55%, transparent 55%)',
        backgroundSize: '60px 60px'
      }} />

      <div className="w-full relative z-10 px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mx-auto mb-16"
        >
          <h2 
            className="text-6xl md:text-7xl lg:text-8xl font-playfair font-bold mb-6 leading-tight tracking-tight relative inline-block"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #FFA500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 60px rgba(255, 215, 0, 0.3)'
            }}
          >
            Nossos{" "}
            <span className="block md:inline text-urbana-light font-bold" style={{
              WebkitTextFillColor: '#f5f5f5',
              textShadow: '0 0 30px rgba(255, 215, 0, 0.4), 0 4px 20px rgba(0, 0, 0, 0.5)'
            }}>
              Serviços
            </span>
            {/* Decorative underline */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              viewport={{ once: true }}
              className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-urbana-gold to-transparent rounded-full shadow-[0_0_15px_rgba(255,215,0,0.6)]"
            />
          </h2>
          <p className="text-urbana-light/90 font-raleway text-xl md:text-2xl lg:text-3xl leading-relaxed font-light tracking-wide max-w-3xl mx-auto">
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
                title={service.nome}
                price={formatPrice(service.preco)}
                description={null}
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
