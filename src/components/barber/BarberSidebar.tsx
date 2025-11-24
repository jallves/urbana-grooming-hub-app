
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
    <div className="h-full bg-gray-900/95 backdrop-blur-lg border-r border-gray-700/50 flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-700/50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-urbana-gold to-yellow-500 rounded-lg flex items-center justify-center">
            <Scissors className="h-4 w-4 text-black" />
          </div>
          <h2 className="text-sm font-bold text-white">Barbeiro</h2>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Navigation + Logout - SEM SCROLL */}
      <nav className="flex-1 px-2 py-3 space-y-1 flex flex-col">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onClose}
            end={item.exact}
            className={({ isActive }) =>
              `group flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-urbana-gold text-black shadow-lg font-medium'
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            {item.icon}
            <span className="text-sm font-medium">{item.name}</span>
          </NavLink>
        ))}
        
        {/* Logout Button logo após os itens */}
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-2 text-gray-300 hover:text-white hover:bg-red-500/20 px-3 py-2 rounded-lg"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Sair</span>
        </Button>
      </nav>
    </div>
  );
};

export default BarberSidebar;
