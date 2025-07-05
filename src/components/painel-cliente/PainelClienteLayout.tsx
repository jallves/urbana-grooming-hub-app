
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
    { path: '/painel-cliente/dashboard', icon: Home, label: 'Dashboard', color: 'from-blue-500 to-cyan-500' },
    { path: '/painel-cliente/agendar', icon: Calendar, label: 'Agendar', color: 'from-green-500 to-emerald-500' },
    { path: '/painel-cliente/agendamentos', icon: Scissors, label: 'Agendamentos', color: 'from-purple-500 to-pink-500' },
    { path: '/painel-cliente/perfil', icon: User, label: 'Perfil', color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-600/10 animate-pulse" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '8s', animationDelay: '2s' }} />
      
      <LoadingBar isLoading={isLoading} />
      
      {/* Header - Mobile Optimized */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl blur-sm" />
                <div className="relative p-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg">
                  <Scissors className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
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
                  className="relative text-gray-300 hover:text-white hover:bg-slate-800/50 p-2 rounded-xl"
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </Button>
              </motion.div>
              
              <span className="hidden md:block text-sm text-gray-300 px-3 py-1.5 bg-slate-800/50 rounded-full backdrop-blur-sm">
                Olá, {cliente?.nome?.split(' ')[0]}
              </span>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="lg:hidden sticky top-[70px] sm:top-[78px] z-40 backdrop-blur-xl bg-slate-900/90 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-shrink-0"
                >
                  <Button
                    variant="ghost"
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-3 mx-1 my-2 rounded-xl transition-all duration-300 relative overflow-hidden ${
                      isActive 
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                        : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobileActiveTab"
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className="h-4 w-4 mr-2 relative z-10" />
                    <span className="text-xs sm:text-sm font-medium relative z-10 whitespace-nowrap">{item.label}</span>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative">
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
