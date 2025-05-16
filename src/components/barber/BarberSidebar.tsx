
import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Calendar, Users, Scissors, ChartBar, Lock, Settings, Shield, DollarSign, LayoutDashboard } from 'lucide-react';
import { useModuleAccess } from '@/components/admin/staff/hooks/useModuleAccess';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const BarberSidebar: React.FC = () => {
  const { moduleAccess, loading } = useModuleAccess();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    console.log("BarberSidebar - Module access:", moduleAccess);
  }, [moduleAccess]);
  
  const navItems = [
    { 
      name: 'Dashboard', 
      href: '/barbeiro/dashboard', 
      icon: <Home className="h-5 w-5" />,
      moduleId: null // Always accessible
    },
    { 
      name: 'Agendamentos',
      href: '/barbeiro/agendamentos', 
      icon: <Calendar className="h-5 w-5" />,
      moduleId: 'appointments'
    },
    { 
      name: 'Clientes', 
      href: '/barbeiro/clientes', 
      icon: <Users className="h-5 w-5" />,
      moduleId: 'clients'
    },
    { 
      name: 'Serviços', 
      href: '/barbeiro/servicos', 
      icon: <Scissors className="h-5 w-5" />,
      moduleId: 'services'
    },
    { 
      name: 'Comissões', 
      href: '/barbeiro/comissoes', 
      icon: <DollarSign className="h-5 w-5" />,
      moduleId: 'reports'
    },
    {
      name: 'Permissões', 
      href: '/barbeiro/modulos', 
      icon: <Shield className="h-5 w-5" />,
      moduleId: null // Always accessible to show their permissions
    },
    { 
      name: 'Perfil', 
      href: '/barbeiro/perfil', 
      icon: <Settings className="h-5 w-5" />,
      moduleId: null // Always accessible
    },
    // Adicionado o link para o Painel Admin para todos os barbeiros
    {
      name: 'Painel Admin',
      href: '/admin',
      icon: <LayoutDashboard className="h-5 w-5" />,
      moduleId: null // Sempre disponível para todos os barbeiros
    }
  ];

  // Filter items based on module access or if they require no specific access
  const filteredNavItems = navItems.filter(item => 
    item.moduleId === null || moduleAccess?.includes(item.moduleId)
  );

  if (loading) {
    return (
      <div className="h-full w-64 px-3 py-4 overflow-y-auto bg-urbana-black border-r border-urbana-black flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-urbana-gold"></div>
      </div>
    );
  }

  return (
    <div className="h-full px-3 py-4 overflow-y-auto bg-urbana-black border-r border-urbana-black">
      <div className="mb-6 px-2 flex items-center">
        <Scissors className="h-6 w-6 text-urbana-gold mr-2" />
        <h2 className="text-xl font-semibold text-urbana-gold">Barbeiro</h2>
      </div>
      
      <ul className="space-y-2 px-2">
        {filteredNavItems.map((item) => (
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
              onClick={(e) => {
                if (item.moduleId && !moduleAccess?.includes(item.moduleId)) {
                  e.preventDefault();
                  toast({
                    title: "Acesso restrito",
                    description: "Você não tem permissão para acessar este módulo",
                    variant: "destructive"
                  });
                }
              }}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
              {item.moduleId && !moduleAccess?.includes(item.moduleId) && (
                <Lock className="ml-auto h-3 w-3 opacity-50" />
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BarberSidebar;
