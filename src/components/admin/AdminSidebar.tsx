
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Scissors, 
  Package, 
  DollarSign, 
  Percent, 
  Cake, 
  Headphones, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  Settings,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  onClose?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { 
      title: 'Clientes', 
      path: '/admin/clientes', 
      icon: Users,
      description: 'Gerenciar base de clientes'
    },
    { 
      title: 'Funcionários', 
      path: '/admin/funcionarios', 
      icon: UserCheck,
      description: 'Administrar equipe'
    },
    { 
      title: 'Barbeiros', 
      path: '/admin/barbeiros', 
      icon: Scissors,
      description: 'Gestão de barbeiros'
    },
    { 
      title: 'Produtos', 
      path: '/admin/produtos', 
      icon: Package,
      description: 'Catálogo e estoque'
    },
    { 
      title: 'Financeiro', 
      path: '/admin/financeiro', 
      icon: DollarSign,
      description: 'Controle financeiro'
    },
    { 
      title: 'Marketing', 
      path: '/admin/marketing', 
      icon: Percent,
      description: 'Campanhas e cupons'
    },
    { 
      title: 'Aniversários', 
      path: '/admin/aniversarios', 
      icon: Cake,
      description: 'Datas especiais'
    },
    { 
      title: 'Suporte', 
      path: '/admin/suporte', 
      icon: Headphones,
      description: 'Atendimento ao cliente'
    },
    { 
      title: 'Escalas', 
      path: '/admin/escalas', 
      icon: Calendar,
      description: 'Horários da equipe'
    },
    { 
      title: 'Fluxo de Caixa', 
      path: '/admin/fluxo-caixa', 
      icon: TrendingUp,
      description: 'Entradas e saídas'
    },
    { 
      title: 'Analytics', 
      path: '/admin/analytics', 
      icon: BarChart3,
      description: 'Relatórios e métricas'
    },
    { 
      title: 'Configurações', 
      path: '/admin/configuracoes', 
      icon: Settings,
      description: 'Ajustes do sistema'
    }
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="h-full bg-black border-r border-gray-800 flex flex-col">
      {/* Header com logo e botão de fechar para mobile */}
      <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-urbana-gold to-yellow-500 rounded-full flex items-center justify-center">
            <Scissors className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-urbana-gold font-playfair">
              Urbana
            </h2>
            <p className="text-xs text-gray-400 hidden sm:block">Barbearia</p>
          </div>
        </div>
        
        {/* Botão de fechar para mobile */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10 h-6 w-6 sm:h-8 sm:w-8 lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Menu de navegação - otimizado para mobile */}
      <nav className="flex-1 overflow-auto p-2 sm:p-3 lg:p-4">
        <div className="space-y-1 sm:space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => handleItemClick(item.path)}
                className={`
                  w-full flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg text-left transition-all duration-200
                  ${active 
                    ? 'bg-gradient-to-r from-urbana-gold/20 to-yellow-500/20 border border-urbana-gold/30 text-black font-semibold' 
                    : 'text-black hover:bg-white/10 hover:text-urbana-gold'
                  }
                `}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${active ? 'text-urbana-gold' : 'text-black'}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-xs sm:text-sm lg:text-base font-medium truncate ${active ? 'text-black' : 'text-black'}`}>
                    {item.title}
                  </div>
                  <div className={`text-xs text-gray-600 truncate hidden sm:block ${active ? 'text-gray-700' : 'text-gray-600'}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer com informações do usuário - compacto para mobile */}
      <div className="p-2 sm:p-3 lg:p-4 border-t border-gray-800">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-urbana-gold to-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-xs sm:text-sm font-bold text-black">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-black truncate">Admin</p>
            <p className="text-xs text-gray-600 truncate">Administrador</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
