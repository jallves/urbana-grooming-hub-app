import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, User, Calendar, Home, Bell, Clock } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { useAuth } from '@/contexts/AuthContext';
import barbershopBg from '@/assets/barbershop-background.jpg';
import costaUrbanaLogo from '@/assets/logo-costa-urbana.png';

const PainelClienteLayout: React.FC = () => {
  const { cliente } = usePainelClienteAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // PERSISTÊNCIA DE ROTA: Salvar rota atual toda vez que mudar
  React.useEffect(() => {
    if (location.pathname.startsWith('/painel-cliente/') && location.pathname !== '/painel-cliente/login') {
      console.log('[PainelClienteLayout] 💾 Salvando rota:', location.pathname);
      localStorage.setItem('client_last_route', location.pathname);
    }
  }, [location.pathname]);

  React.useEffect(() => {
    console.log('✅ PainelClienteLayout carregado com background da barbearia');
  }, []);

  const handleLogout = () => {
    setIsLoggingOut(true);
    console.log('🚪 [Layout] Iniciando processo de logout...');
    console.log('[PainelClienteLayout] 🚪 Logout - limpando rota salva');
    localStorage.removeItem('client_last_route'); // Limpa a rota salva ao fazer logout
    signOut();
    navigate('/painel-cliente/login', { replace: true });
  };

  const navigationItems = [
    { path: '/painel-cliente/dashboard', icon: Home, label: 'Home', color: 'from-blue-500 to-cyan-500' },
    { path: '/painel-cliente/agendar', icon: Calendar, label: 'Agendar', color: 'from-green-500 to-emerald-500' },
    { path: '/painel-cliente/agendamentos', icon: Clock, label: 'Histórico', color: 'from-purple-500 to-pink-500' },
    { path: '/painel-cliente/perfil', icon: User, label: 'Perfil', color: 'from-orange-500 to-red-500' },
  ];

  return (
    // Container principal - viewport fixo
    <div className="fixed inset-0 w-screen h-screen font-poppins overflow-hidden">
      {/* Background fixo da barbearia */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia Costa Urbana Background" 
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('❌ Erro ao carregar background da barbearia');
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Header FIXO - Absoluto dentro do container fixo */}
      <header 
        className="absolute top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-urbana-black/90 border-b border-urbana-gold/20 shadow-2xl"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="w-full px-2 md:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="relative">
                <div className="relative p-1 sm:p-1.5 bg-urbana-black/30 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-urbana-gold/20">
                  <img 
                    src={costaUrbanaLogo} 
                    alt="Costa Urbana" 
                    className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-urbana-light drop-shadow-lg">
                  Barbearia Costa Urbana
                </h1>
                <p className="text-xs sm:text-sm text-urbana-light/70 hidden sm:block">Painel do Cliente</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="relative text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-urbana-gold rounded-full animate-pulse" />
              </Button>
              
              <div className="hidden md:flex items-center gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-urbana-black/30 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-urbana-gold/20">
                <div className="w-2 h-2 bg-urbana-gold rounded-full animate-pulse" />
                <span className="text-xs sm:text-sm text-urbana-light font-medium">
                  {cliente?.nome?.split(' ')[0]}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`text-urbana-light hover:text-red-400 hover:bg-red-500/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 border border-transparent hover:border-red-500/20 ${
                  isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <LogOut className={`h-4 w-4 sm:h-5 sm:w-5 ${isLoggingOut ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation FIXO - Absoluto dentro do container fixo */}
      <nav 
        className="md:hidden absolute bottom-0 left-0 right-0 z-50 backdrop-blur-2xl bg-urbana-black/90 border-t border-urbana-gold/20 shadow-2xl safe-bottom"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <div className="w-full px-1">
          <div className="grid grid-cols-4 gap-1 py-2 sm:py-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
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
                    <div className="absolute inset-0 bg-gradient-to-r from-urbana-gold/10 to-urbana-gold/5 rounded-xl sm:rounded-2xl" />
                  )}
                  
                  <div className="relative z-10 flex flex-col items-center gap-1 sm:gap-1.5">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs sm:text-sm font-medium leading-tight text-center">
                      {item.label}
                    </span>
                  </div>
                  
                  {isActive && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-urbana-gold rounded-full" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Navigation Sidebar */}
      <nav className="hidden md:flex absolute left-0 top-[72px] bottom-0 z-40 w-64 lg:w-72 xl:w-80 backdrop-blur-2xl bg-gradient-to-b from-urbana-black/95 via-urbana-black/90 to-urbana-black/95 border-r border-urbana-gold/20 shadow-2xl flex-col overflow-y-auto">
        <div className="px-4 py-8 border-b border-urbana-gold/10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-urbana-gold/5 to-transparent rounded-xl blur-xl" />
            <h2 className="text-lg font-semibold text-urbana-light relative z-10">Navegação</h2>
            <p className="text-xs text-urbana-light/60 mt-1 relative z-10">Acesse suas funcionalidades</p>
          </div>
        </div>

        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => navigate(item.path)}
                className={`
                  relative w-full flex items-center gap-4 justify-start
                  p-4 lg:p-5 rounded-2xl transition-colors duration-200
                  border backdrop-blur-sm
                  ${isActive 
                    ? 'bg-gradient-to-r from-urbana-gold/20 to-urbana-gold-vibrant/10 text-urbana-gold border-urbana-gold/40' 
                    : 'text-urbana-light/70 hover:text-urbana-gold hover:bg-urbana-gold/5 border-transparent hover:border-urbana-gold/20'
                  }
                `}
              >
                <div className={`
                  relative flex items-center justify-center
                  w-11 h-11 lg:w-12 lg:h-12 rounded-xl
                  transition-colors duration-200
                  ${isActive 
                    ? 'bg-gradient-to-br from-urbana-gold/30 to-urbana-gold-vibrant/20' 
                    : 'bg-urbana-black/40'
                  }
                `}>
                  <Icon className={`
                    h-5 w-5 lg:h-6 lg:w-6 transition-colors duration-200
                    ${isActive ? 'text-urbana-gold' : 'text-urbana-light/70'}
                  `} />
                </div>
                
                <div className="flex-1 text-left">
                  <span className={`
                    block text-sm lg:text-base font-semibold transition-colors duration-200
                    ${isActive ? 'text-urbana-gold' : 'text-urbana-light'}
                  `}>
                    {item.label}
                  </span>
                  <span className={`
                    block text-xs transition-colors duration-200 mt-0.5
                    ${isActive ? 'text-urbana-gold/70' : 'text-urbana-light/50'}
                  `}>
                    {item.label === 'Home' && 'Visão geral'}
                    {item.label === 'Agendar' && 'Novo horário'}
                    {item.label === 'Histórico' && 'Seus agendamentos'}
                    {item.label === 'Perfil' && 'Suas informações'}
                  </span>
                </div>
                
                {isActive && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 rounded-full bg-urbana-gold" />
                  </div>
                )}
              </Button>
            );
          })}
        </div>

        <div className="px-4 py-3">
          <div className="h-px bg-gradient-to-r from-transparent via-urbana-gold/30 to-transparent" />
        </div>
        
        <div className="p-4 border-t border-urbana-gold/10">
          <div className="relative flex items-center gap-3 p-4 bg-gradient-to-br from-urbana-black/60 to-urbana-black/40 rounded-2xl backdrop-blur-sm border border-urbana-gold/20">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-vibrant/10 flex items-center justify-center border border-urbana-gold/30 shadow-lg shadow-urbana-gold/20">
                <User className="h-6 w-6 text-urbana-gold" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-urbana-black shadow-lg shadow-green-500/50 animate-pulse" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-urbana-light truncate">
                {cliente?.nome || 'Usuário'}
              </p>
              <p className="text-xs text-urbana-light/60 truncate mt-0.5">
                {cliente?.email || 'email@exemplo.com'}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                <span className="text-[10px] text-green-400 font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="h-1 bg-gradient-to-r from-transparent via-urbana-gold/30 to-transparent rounded-full" />
        </div>
      </nav>

      {/* Main Content - Área com scroll próprio */}
      <main 
        className="absolute z-10 overflow-y-auto overflow-x-hidden safe-left safe-right"
        style={{
          top: '72px',
          bottom: '110px',
          left: 0,
          right: 0,
        }}
      >
        {/* Desktop: ajusta para sidebar */}
        <div className="w-full h-full md:pl-64 lg:pl-72 xl:pl-80">
          <div className="w-full max-w-[1800px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Desktop: ajusta bottom do main */}
      <style>{`
        @media (min-width: 768px) {
          main {
            bottom: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PainelClienteLayout;
