
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, Settings, BarChart2, Scissors, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BarberSidebarProps {
  onClose?: () => void;
}

const BarberSidebar: React.FC<BarberSidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
      navigate('/barbeiro/login');
      if (onClose) onClose();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar fazer logout",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { 
      name: 'Dashboard', 
      href: '/barbeiro', 
      icon: <BarChart2 className="h-5 w-5" />,
      exact: true
    },
    { 
      name: 'Agendamentos', 
      href: '/barbeiro/agendamentos', 
      icon: <Calendar className="h-5 w-5" />
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
    <div className="h-full bg-gray-900/95 backdrop-blur-lg border-r border-gray-700/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-gray-700/50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-urbana-gold to-yellow-500 rounded-lg flex items-center justify-center shadow-lg">
            <Scissors className="h-6 w-6 text-black" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
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
            className="text-gray-400 lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3 lg:p-4 space-y-1.5 lg:space-y-2 overflow-y-auto min-h-0">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onClose}
            end={item.exact}
            className={({ isActive }) =>
              `group flex items-center gap-3 p-3 lg:p-4 rounded-xl transition-all duration-200 relative overflow-hidden ${
                isActive
                  ? 'bg-urbana-gold text-black shadow-lg font-medium'
                  : 'text-gray-300'
              }`
            }
          >
            <div className="relative z-10 flex items-center gap-3">
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 lg:p-4 border-t border-gray-700/50 space-y-2 lg:space-y-3 flex-shrink-0">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-red-500/20 h-auto py-2.5 lg:py-3"
        >
          <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
          <span className="font-medium text-sm lg:text-base">Sair</span>
        </Button>
        
        <div className="text-xs text-gray-500 text-center">
          <p className="font-medium text-gray-400">Costa Urbana Barbearia</p>
          <p className="hidden lg:block">Sistema Profissional</p>
        </div>
      </div>
    </div>
  );
};

export default BarberSidebar;
