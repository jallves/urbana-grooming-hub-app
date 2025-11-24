
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
    await logout();
    navigate('/painel-cliente/login');
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
                  className="text-urbana-light hover:text-red-400 hover:bg-red-500/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 border border-transparent hover:border-red-500/20"
                >
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Mobile Navigation - FIXO */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 w-full backdrop-blur-2xl bg-urbana-black/90 border-t border-urbana-gold/20 shadow-2xl">
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

      {/* Main Content - Com espaçamento para header e footer fixos */}
      <main className="relative z-10 w-full pt-[72px] sm:pt-[80px] pb-[100px] lg:pb-8">
        <Outlet />
      </main>
    </div>
  );
};

export default PainelClienteLayout;
