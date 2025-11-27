import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  DollarSign,
  LogOut,
  Home,
  Clock,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import barbershopBg from '@/assets/barbershop-background.jpg';
import costaUrbanaLogo from '@/assets/logo-costa-urbana.png';
import { Button } from '@/components/ui/button';

const BarberLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { 
      name: 'Início', 
      path: '/barbeiro/dashboard', 
      icon: Home 
    },
    { 
      name: 'Agenda', 
      path: '/barbeiro/agendamentos', 
      icon: Calendar 
    },
    { 
      name: 'Horários', 
      path: '/barbeiro/horarios', 
      icon: Clock 
    },
    { 
      name: 'Comissões', 
      path: '/barbeiro/comissoes', 
      icon: DollarSign 
    },
  ];

  return (
    <div className="min-h-screen w-screen overflow-x-hidden relative font-poppins" style={{ background: 'transparent', maxWidth: '100vw' }}>
      {/* 
        ⚠️ ATENÇÃO CRÍTICA - NÃO REMOVER ⚠️
        Background fixo da barbearia - ESSENCIAL para o design do painel
        Este fundo DEVE estar sempre presente em todas as páginas do painel do barbeiro
        NUNCA altere ou remova esta estrutura sem consulta prévia
      */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ width: '100vw', height: '100vh', background: 'transparent' }}>
        <img 
          src={barbershopBg} 
          alt="Barbearia Costa Urbana Background" 
          className="w-full h-full object-cover"
          style={{ width: '100vw', height: '100vh', maxWidth: 'none' }}
          onLoad={() => console.log('✅ Background do barbeiro carregado com sucesso')}
          onError={(e) => {
            console.error('❌ Erro ao carregar background da barbearia');
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Dark overlay - Garante contraste e legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Modern Header - FIXO */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-urbana-black/90 border-b border-urbana-gold/20 shadow-2xl" style={{ width: '100vw', paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="w-full px-4 md:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="relative">
                <div className="relative p-1.5 bg-urbana-black/30 backdrop-blur-sm rounded-xl border border-urbana-gold/20">
                  <img 
                    src={costaUrbanaLogo} 
                    alt="Costa Urbana" 
                    className="h-10 w-10 md:h-12 md:w-12 object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-base md:text-xl font-bold text-urbana-light drop-shadow-lg">
                  Barbearia Costa Urbana
                </h1>
                <p className="text-xs text-urbana-light/70 hidden sm:block">Painel do Barbeiro</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden md:block">
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
              
              <div className="hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-urbana-light hover:text-red-400 hover:bg-red-500/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 border border-transparent hover:border-red-500/20"
                >
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Overlay - Animado */}
      <div 
        className={`fixed inset-0 z-[60] md:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen 
            ? 'bg-black/70 backdrop-blur-sm pointer-events-auto' 
            : 'bg-black/0 backdrop-blur-none pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)} 
      />

      {/* Desktop Sidebar - Premium Design FIXO */}
      <nav className="hidden md:flex fixed left-0 top-[72px] bottom-0 z-40 w-56 lg:w-60 backdrop-blur-2xl bg-gradient-to-b from-urbana-black/95 via-urbana-black/90 to-urbana-black/95 border-r border-urbana-gold/20 shadow-2xl flex-col overflow-y-auto">
        {/* Navigation Header */}
        <div className="px-3 py-4 border-b border-urbana-gold/10">
          <div className="relative">
            <h2 className="text-sm font-semibold text-urbana-light">Navegação</h2>
            <p className="text-[10px] text-urbana-light/60 mt-0.5">Acesse suas funcionalidades</p>
          </div>
        </div>

        {/* Navigation Items - Premium Cards */}
        <div className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
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
                    relative w-full flex items-center gap-3 justify-start
                    p-2.5 rounded-xl transition-colors duration-200
                    border backdrop-blur-sm
                    ${isActive 
                      ? 'bg-gradient-to-r from-urbana-gold/20 to-urbana-gold-vibrant/10 text-urbana-gold border-urbana-gold/40' 
                      : 'text-urbana-light/70 hover:text-urbana-gold hover:bg-urbana-gold/5 border-transparent hover:border-urbana-gold/20'
                    }
                  `}
                >
                  {/* Icon Container with gradient background */}
                  <div className={`
                    relative flex items-center justify-center
                    w-8 h-8 rounded-lg
                    transition-colors duration-200
                    ${isActive 
                      ? 'bg-gradient-to-br from-urbana-gold/30 to-urbana-gold-vibrant/20' 
                      : 'bg-urbana-black/40'
                    }
                  `}>
                    <Icon className={`
                      h-4 w-4 transition-colors duration-200
                      ${isActive ? 'text-urbana-gold' : 'text-urbana-light/70'}
                    `} />
                  </div>
                  
                  {/* Label with description */}
                  <div className="flex-1 text-left">
                    <span className={`
                      block text-xs font-semibold transition-colors duration-200
                      ${isActive ? 'text-urbana-gold' : 'text-urbana-light'}
                    `}>
                      {item.name}
                    </span>
                    <span className={`
                      block text-[10px] transition-colors duration-200 mt-0.5
                      ${isActive ? 'text-urbana-gold/70' : 'text-urbana-light/50'}
                    `}>
                      {item.name === 'Início' && 'Visão geral'}
                      {item.name === 'Agenda' && 'Seus agendamentos'}
                      {item.name === 'Horários' && 'Disponibilidade'}
                      {item.name === 'Comissões' && 'Seus ganhos'}
                    </span>
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <div className="w-1.5 h-1.5 rounded-full bg-urbana-gold" />
                    </div>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Divider with gold accent */}
        <div className="px-2 py-1.5">
          <div className="h-px bg-gradient-to-r from-transparent via-urbana-gold/30 to-transparent" />
        </div>
        
        {/* Desktop User Info + Logout - Premium Card */}
        <div className="p-2 border-t border-urbana-gold/10 space-y-2">
          <div className="relative">
            <div className="relative flex items-center gap-2 p-2.5 bg-gradient-to-br from-urbana-black/60 to-urbana-black/40 rounded-xl backdrop-blur-sm border border-urbana-gold/20">
              {/* Avatar/Icon */}
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-vibrant/10 flex items-center justify-center border border-urbana-gold/30 shadow-lg shadow-urbana-gold/20">
                  <span className="text-urbana-gold font-bold text-xs">
                    {(user?.user_metadata?.name?.charAt(0) || 'B').toUpperCase()}
                  </span>
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-urbana-black shadow-lg shadow-green-500/50 animate-pulse" />
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-urbana-light truncate">
                  {user?.user_metadata?.name?.split(' ')[0] || 'Barbeiro'}
                </p>
                <p className="text-[10px] text-urbana-light/60 truncate">
                  {user?.email || 'email@exemplo.com'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1 h-1 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                  <span className="text-[9px] text-green-400 font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botão Sair */}
          <Button
            variant="outline"
            onClick={signOut}
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 transition-all py-2 h-auto group flex items-center justify-center gap-2"
          >
            <LogOut className="h-3 w-3 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Sair</span>
          </Button>
        </div>

        {/* Footer decorative element */}
        <div className="px-3 pb-2">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-urbana-gold/30 to-transparent rounded-full" />
        </div>
      </nav>

      {/* Enhanced Mobile Navigation - FIXO */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 w-full backdrop-blur-2xl bg-urbana-black/90 border-t border-urbana-gold/20 shadow-2xl">
        <div className="w-full px-1 md:px-4">
          {/* Mobile Tab Navigation */}
          <div className="grid grid-cols-4 gap-1 py-2 sm:py-3 pb-safe">
            {navigationItems.map((item) => {
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
                        {item.name}
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

      {/* Mobile Sidebar - Lado Esquerdo - ALTURA FIXA */}
      <div className={`
        fixed top-0 left-0 z-[70] h-screen w-[75vw] max-w-[300px] 
        bg-gradient-to-br from-urbana-black via-urbana-black to-urbana-black/95
        transform transition-all duration-300 ease-out md:hidden 
        border-r border-urbana-gold/30 shadow-2xl flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
      `}>
        {/* Header do Menu */}
        <div className="flex-shrink-0 p-5 border-b border-urbana-gold/30 bg-urbana-black/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-urbana-gold/10 rounded-lg border border-urbana-gold/20">
              <Menu className="h-5 w-5 text-urbana-gold" />
            </div>
            <div>
              <h2 className="text-base font-bold text-urbana-gold">Menu</h2>
              <p className="text-xs text-urbana-light/60">Navegação</p>
            </div>
          </div>
        </div>

        {/* Navegação Principal - COM SCROLL */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  group flex items-center space-x-3 py-3.5 px-4 rounded-xl 
                  transition-all duration-200 relative overflow-hidden w-full
                  ${isActive 
                    ? 'bg-urbana-gold/20 text-urbana-gold shadow-lg shadow-urbana-gold/10' 
                    : 'text-urbana-light/80 hover:text-urbana-gold hover:bg-urbana-gold/10 active:scale-95'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-urbana-gold rounded-r-full" />
                )}
                <Icon className={`h-5 w-5 transition-transform duration-200 ${!isActive && 'group-hover:scale-110'}`} />
                <span className="text-sm font-semibold">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer do Menu - FIXO NO FUNDO */}
        <div className="flex-shrink-0 border-t border-urbana-gold/20 p-4 space-y-3 bg-gradient-to-t from-urbana-black/80 to-transparent">
          {/* User Info */}
          <div className="flex items-center gap-3 px-4 py-3 bg-urbana-gold/5 rounded-xl border border-urbana-gold/20">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-urbana-gold/20 border-2 border-urbana-gold/40 flex items-center justify-center">
                <span className="text-urbana-gold font-bold text-sm">
                  {(user?.user_metadata?.name?.charAt(0) || 'B').toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-urbana-light truncate">
                {user?.user_metadata?.name?.split(' ')[0] || 'Barbeiro'}
              </p>
              <p className="text-xs text-urbana-light/50">Online</p>
            </div>
          </div>

          {/* Botão Sair */}
          <Button
            variant="outline"
            onClick={() => {
              signOut();
              setIsMobileMenuOpen(false);
            }}
            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500 transition-all py-3 h-auto group"
          >
            <LogOut className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold">Sair</span>
          </Button>
        </div>
      </div>

      {/* Main Content - Com espaçamento para header, footer e sidebar */}
      <main className="relative z-10 w-full pt-20 md:pt-[72px] pb-[80px] md:pb-6 md:pl-56 lg:pl-60 px-3 md:px-4 transition-all duration-300" style={{ minHeight: '100vh', maxWidth: '100vw', overflowX: 'hidden' }}>
        <div className="w-full max-w-[1200px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default BarberLayout;
