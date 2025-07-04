
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
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-950 to-zinc-900">
      <LoadingBar isLoading={isLoading} />
      
      {/* Header fixo */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-700">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Scissors className="h-5 w-5 text-black" />
              </div>
              <div>
                <h1 className="font-bold text-white">Urbana Barbearia</h1>
                <p className="text-xs text-gray-400">Painel do Cliente</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-sm text-gray-300">
                Olá, {cliente?.nome?.split(' ')[0]}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navegação horizontal em mobile */}
      <nav className="lg:hidden sticky top-16 z-30 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-700">
        <div className="flex overflow-x-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => navigate(item.path)}
                className={`flex-shrink-0 px-4 py-2 text-xs rounded-none border-b-2 transition-colors ${
                  isActive 
                    ? 'border-amber-500 text-amber-500 bg-amber-500/10' 
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="h-4 w-4 mr-1" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar para desktop */}
        <aside className="hidden lg:block w-64 bg-zinc-900/50 min-h-[calc(100vh-4rem)] border-r border-zinc-700">
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <motion.div key={item.path} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="ghost"
                    onClick={() => navigate(item.path)}
                    className={`w-full justify-start gap-3 transition-colors ${
                      isActive 
                        ? 'bg-amber-500/10 text-amber-500 border-l-2 border-amber-500' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </motion.div>
              );
            })}
          </nav>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-hidden">
          <PageTransition mode="fade">
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
};

export default PainelClienteLayout;
