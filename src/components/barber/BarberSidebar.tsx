
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Users, DollarSign, Settings, BarChart2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BarberSidebar: React.FC = () => {
  const { user } = useAuth();
  
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

  return (
    <div className="h-full px-3 py-4 overflow-y-auto bg-urbana-black border-r border-urbana-black">
      <div className="mb-6 px-2 flex items-center">
        <h2 className="text-xl font-semibold text-urbana-gold">Painel do Barbeiro</h2>
      </div>
      
      <ul className="space-y-2 px-2">
        {navItems.map((item) => (
          <li key={item.name}>
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                `flex items-center p-2 rounded-lg ${
                  isActive
                    ? 'bg-urbana-gold text-urbana-black'
                    : 'hover:bg-urbana-gray/20 text-white'
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
