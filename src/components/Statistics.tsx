import React from 'react';
import { motion } from 'framer-motion';
import { useCountAnimation } from '@/hooks/useCountAnimation';
import { Award, Users, Scissors, Star } from 'lucide-react';

interface StatItemProps {
  icon: React.ElementType;
  end: number;
  suffix?: string;
  label: string;
  delay: number;
}

const StatItem: React.FC<StatItemProps> = ({ icon: Icon, end, suffix = '', label, delay }) => {
  const { count, ref } = useCountAnimation(end, 2000);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      viewport={{ once: true }}
      className="relative group"
    >
      <div className="relative bg-urbana-black/70 backdrop-blur-xl border-2 border-urbana-gold/30 rounded-2xl p-8 hover:border-urbana-gold transition-all duration-500 overflow-hidden hover:shadow-[0_20px_60px_rgba(255,215,0,0.3),0_0_80px_rgba(255,215,0,0.2)]">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/5 via-transparent to-urbana-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Geometric pattern */}
        <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 215, 0, 0.8) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />

        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          {/* Icon */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="w-16 h-16 bg-gradient-to-br from-urbana-gold via-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-[0_8px_32px_rgba(255,215,0,0.4),inset_0_2px_8px_rgba(255,255,255,0.2)]"
          >
            <Icon size={32} className="text-urbana-black" />
          </motion.div>

          {/* Counter */}
          <div className="space-y-2">
            <h3 
              className="text-5xl md:text-6xl font-bold font-playfair"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #FFA500 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 40px rgba(255, 215, 0, 0.3)'
              }}
            >
              {count}{suffix}
            </h3>
            <p className="text-urbana-light/80 font-raleway text-lg font-light">
              {label}
            </p>
          </div>

          {/* Decorative line */}
          <motion.div 
            className="h-1 w-16 bg-gradient-to-r from-urbana-gold via-yellow-400 to-urbana-gold rounded-full shadow-[0_0_16px_rgba(255,215,0,0.6)]"
            initial={{ scaleX: 1 }}
            whileHover={{ scaleX: 1.5 }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

const Statistics: React.FC = () => {
  const stats = [
    {
      icon: Award,
      end: 2,
      suffix: '',
      label: 'Anos de Excelência',
      delay: 0.1
    },
    {
      icon: Users,
      end: 400,
      suffix: '+',
      label: 'Clientes Satisfeitos',
      delay: 0.2
    },
    {
      icon: Scissors,
      end: 700,
      suffix: '+',
      label: 'Serviços Realizados',
      delay: 0.3
    },
    {
      icon: Star,
      end: 99,
      suffix: '%',
      label: 'Avaliação Positiva',
      delay: 0.4
    }
  ];

  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-b from-urbana-brown via-urbana-black to-urbana-brown overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-40 left-20 w-96 h-96 bg-gradient-radial from-urbana-gold via-yellow-400 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-gradient-radial from-yellow-400 via-urbana-gold to-transparent rounded-full blur-3xl" />
      </div>

      {/* Geometric pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(30deg, transparent 45%, rgba(255, 215, 0, 0.3) 45%, rgba(255, 215, 0, 0.3) 55%, transparent 55%), linear-gradient(150deg, transparent 45%, rgba(255, 215, 0, 0.3) 45%, rgba(255, 215, 0, 0.3) 55%, transparent 55%)',
        backgroundSize: '60px 60px'
      }} />

      <div className="urbana-container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-16 px-4"
        >
          <h2 
            className="text-5xl md:text-6xl lg:text-7xl font-playfair font-bold mb-6 leading-tight tracking-tight relative inline-block"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #FFA500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 60px rgba(255, 215, 0, 0.3)'
            }}
          >
            Nossa{" "}
            <span className="block md:inline text-urbana-light font-bold" style={{
              WebkitTextFillColor: '#f5f5f5',
              textShadow: '0 0 30px rgba(255, 215, 0, 0.4), 0 4px 20px rgba(0, 0, 0, 0.5)'
            }}>
              História
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
          <p className="text-urbana-light/90 font-raleway text-xl md:text-2xl leading-relaxed font-light tracking-wide max-w-3xl mx-auto">
            Números que contam nossa trajetória de sucesso e dedicação
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              icon={stat.icon}
              end={stat.end}
              suffix={stat.suffix}
              label={stat.label}
              delay={stat.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Statistics;
