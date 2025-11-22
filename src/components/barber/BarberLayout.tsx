import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Home
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import RealtimeNotifications from '@/components/ui/notifications/RealtimeNotifications';
import barbershopBg from '@/assets/barbershop-background.jpg';
import costaUrbanaLogo from '@/assets/logo-costa-urbana.png';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface BarberLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const BarberLayout: React.FC<BarberLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const navigationItems = [
    { 
      name: 'Dashboard', 
      path: '/barbeiro/dashboard', 
      icon: Home 
    },
    { 
      name: 'Agendamentos', 
      path: '/barbeiro/agendamentos', 
      icon: Calendar 
    },
    { 
      name: 'Comissões', 
      path: '/barbeiro/comissoes', 
      icon: DollarSign 
    },
  ];

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden relative font-poppins">
      {/* Background image - Same as PainelClienteLayout */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src={barbershopBg} 
          alt="Barbearia Costa Urbana Background" 
          className="w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-urbana-black/60 border-b border-urbana-gold/20 shadow-2xl">
        <div className="w-full px-2 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-urbana-gold to-urbana-gold-vibrant rounded-xl sm:rounded-2xl blur-sm opacity-75" />
                <div className="relative p-2 sm:p-2.5 bg-gradient-to-r from-urbana-gold to-urbana-gold-vibrant rounded-xl sm:rounded-2xl shadow-lg">
                  <img 
                    src={costaUrbanaLogo} 
                    alt="Costa Urbana Logo" 
                    className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 object-contain drop-shadow-lg"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-urbana-light drop-shadow-lg">
                  {title || 'Painel do Barbeiro'}
                </h1>
                <p className="text-xs sm:text-sm text-urbana-light/70 hidden sm:block">Área do Profissional</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <RealtimeNotifications />
              
              <button
                onClick={signOut}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl sm:rounded-2xl text-urbana-light/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 border border-transparent hover:border-red-500/20"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden lg:block sticky top-[68px] z-40 w-full backdrop-blur-2xl bg-urbana-black/60 border-b border-urbana-gold/20 shadow-xl">
        <div className="w-full px-2 md:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide py-2">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-all duration-300 whitespace-nowrap rounded-t-lg ${
                  isActiveRoute(item.path)
                    ? 'text-urbana-gold border-urbana-gold bg-urbana-gold/10'
                    : 'text-urbana-light/70 border-transparent hover:text-urbana-light hover:bg-urbana-gold/5'
                }`}
              >
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile/Tablet Navigation */}
      <nav className="lg:hidden sticky top-[68px] z-40 w-full backdrop-blur-2xl bg-urbana-black/60 border-b border-urbana-gold/20 shadow-xl">
        <div className="w-full px-1 md:px-4">
          <div className="grid grid-cols-3 gap-1 py-2 sm:py-3">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path);
              
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative"
                >
                  <Button
                    variant="ghost"
                    onClick={() => navigate(item.path)}
                    className={`
                      w-full h-auto flex flex-col items-center justify-center 
                      p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 
                      relative overflow-hidden min-h-[60px] sm:min-h-[70px]
                      ${isActive 
                        ? 'bg-urbana-gold/20 text-urbana-gold shadow-lg shadow-urbana-gold/20 border border-urbana-gold/30 backdrop-blur-sm' 
                        : 'text-urbana-light/70 hover:text-urbana-light hover:bg-urbana-gold/10 border border-transparent hover:border-urbana-gold/20'
                      }
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobileActiveTabBarber"
                        className="absolute inset-0 bg-gradient-to-r from-urbana-gold/10 to-urbana-gold/5 rounded-xl sm:rounded-2xl"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    
                    <div className="relative z-10 flex flex-col items-center gap-1 sm:gap-1.5">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-xs sm:text-sm font-medium leading-tight text-center">
                        {item.name}
                      </span>
                    </div>
                    
                    {isActive && (
                      <motion.div
                        className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-urbana-gold rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      />
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 w-full pb-20 sm:pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
};

export default BarberLayout;
