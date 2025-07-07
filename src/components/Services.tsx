
import React from 'react';
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scissors, Zap, Crown, Star, ArrowRight, Sparkles } from "lucide-react";

const Services: React.FC = () => {
  const services = [
    {
      icon: Scissors,
      title: "Corte Clássico",
      description: "Corte tradicional com acabamento impecável, respeitando o formato do rosto e estilo pessoal.",
      price: "R$ 45",
      duration: "45 min",
      features: ["Análise facial", "Lavagem completa", "Finalização"],
      color: "from-blue-600 to-cyan-600"
    },
    {
      icon: Crown,
      title: "Barba Premium",
      description: "Cuidado completo para sua barba com produtos premium e técnicas tradicionais.",
      price: "R$ 35",
      duration: "30 min",
      features: ["Design personalizado", "Produtos premium", "Hidratação"],
      color: "from-purple-600 to-pink-600"
    },
    {
      icon: Zap,
      title: "Combo Completo",
      description: "Experiência completa com corte, barba e cuidados especiais para o cavalheiro moderno.",
      price: "R$ 70",
      duration: "75 min",
      features: ["Corte + Barba", "Relaxamento", "Produtos especiais"],
      color: "from-amber-600 to-orange-600",
      popular: true
    },
    {
      icon: Star,
      title: "Tratamento Capilar",
      description: "Cuidados especiais para manutenção e saúde dos seus cabelos com produtos profissionais.",
      price: "R$ 25",
      duration: "20 min",
      features: ["Hidratação profunda", "Análise capilar", "Produtos naturais"],
      color: "from-green-600 to-emerald-600"
    }
  ];

  return (
    <section id="services" className="relative py-24 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
      {/* Modern background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-32 right-10 w-96 h-96 bg-urbana-gold rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-10 w-80 h-80 bg-urbana-gold rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-urbana-gold/20 rounded-full"></div>
      </div>

      <div className="urbana-container relative z-10">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-urbana-gold to-transparent"></div>
            <Sparkles className="mx-4 h-6 w-6 text-urbana-gold" />
            <div className="w-16 h-px bg-gradient-to-l from-transparent via-urbana-gold to-transparent"></div>
          </div>
          
          <h2 className="urbana-heading mb-6 relative">
            <span className="bg-gradient-to-r from-urbana-black via-urbana-brown to-urbana-black bg-clip-text text-transparent">
              Nossos Serviços
            </span>
          </h2>
          
          <p className="urbana-subheading max-w-3xl mx-auto leading-relaxed">
            Oferecemos uma experiência premium de cuidados masculinos, combinando técnicas tradicionais 
            com as mais modernas tendências da barbearia contemporânea.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <Card className="h-full border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-gray-50 group-hover:from-white group-hover:to-urbana-gold/5 relative overflow-hidden">
                {/* Popular badge */}
                {service.popular && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <div className="bg-gradient-to-r from-urbana-gold to-yellow-400 text-urbana-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      POPULAR
                    </div>
                  </div>
                )}

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
                  <div className={`absolute top-0 right-0 w-0 h-0 border-l-[80px] border-l-transparent border-t-[80px] bg-gradient-to-br ${service.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                </div>

                <CardContent className="p-8 relative z-10">
                  {/* Icon with gradient background */}
                  <div className="relative mb-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} p-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <service.icon className="w-full h-full text-white" />
                    </div>
                    <div className={`absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} blur-xl opacity-30 group-hover:opacity-50 transition-opacity`}></div>
                  </div>

                  <h3 className="text-xl font-bold text-urbana-black mb-3 group-hover:text-urbana-brown transition-colors">
                    {service.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {service.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 bg-urbana-gold rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Price and Duration */}
                  <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <span className="text-2xl font-bold text-urbana-gold">{service.price}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">{service.duration}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full bg-gradient-to-r from-urbana-black to-urbana-brown hover:from-urbana-brown hover:to-urbana-black text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group/btn"
                  >
                    <span>Agendar Agora</span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-urbana-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-br from-urbana-black to-urbana-brown rounded-2xl p-12 text-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,215,0,0.3)_0%,transparent_50%)]"></div>
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(255,215,0,0.2)_0%,transparent_50%)]"></div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-4">
                Pronto para uma Transformação?
              </h3>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Agende seu horário e descubra por que somos a barbearia preferida dos cavalheiros exigentes.
              </p>
              <Button 
                size="lg"
                className="bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black font-bold px-8 py-4 text-lg rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Agendar Consulta Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Services;
