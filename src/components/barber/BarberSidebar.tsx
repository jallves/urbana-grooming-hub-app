
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Users, DollarSign, Settings, BarChart2, Menu, X, Scissors, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const BarberSidebar: React.FC = () => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const navItems = [
    { 
      name: 'Dashboard', 
      href: '/barbeiro', 
      icon: <BarChart2 className="h-5 w-5" />
    },
    { 
      name: 'Agendamentos', 
      href: '/barbeiro/agendamentos', 
      icon: <Calendar className="h-5 w-5" />
    },
    { 
      name: 'Minha Agenda', 
      href: '/barbeiro/agenda', 
      icon: <Clock className="h-5 w-5" />
    },
    { 
      name: 'Clientes', 
      href: '/barbeiro/clientes', 
      icon: <Users className="h-5 w-5" />
    },
    { 
      name: 'Comissões', 
      href: '/barbeiro/comissoes', 
      icon: <DollarSign className="h-5 w-5" />
    },
    { 
      name: 'Perfil', 
      href: '/barbeiro/perfil', 
      icon: <Settings className="h-5 w-5" />
    }
  ];

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <div className="fixed top-0 left-0 z-50 p-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="bg-black/90 text-urbana-gold hover:bg-urbana-gold hover:text-black border border-gray-700"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* Mobile Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-black border-r border-gray-700 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center">
              <Scissors className="h-6 w-6 text-urbana-gold mr-2" />
              <h2 className="text-lg font-semibold text-urbana-gold">Barbeiro</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-urbana-gold hover:bg-gray-800"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="px-4 py-6 space-y-2 overflow-y-auto h-full">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg transition-colors text-sm ${
                    isActive
                      ? 'bg-urbana-gold text-black'
                      : 'hover:bg-gray-800 text-white'
                  }`
                }
                end={item.href === '/barbeiro'}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <div className="h-full px-3 py-4 overflow-y-auto bg-black border-r border-gray-700">
      <div className="mb-6 px-2 flex items-center">
        <Scissors className="h-6 w-6 text-urbana-gold mr-2" />
        <h2 className="text-xl font-semibold text-urbana-gold">Painel do Barbeiro</h2>
      </div>
      
      <ul className="space-y-2 px-2">
        {navItems.map((item) => (
          <li key={item.name}>
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                `flex items-center p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-urbana-gold text-black'
                    : 'hover:bg-gray-800 text-white'
                }`
              }
              end={item.href === '/barbeiro'}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BarberSidebar;
