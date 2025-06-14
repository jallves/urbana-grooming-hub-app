import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Calendar, 
  Home, 
  Users, 
  User, 
  Package, 
  DollarSign, 
  Settings, 
  BarChart2, 
  MessageSquare, 
  Tag, 
  Scissors, 
  UserCheck,
  Cake,
  Menu,
  X,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const AdminSidebar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: <Home className="h-5 w-5" /> },
    { name: 'Agendamentos', href: '/admin/agendamentos', icon: <Calendar className="h-5 w-5" /> },
    { name: 'Profissionais', href: '/admin/profissionais', icon: <User className="h-5 w-5" /> },
    { name: 'Barbeiros', href: '/admin/barbeiros', icon: <UserCheck className="h-5 w-5" /> },
    { name: 'Clientes', href: '/admin/clientes', icon: <Users className="h-5 w-5" /> },
    { name: 'Aniversariantes', href: '/admin/aniversariantes', icon: <Cake className="h-5 w-5" /> },
    { name: 'Produtos e Serviços', href: '/admin/produtos', icon: <Package className="h-5 w-5" /> },
    { name: 'Financeiro', href: '/admin/financeiro', icon: <DollarSign className="h-5 w-5" /> },
    { name: 'Fluxo de Caixa', href: '/admin/fluxo-caixa', icon: <TrendingUp className="h-5 w-5" /> },
    { name: 'Marketing', href: '/admin/marketing', icon: <Tag className="h-5 w-5" /> },
    { name: 'Relatórios', href: '/admin/relatorios', icon: <BarChart2 className="h-5 w-5" /> },
    { name: 'Suporte', href: '/admin/suporte', icon: <MessageSquare className="h-5 w-5" /> },
    { name: 'Configurações', href: '/admin/configuracoes', icon: <Settings className="h-5 w-5" /> }
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
            className="bg-urbana-black/90 text-urbana-gold hover:bg-urbana-gold hover:text-urbana-black"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* Mobile Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-urbana-black transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex items-center justify-between p-4 border-b border-urbana-gold/20">
            <div className="flex items-center">
              <Scissors className="h-6 w-6 text-urbana-gold mr-2" />
              <h2 className="text-xl font-semibold text-urbana-gold">Admin</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-urbana-gold hover:bg-urbana-gold hover:text-urbana-black"
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
                      ? 'bg-urbana-gold text-urbana-black'
                      : 'hover:bg-urbana-gray/20 text-white'
                  }`
                }
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
    <div className="h-full px-3 py-4 overflow-y-auto bg-urbana-black border-r border-urbana-black">
      <div className="mb-6 px-2 flex items-center">
        <Scissors className="h-6 w-6 text-urbana-gold mr-2" />
        <h2 className="text-xl font-semibold text-urbana-gold">Admin</h2>
      </div>
      <ul className="space-y-2 px-2">
        {navItems.map((item) => (
          <li key={item.name}>
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                `flex items-center p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-urbana-gold text-urbana-black'
                    : 'hover:bg-urbana-gray/20 text-white'
                }`
              }
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

export default AdminSidebar;
