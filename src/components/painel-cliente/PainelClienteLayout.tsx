
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, User, Calendar, Home, Bell, Clock } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import barbershopBg from '@/assets/barbershop-background.jpg';
import costaUrbanaLogo from '@/assets/logo-costa-urbana.png';

const PainelClienteLayout: React.FC = () => {
  const { cliente, logout } = usePainelClienteAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Log para debug - garante que este layout está sendo usado
  React.useEffect(() => {
    console.log('✅ PainelClienteLayout carregado com background da barbearia');
    
    // Verificação de segurança - garante que o background está presente
    const verificarBackground = () => {
      const bgElement = document.querySelector('img[alt="Barbearia Costa Urbana Background"]');
      if (!bgElement) {
        console.error('❌ ERRO CRÍTICO: Background da barbearia não encontrado!');
        console.error('O layout pode estar incorreto. Verifique PainelClienteLayout.tsx');
      } else {
        console.log('✅ Background da barbearia verificado e carregado corretamente');
      }
    };
    
    // Verifica após um pequeno delay para garantir renderização
    setTimeout(verificarBackground, 500);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      console.log('🚪 [Layout] Iniciando processo de logout...');
      
      await logout();
      
      console.log('✅ [Layout] Logout concluído, navegando para login...');
      navigate('/painel-cliente/login', { replace: true });
    } catch (error) {
      console.error('❌ [Layout] Erro no logout:', error);
      // Mesmo com erro, redirecionar para login
      navigate('/painel-cliente/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navigationItems = [
    { path: '/painel-cliente/dashboard', icon: Home, label: 'Home', color: 'from-blue-500 to-cyan-500' },
    { path: '/painel-cliente/agendar', icon: Calendar, label: 'Agendar', color: 'from-green-500 to-emerald-500' },
    { path: '/painel-cliente/agendamentos', icon: Clock, label: 'Histórico', color: 'from-purple-500 to-pink-500' },
    { path: '/painel-cliente/perfil', icon: User, label: 'Perfil', color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden relative font-poppins">
      {/* 
        ⚠️ ATENÇÃO CRÍTICA - NÃO REMOVER ⚠️
        Background fixo da barbearia - ESSENCIAL para o design do painel
        Este fundo DEVE estar sempre presente em todas as páginas do painel do cliente
        NUNCA altere ou remova esta estrutura sem consulta prévia
      */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src={barbershopBg} 
          alt="Barbearia Costa Urbana Background" 
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('❌ Erro ao carregar background da barbearia');
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Dark overlay - Garante contraste e legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Modern Header - FIXO */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-2xl bg-urbana-black/90 border-b border-urbana-gold/20 shadow-2xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="w-full px-2 md:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2 sm:gap-3 md:gap-4"
            >
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
                  {cliente?.nome?.split(' ')[0]}
                </span>
              </div>
              
              <div>
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
        </div>
      </header>

      {/* Enhanced Mobile Navigation - FIXO */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 w-full backdrop-blur-2xl bg-urbana-black/90 border-t border-urbana-gold/20 shadow-2xl">
        <div className="w-full px-1 md:px-4">
          {/* Mobile Tab Navigation */}
          <div className="grid grid-cols-4 gap-1 py-2 sm:py-3 pb-safe">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <div
                  key={item.path}
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
                    {/* Active background glow */}
                    {isActive && (
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-urbana-gold/10 to-urbana-gold/5 rounded-xl sm:rounded-2xl"
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
                      <div
                        className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-urbana-gold rounded-full"
                      />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Navigation Sidebar - Premium Design */}
      <nav className="hidden md:flex fixed left-0 top-[72px] bottom-0 z-40 w-64 lg:w-72 xl:w-80 backdrop-blur-2xl bg-gradient-to-b from-urbana-black/95 via-urbana-black/90 to-urbana-black/95 border-r border-urbana-gold/20 shadow-2xl flex-col overflow-y-auto">
        {/* Navigation Header */}
        <div className="px-4 py-6 border-b border-urbana-gold/10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-urbana-gold/5 to-transparent rounded-xl blur-xl" />
            <h2 className="text-lg font-semibold text-urbana-light relative z-10">Navegação</h2>
            <p className="text-xs text-urbana-light/60 mt-1 relative z-10">Acesse suas funcionalidades</p>
          </div>
        </div>

        {/* Navigation Items - Premium Cards */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <div
                key={item.path}
                className="relative group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Glow effect for active item */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-urbana-gold/20 to-urbana-gold-vibrant/20 rounded-2xl blur-xl animate-pulse" />
                )}
                
                <Button
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                  className={`
                    relative w-full flex items-center gap-4 justify-start
                    p-4 lg:p-5 rounded-2xl transition-all duration-500
                    border backdrop-blur-sm
                    ${isActive 
                      ? 'bg-gradient-to-r from-urbana-gold/20 to-urbana-gold-vibrant/10 text-urbana-gold shadow-2xl shadow-urbana-gold/30 border-urbana-gold/40 scale-[1.02]' 
                      : 'text-urbana-light/70 hover:text-urbana-gold hover:bg-urbana-gold/5 border-transparent hover:border-urbana-gold/20 hover:shadow-lg hover:shadow-urbana-gold/10 hover:scale-[1.01]'
                    }
                  `}
                >
                  {/* Icon Container with gradient background */}
                  <div className={`
                    relative flex items-center justify-center
                    w-11 h-11 lg:w-12 lg:h-12 rounded-xl
                    transition-all duration-500
                    ${isActive 
                      ? 'bg-gradient-to-br from-urbana-gold/30 to-urbana-gold-vibrant/20 shadow-lg shadow-urbana-gold/30' 
                      : 'bg-urbana-black/40 group-hover:bg-urbana-gold/10 group-hover:shadow-md group-hover:shadow-urbana-gold/20'
                    }
                  `}>
                    <Icon className={`
                      h-5 w-5 lg:h-6 lg:w-6 transition-all duration-300
                      ${isActive ? 'text-urbana-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' : 'text-urbana-light/70 group-hover:text-urbana-gold'}
                    `} />
                    
                    {/* Active pulse ring */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl border-2 border-urbana-gold/30 animate-ping" />
                    )}
                  </div>
                  
                  {/* Label with description */}
                  <div className="flex-1 text-left">
                    <span className={`
                      block text-sm lg:text-base font-semibold transition-colors duration-300
                      ${isActive ? 'text-urbana-gold' : 'text-urbana-light group-hover:text-urbana-gold'}
                    `}>
                      {item.label}
                    </span>
                    <span className={`
                      block text-xs transition-colors duration-300 mt-0.5
                      ${isActive ? 'text-urbana-gold/70' : 'text-urbana-light/50 group-hover:text-urbana-gold/60'}
                    `}>
                      {item.label === 'Home' && 'Visão geral'}
                      {item.label === 'Agendar' && 'Novo horário'}
                      {item.label === 'Histórico' && 'Seus agendamentos'}
                      {item.label === 'Perfil' && 'Suas informações'}
                    </span>
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-2 h-2 rounded-full bg-urbana-gold shadow-lg shadow-urbana-gold/50 animate-pulse" />
                    </div>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Divider with gold accent */}
        <div className="px-4 py-3">
          <div className="h-px bg-gradient-to-r from-transparent via-urbana-gold/30 to-transparent" />
        </div>
        
        {/* Desktop User Info - Premium Card */}
        <div className="p-4 border-t border-urbana-gold/10">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-urbana-gold/10 to-urbana-gold-vibrant/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex items-center gap-3 p-4 bg-gradient-to-br from-urbana-black/60 to-urbana-black/40 rounded-2xl backdrop-blur-sm border border-urbana-gold/20 hover:border-urbana-gold/40 transition-all duration-300 hover:shadow-lg hover:shadow-urbana-gold/10">
              {/* Avatar/Icon */}
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-vibrant/10 flex items-center justify-center border border-urbana-gold/30 shadow-lg shadow-urbana-gold/20">
                  <User className="h-6 w-6 text-urbana-gold" />
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-urbana-black shadow-lg shadow-green-500/50 animate-pulse" />
              </div>
              
              {/* User Info */}
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
        </div>

        {/* Footer decorative element */}
        <div className="px-4 pb-4">
          <div className="h-1 bg-gradient-to-r from-transparent via-urbana-gold/30 to-transparent rounded-full" />
        </div>
      </nav>

      {/* Main Content - Com espaçamento para header, footer e sidebar */}
      <main className="relative z-10 w-full pt-[72px] sm:pt-[80px] pb-[120px] md:pb-12 md:pl-64 lg:pl-72 xl:pl-80 px-4 md:px-6 lg:px-8 transition-all duration-300">
        <div className="w-full max-w-[1800px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PainelClienteLayout;
