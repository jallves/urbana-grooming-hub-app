import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Home,
  Clock,
  Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useBarberDataQuery } from '@/hooks/barber/queries/useBarberDataQuery';
import barbershopBg from '@/assets/barbershop-background.jpg';
import costaUrbanaLogo from '@/assets/logo-costa-urbana.png';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface BarberLayoutProps {
  children?: React.ReactNode;
  title?: string;
}

const BarberLayout: React.FC<BarberLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const queryClient = useQueryClient();
  
  // Carregar dados do barbeiro logo no layout
  const { data: barberData } = useBarberDataQuery();

  // Prefetch estratégico baseado na rota atual
  useEffect(() => {
    if (!barberData?.id) return;

    const currentPath = location.pathname;

    // Prefetch de dados com base na navegação provável
    if (currentPath.includes('dashboard')) {
      // No dashboard, prefetch agendamentos e comissões
      queryClient.prefetchQuery({
        queryKey: ['barber-appointments', barberData.id],
      });
      queryClient.prefetchQuery({
        queryKey: ['barber-commissions', user?.id],
      });
    } else if (currentPath.includes('agendamentos')) {
      // Nos agendamentos, prefetch comissões
      queryClient.prefetchQuery({
        queryKey: ['barber-commissions', user?.id],
      });
    } else if (currentPath.includes('comissoes')) {
      // Nas comissões, prefetch agendamentos
      queryClient.prefetchQuery({
        queryKey: ['barber-appointments', barberData.id],
      });
    } else if (currentPath.includes('horarios')) {
      // Nos horários, prefetch working hours e time off
      queryClient.prefetchQuery({
        queryKey: ['working-hours', barberData.staff_id],
      });
      queryClient.prefetchQuery({
        queryKey: ['time-off', barberData.staff_id],
      });
    }
  }, [location.pathname, barberData?.id, barberData?.staff_id, user?.id, queryClient]);

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
      name: 'Meus Horários', 
      path: '/barbeiro/horarios', 
      icon: Clock 
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
          className="w-full h-full object-cover object-center"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Modern Header - FIXO */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-2xl bg-urbana-black/90 border-b border-urbana-gold/20 shadow-2xl">
        <div className="w-full px-2 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="relative">
                <div className="relative p-1 sm:p-1.5 bg-urbana-black/30 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-urbana-gold/20">
                  <img 
                    src={costaUrbanaLogo} 
                    alt="Costa Urbana Logo" 
                    className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-urbana-light drop-shadow-lg">
                  Barbearia Costa Urbana
                </h1>
                <p className="text-xs sm:text-sm text-urbana-light/70 hidden sm:block">Painel do Barbeiro</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300"
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-urbana-gold rounded-full animate-pulse" />
                </Button>
              </div>

              <div className="hidden md:flex items-center gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-urbana-black/30 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-urbana-gold/20">
                <div className="w-2 h-2 bg-urbana-gold rounded-full animate-pulse" />
                <span className="text-xs sm:text-sm text-urbana-light font-medium">
                  {user?.user_metadata?.name?.split(' ')[0] || 'Barbeiro'}
                </span>
              </div>
              
              <div>
                <button
                  onClick={signOut}
                  className="flex items-center text-urbana-light hover:text-red-400 hover:bg-red-500/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 border border-transparent hover:border-red-500/20"
                >
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Mobile/Tablet Navigation - FIXO NA PARTE INFERIOR */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-[60] w-full backdrop-blur-2xl bg-urbana-black/95 border-t border-urbana-gold/20 shadow-2xl pb-safe">
        <div className="w-full px-2 sm:px-3">
          {/* Mobile Tab Navigation */}
          <div className="grid grid-cols-4 gap-1 py-2 sm:py-3">
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
                      px-1 py-2 sm:px-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 
                      relative overflow-hidden
                      ${isActive 
                        ? 'bg-urbana-gold/20 text-urbana-gold shadow-lg shadow-urbana-gold/20 border border-urbana-gold/30 backdrop-blur-sm' 
                        : 'text-urbana-light/70 hover:text-urbana-light hover:bg-urbana-gold/10 border border-transparent hover:border-urbana-gold/20'
                      }
                    `}
                  >
                    {/* Active background glow */}
                    {isActive && (
                      <motion.div
                        layoutId="mobileActiveTabBarber"
                        className="absolute inset-0 bg-gradient-to-r from-urbana-gold/10 to-urbana-gold/5 rounded-lg sm:rounded-xl"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    
                    <div className="relative z-10 flex flex-col items-center gap-0.5 sm:gap-1">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span className="text-[10px] sm:text-xs font-medium leading-tight text-center whitespace-nowrap px-1">
                        {item.name}
                      </span>
                    </div>
                    
                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.div
                        className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-urbana-gold rounded-full"
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

      {/* Main Content - Com espaçamento para header fixo no topo e navegação fixa no rodapé */}
      <main className="relative z-10 w-full pt-[72px] sm:pt-[80px] pb-[80px] sm:pb-[90px] lg:pb-8">
        <Outlet />
      </main>
    </div>
  );
};

export default BarberLayout;
