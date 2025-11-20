import { Calendar, Scissors, Clock, Star, Users, MessageCircle } from 'lucide-react';
import WhatsAppButton from '@/components/WhatsAppButton';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { motion } from 'framer-motion';
import barbershopBg from '@/assets/barbershop-background.jpg';
import costaUrbanaLogo from '@/assets/logo-costa-urbana.png';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Index = () => {
  const services = [
    { icon: Scissors, title: 'Corte Clássico', description: 'Cortes tradicionais com técnicas modernas', price: 'R$ 45' },
    { icon: Star, title: 'Barba & Bigode', description: 'Aparar, modelar e cuidados especiais', price: 'R$ 35' },
    { icon: Clock, title: 'Tratamentos', description: 'Hidratação capilar e facial', price: 'R$ 60' },
  ];

  const stats = [
    { value: '5000+', label: 'Clientes Satisfeitos' },
    { value: '15+', label: 'Anos de Experiência' },
    { value: '4.9/5', label: 'Avaliação Média' },
  ];

  return (
    <div className="min-h-screen w-screen overflow-x-hidden relative">
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Background fixo da barbearia */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src={barbershopBg} 
          alt="Barbearia Costa Urbana Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/90 via-urbana-black/85 to-urbana-brown/80" />
      </div>

      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-urbana-black/60 border-b border-urbana-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={costaUrbanaLogo} alt="Costa Urbana" className="h-10 w-10" />
              <h1 className="text-xl font-bold text-urbana-gold">Costa Urbana</h1>
            </div>
            <Button 
              onClick={() => window.location.href = '/painel-cliente/login'}
              className="bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90 font-semibold"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-[80vh] flex items-center justify-center px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold text-urbana-light mb-6 font-playfair"
              style={{ textShadow: '0 0 40px rgba(255, 215, 0, 0.3)' }}
            >
              Experiência Premium em Barbearia
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-urbana-light/80 mb-10"
            >
              Estilo, Precisão e Atendimento de Excelência
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Button 
                onClick={() => window.location.href = '/painel-cliente/login'}
                size="lg"
                className="bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90 text-lg px-8 py-6 font-bold shadow-2xl shadow-urbana-gold/30"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Agendar Agora
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-urbana-light text-center mb-16 font-playfair"
            >
              Nossos Serviços
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  <Card className="bg-urbana-black/40 backdrop-blur-2xl border-2 border-urbana-gold/30 p-8 hover:border-urbana-gold/60 transition-all duration-300 h-full">
                    <service.icon className="w-12 h-12 text-urbana-gold mb-4" />
                    <h3 className="text-2xl font-bold text-urbana-light mb-3 font-playfair">{service.title}</h3>
                    <p className="text-urbana-light/70 mb-4">{service.description}</p>
                    <p className="text-urbana-gold font-bold text-xl">{service.price}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  <Card className="bg-urbana-black/40 backdrop-blur-2xl border-2 border-urbana-gold/30 p-8 text-center">
                    <div className="text-5xl font-bold text-urbana-gold mb-2 font-playfair">{stat.value}</div>
                    <div className="text-urbana-light/80">{stat.label}</div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="bg-urbana-black/40 backdrop-blur-2xl border-2 border-urbana-gold/30 p-12">
              <h2 className="text-4xl md:text-5xl font-bold text-urbana-light mb-6 font-playfair">
                Pronto para Transformar seu Visual?
              </h2>
              <p className="text-xl text-urbana-light/80 mb-8">
                Agende seu horário e experimente o melhor da barbearia premium
              </p>
              <Button 
                onClick={() => window.location.href = '/painel-cliente/login'}
                size="lg"
                className="bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90 text-lg px-8 py-6 font-bold shadow-2xl shadow-urbana-gold/30"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Agendar Agora
              </Button>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-urbana-gold/20">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <img src={costaUrbanaLogo} alt="Costa Urbana" className="h-12 w-12" />
              <h3 className="text-2xl font-bold text-urbana-gold">Costa Urbana</h3>
            </div>
            <p className="text-urbana-light/60 mb-4">Barbearia Premium</p>
            <p className="text-urbana-light/40 text-sm">© 2024 Costa Urbana. Todos os direitos reservados.</p>
          </div>
        </footer>
      </main>

      {/* WhatsApp Button */}
      <WhatsAppButton />
    </div>
  );
};

export default Index;

