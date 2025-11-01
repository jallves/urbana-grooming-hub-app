import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Scissors, LogOut, Calendar, CreditCard, ShoppingBag, CheckCircle } from 'lucide-react';
import { useTotemAuth } from '@/contexts/TotemAuthContext';

const TotemHome: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useTotemAuth();
  const [isIdle, setIsIdle] = useState(true);

  useEffect(() => {
    // Screensaver mode - reset to home after 60 seconds of inactivity
    const idleTimer = setTimeout(() => {
      setIsIdle(true);
    }, 60000);

    return () => clearTimeout(idleTimer);
  }, [isIdle]);

  const handleStart = () => {
    setIsIdle(false);
    navigate('/totem/search');
  };

  const handleLogout = () => {
    logout();
    navigate('/totem/login');
  };

  const menuItems = [
    {
      icon: Calendar,
      title: 'Agendar',
      subtitle: 'Novo Atendimento',
      onClick: () => navigate('/totem/search'),
      color: 'bg-urbana-gold'
    },
    {
      icon: CheckCircle,
      title: 'Check-in',
      subtitle: 'Já Cheguei',
      onClick: () => navigate('/totem/search'),
      color: 'bg-urbana-gold'
    },
    {
      icon: CreditCard,
      title: 'Check-out',
      subtitle: 'Pagamento',
      onClick: () => navigate('/totem/search'),
      color: 'bg-urbana-gold'
    },
    {
      icon: ShoppingBag,
      title: 'Produtos',
      subtitle: 'E Cuidados',
      onClick: () => navigate('/totem/search'),
      color: 'bg-urbana-gold'
    }
  ];

  return (
    <div className="min-h-screen bg-urbana-black flex flex-col items-center justify-center p-8 relative font-poppins overflow-hidden">
      {/* Background texture effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black opacity-50" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(197, 161, 91, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(197, 161, 91, 0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      {/* Logout Button */}
      <Button
        onClick={handleLogout}
        variant="ghost"
        size="sm"
        className="absolute top-6 right-6 gap-2 text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10 z-10"
      >
        <LogOut className="w-5 h-5" />
        Sair
      </Button>

      <div className="text-center space-y-12 max-w-6xl w-full z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-urbana-gold blur-3xl opacity-30 animate-pulse" />
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-urbana-gold to-urbana-gold-dark flex items-center justify-center shadow-2xl border-4 border-urbana-gold/20">
              <Scissors className="w-16 h-16 text-urbana-black" />
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-6 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-light text-urbana-light tracking-wide">
            Bem-vindo à
          </h1>
          <h2 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
            COSTA URBANA
          </h2>
          <div className="flex items-center justify-center gap-4 text-urbana-light/70">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-urbana-gold" />
            <p className="text-xl md:text-2xl font-light tracking-wider uppercase">
              Sistema de Autoatendimento
            </p>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-urbana-gold" />
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="group relative bg-card hover:bg-card/80 rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-urbana-gold/20 border border-urbana-gray/20 hover:border-urbana-gold/50"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/0 group-hover:from-urbana-gold/10 group-hover:to-urbana-gold/5 rounded-2xl transition-all duration-300" />
                
                <div className="relative flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-urbana-gold/10 group-hover:bg-urbana-gold flex items-center justify-center transition-all duration-300">
                    <Icon className="w-8 h-8 text-urbana-gold group-hover:text-urbana-black transition-colors duration-300" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-urbana-light mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-urbana-light/60">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="pt-12 animate-pulse">
          <p className="text-xl text-urbana-gold/70 font-light tracking-wide">
            Toque na tela para começar
          </p>
        </div>

        {/* Footer */}
        <div className="pt-8">
          <p className="text-xs text-urbana-light/30 uppercase tracking-wider">
            Powered by Beltec Soluções
          </p>
        </div>
      </div>
    </div>
  );
};

export default TotemHome;
