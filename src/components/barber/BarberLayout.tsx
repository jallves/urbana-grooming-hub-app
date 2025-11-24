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
    <div className="min-h-screen w-full overflow-x-hidden relative font-poppins">
      {/* Background fixo da barbearia */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src={barbershopBg} 
          alt="Barbearia Costa Urbana Background" 
          className="w-full h-full object-cover"
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
                    alt="Costa Urbana" 
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
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300"
                >
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/80 md:hidden backdrop-blur-sm" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-[70] w-[280px] bg-urbana-black transform transition-transform duration-300 ease-in-out md:hidden border-l border-urbana-gold/30 shadow-2xl ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-urbana-gold/30">
          <h2 className="text-lg font-semibold text-urbana-gold">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-urbana-gold hover:bg-urbana-gold/20 hover:text-urbana-gold"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex flex-col p-4 h-full overflow-y-auto">
          <div className="flex flex-col space-y-2 flex-1">
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
                    flex items-center space-x-3 py-3 px-4 rounded-xl transition-all duration-300
                    ${isActive 
                      ? 'bg-urbana-gold/20 text-urbana-gold border border-urbana-gold/30' 
                      : 'text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-base font-medium">{item.name}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-urbana-gold/30 pt-4 mt-4 space-y-3">
            <div className="flex items-center gap-3 px-4 py-2 bg-urbana-black/50 rounded-xl border border-urbana-gold/20">
              <div className="w-2 h-2 bg-urbana-gold rounded-full animate-pulse" />
              <span className="text-sm text-urbana-light font-medium">
                {user?.user_metadata?.name?.split(' ')[0] || 'Barbeiro'}
              </span>
            </div>

            <Button
              variant="ghost"
              className="w-full justify-start text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10 py-3 h-auto"
            >
              <Bell className="h-5 w-5 mr-3" />
              <span className="text-base font-medium">Notificações</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                signOut();
                setIsMobileMenuOpen(false);
              }}
              className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500 transition-all py-3 h-auto"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span className="text-base font-medium">Sair</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Com espaçamento apenas para header fixo */}
      <main className="relative z-10 w-full pt-[72px] sm:pt-[80px] pb-8">
        <Outlet />
      </main>
    </div>
  );
};

export default BarberLayout;
