
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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-600/10 animate-pulse" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '8s', animationDelay: '2s' }} />
      
      <LoadingBar isLoading={isLoading} />
      
      {/* Modern Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50 shadow-xl">
        <div className="w-full px-4 sm:px-6 py-3 sm:py-4">
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
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
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
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
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
      <nav className="lg:hidden sticky top-[73px] sm:top-[81px] z-40 backdrop-blur-xl bg-slate-900/90 border-b border-slate-700/50">
        <div className="flex overflow-x-auto scrollbar-hide px-2">
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
              >
                <Button
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                  className={`flex-shrink-0 px-4 py-3 mx-1 my-2 rounded-xl transition-all duration-300 min-w-max relative overflow-hidden ${
                    isActive 
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                      : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className="h-4 w-4 mr-2 relative z-10" />
                  <span className="text-xs sm:text-sm font-medium relative z-10">{item.label}</span>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-80 xl:w-96 backdrop-blur-xl bg-slate-900/50 border-r border-slate-700/50 flex-shrink-0 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800/20 to-transparent" />
          
          <nav className="p-6 space-y-3 flex-1 relative z-10">
            <h2 className="text-lg font-semibold text-gray-300 mb-6 px-3">Navegação</h2>
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <motion.div 
                  key={item.path} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ x: 4 }} 
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => navigate(item.path)}
                    className={`w-full justify-start gap-4 py-4 px-4 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                      isActive 
                        ? `bg-gradient-to-r ${item.color} text-white shadow-xl border-l-4 border-white/30` 
                        : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="desktopActiveTab"
                        className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className="h-5 w-5 relative z-10" />
                    <span className="font-medium relative z-10">{item.label}</span>
                    {isActive && (
                      <motion.div
                        className="ml-auto w-2 h-2 bg-white rounded-full relative z-10"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </nav>

          {/* Profile Card in Sidebar */}
          <motion.div 
            className="p-6 border-t border-slate-700/50 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{cliente?.nome}</p>
                  <p className="text-xs text-gray-400 truncate">{cliente?.email}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <PageTransition mode="fade">
              <div className="h-full w-full">
                <Outlet />
              </div>
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default PainelClienteLayout;
