
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Users, DollarSign, Settings, BarChart2, Scissors, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BarberSidebarProps {
  onClose?: () => void;
}

const BarberSidebar: React.FC<BarberSidebarProps> = ({ onClose }) => {
  const navItems = [
    { 
      name: 'Dashboard', 
      href: '/barbeiro', 
      icon: <BarChart2 className="h-5 w-5" />,
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      name: 'Agendamentos', 
      href: '/barbeiro/agendamentos', 
      icon: <Calendar className="h-5 w-5" />,
      color: 'from-green-500 to-emerald-500'
    },
    { 
      name: 'Minha Agenda', 
      href: '/barbeiro/agenda', 
      icon: <Clock className="h-5 w-5" />,
      color: 'from-purple-500 to-violet-500'
    },
    { 
      name: 'Clientes', 
      href: '/barbeiro/clientes', 
      icon: <Users className="h-5 w-5" />,
      color: 'from-orange-500 to-red-500'
    },
    { 
      name: 'Comissões', 
      href: '/barbeiro/comissoes', 
      icon: <DollarSign className="h-5 w-5" />,
      color: 'from-yellow-500 to-orange-500'
    },
    { 
      name: 'Perfil', 
      href: '/barbeiro/perfil', 
      icon: <Settings className="h-5 w-5" />,
      color: 'from-gray-500 to-gray-600'
    }
  ];

  return (
    <div className="h-full bg-black/40 backdrop-blur-lg border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Scissors className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Barbeiro
            </h2>
            <p className="text-xs text-gray-400">Painel Profissional</p>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg scale-105'
                  : 'hover:bg-white/10 text-gray-300 hover:text-white hover:scale-105'
              }`
            }
            end={item.href === '/barbeiro'}
          >
            <div className="relative z-10 flex items-center gap-3">
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </div>
            
            {/* Hover effect background */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-gray-500 text-center">
          <p>Urbana Barbearia</p>
          <p>Sistema Profissional</p>
        </div>
      </div>
    </div>
  );
};

export default BarberSidebar;
