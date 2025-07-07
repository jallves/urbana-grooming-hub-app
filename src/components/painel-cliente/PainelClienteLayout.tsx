
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, User, Calendar, Home, Scissors, Bell } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/transitions/PageTransition';
import LoadingBar from '@/components/ui/loading/LoadingBar';
import { usePageTransition } from '@/hooks/usePageTransition';

const PainelClienteLayout: React.FC = () => {
  const { cliente, logout } = usePainelClienteAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading } = usePageTransition();

  const handleLogout = async () => {
    await logout();
    navigate('/painel-cliente/login');
  };

  const navigationItems = [
    { path: '/painel-cliente/dashboard', icon: Home, label: 'Home', color: 'from-blue-500 to-cyan-500' },
    { path: '/painel-cliente/agendar', icon: Calendar, label: 'Agendar', color: 'from-green-500 to-emerald-500' },
    { path: '/painel-cliente/agendamentos', icon: Scissors, label: 'Histórico', color: 'from-purple-500 to-pink-500' },
    { path: '/painel-cliente/perfil', icon: User, label: 'Perfil', color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5 animate-pulse pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      
      <LoadingBar isLoading={isLoading} />
      
      {/* Modern Header */}
      <header className="sticky top-0 z-50 w-screen backdrop-blur-2xl bg-slate-900/80 border-b border-slate-700/50 shadow-2xl">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-2 sm:gap-3 md:gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl sm:rounded-2xl blur-sm opacity-75" />
                <div className="relative p-2 sm:p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl sm:rounded-2xl shadow-lg">
                  <Scissors className="h-4 w-4 sm:h-5 md:h-6 w-5 md:w-6 text-black" />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
                  Urbana Barbearia
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Painel do Cliente</p>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative text-gray-300 hover:text-white hover:bg-slate-800/50 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300"
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse" />
                </Button>
              </motion.div>
              
              <div className="hidden md:flex items-center gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-800/50 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-slate-700/50">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs sm:text-sm text-gray-300 font-medium">
                  {cliente?.nome?.split(' ')[0]}
                </span>
              </div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 border border-transparent hover:border-red-500/20"
                >
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Mobile Navigation */}
      <nav className="lg:hidden sticky top-[60px] sm:top-[70px] md:top-[86px] z-40 w-screen backdrop-blur-2xl bg-slate-900/95 border-b border-slate-700/50 shadow-xl">
        <div className="w-full px-2 sm:px-3 md:px-4">
          {/* Mobile Tab Navigation */}
          <div className="grid grid-cols-4 gap-1 py-2 sm:py-3">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
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
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-black/20 border border-white/20` 
                        : 'text-gray-400 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-600/50'
                      }
                    `}
                  >
                    {/* Active background glow */}
                    {isActive && (
                      <motion.div
                        layoutId="mobileActiveTab"
                        className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl sm:rounded-2xl"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    
                    <div className="relative z-10 flex flex-col items-center gap-1 sm:gap-1.5">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-xs sm:text-sm font-medium leading-tight text-center">
                        {item.label}
                      </span>
                    </div>
                    
                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.div
                        className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"
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
          
          {/* Mobile User Info Bar - Only visible on very small screens */}
          <div className="md:hidden border-t border-slate-700/30 py-2">
            <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-800/30 rounded-lg backdrop-blur-sm">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-300 font-medium truncate">
                Olá, {cliente?.nome?.split(' ')[0]}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative w-screen min-h-screen">
        <AnimatePresence mode="wait">
          <PageTransition mode="fade">
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default PainelClienteLayout;
