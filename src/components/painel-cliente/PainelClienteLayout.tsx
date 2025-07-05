
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, User, Calendar, Home, Scissors } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { motion } from 'framer-motion';
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
    { path: '/painel-cliente/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/painel-cliente/agendar', icon: Calendar, label: 'Agendar' },
    { path: '/painel-cliente/agendamentos', icon: Scissors, label: 'Meus Agendamentos' },
    { path: '/painel-cliente/perfil', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-950 to-zinc-900 flex flex-col">
      <LoadingBar isLoading={isLoading} />
      
      {/* Header fixo - mais compacto no mobile */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-700">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-amber-500 rounded-lg">
                <Scissors className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-white">Urbana Barbearia</h1>
                <p className="text-xs text-gray-400 hidden sm:block">Painel do Cliente</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="hidden md:block text-xs sm:text-sm text-gray-300">
                Olá, {cliente?.nome?.split(' ')[0]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-white hover:bg-gray-800 p-1.5 sm:p-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navegação horizontal em mobile - sticky */}
      <nav className="lg:hidden sticky top-[57px] sm:top-[65px] z-30 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-700">
        <div className="flex overflow-x-auto scrollbar-hide">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => navigate(item.path)}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-none border-b-2 transition-colors min-w-max ${
                  isActive 
                    ? 'border-amber-500 text-amber-500 bg-amber-500/10' 
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="h-4 w-4 mr-1 sm:mr-2" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar para desktop - ocupa largura fixa */}
        <aside className="hidden lg:flex lg:flex-col w-64 xl:w-72 bg-zinc-900/50 border-r border-zinc-700 flex-shrink-0">
          <nav className="p-4 space-y-2 flex-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <motion.div key={item.path} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="ghost"
                    onClick={() => navigate(item.path)}
                    className={`w-full justify-start gap-3 transition-colors py-3 px-4 ${
                      isActive 
                        ? 'bg-amber-500/10 text-amber-500 border-l-2 border-amber-500' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                </motion.div>
              );
            })}
          </nav>
        </aside>

        {/* Conteúdo principal - ocupa todo espaço restante */}
        <main className="flex-1 overflow-auto">
          <PageTransition mode="fade">
            <div className="h-full">
              <Outlet />
            </div>
          </PageTransition>
        </main>
      </div>
    </div>
  );
};

export default PainelClienteLayout;
