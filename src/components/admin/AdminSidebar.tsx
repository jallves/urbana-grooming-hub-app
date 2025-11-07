import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Users,
  Settings,
  LineChart,
  LayoutDashboard,
  ShoppingCart,
  Coins,
  Percent,
  Cake,
  Headphones,
  Scissors,
  UserCheck,
  X,
  Star,
} from 'lucide-react';

interface AdminSidebarProps {
  onClose?: () => void;
  isOpen?: boolean; // novo para mobile
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onClose, isOpen }) => {
  const menuItems = [
    { title: 'Dashboard', icon: LayoutDashboard, href: '/admin', color: 'from-blue-500 to-cyan-500' },
    { title: 'Agendamentos Clientes', icon: UserCheck, href: '/admin/agendamentos-clientes', color: 'from-purple-500 to-violet-500' },
    { title: 'Clientes', icon: Users, href: '/admin/clientes', color: 'from-orange-500 to-red-500' },
    { title: 'Funcionários', icon: UserCheck, href: '/admin/funcionarios', color: 'from-pink-500 to-rose-500' },
    { title: 'Barbeiros', icon: Scissors, href: '/admin/barbeiros', color: 'from-indigo-500 to-blue-500' },
    { title: 'Produtos', icon: ShoppingCart, href: '/admin/produtos', color: 'from-teal-500 to-cyan-500' },
    { title: 'Financeiro', icon: Coins, href: '/admin/financeiro', color: 'from-yellow-500 to-orange-500' },
    { title: 'Marketing', icon: Percent, href: '/admin/marketing', color: 'from-red-500 to-pink-500' },
    { title: 'Aniversários', icon: Cake, href: '/admin/aniversarios', color: 'from-purple-500 to-indigo-500' },
    { title: 'Suporte', icon: Headphones, href: '/admin/suporte', color: 'from-blue-500 to-purple-500' },
    { title: 'Escalas', icon: UserCheck, href: '/admin/escalas', color: 'from-green-500 to-blue-500' },
    { title: 'Fluxo de Caixa', icon: LineChart, href: '/admin/fluxo-caixa', color: 'from-cyan-500 to-blue-500' },
    { title: 'Analytics', icon: LineChart, href: '/admin/analytics', color: 'from-violet-500 to-purple-500' },
    { title: 'Configurações', icon: Settings, href: '/admin/configuracoes', color: 'from-gray-500 to-gray-600' },
  ];

  return (
    <>
      {/* Sidebar otimizada para mobile */}
      <div
        className={`
          fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50 
          transform transition-all duration-300 ease-out shadow-xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        onTouchStart={(e) => {
          const touchStart = e.touches[0].clientX;
          const handleTouchMove = (moveEvent: TouchEvent) => {
            const touchCurrent = moveEvent.touches[0].clientX;
            if (touchCurrent - touchStart < -50 && onClose) {
              onClose();
            }
          };
          const handleTouchEnd = () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
          };
          document.addEventListener('touchmove', handleTouchMove);
          document.addEventListener('touchend', handleTouchEnd);
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-urbana-gold to-yellow-500 rounded-xl flex items-center justify-center shadow-md">
              <Star className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-urbana-gold via-yellow-600 to-urbana-gold-dark bg-clip-text text-transparent font-playfair">
                Painel Admin
              </h2>
              <p className="text-xs text-gray-500 font-raleway">Costa Urbana</p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation com animações */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item, index) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onClose}
              style={{ animationDelay: `${index * 30}ms` }}
              className={({ isActive }) =>
                `group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 
                relative overflow-hidden animate-fade-in min-h-[44px] touch-manipulation
                active:scale-[0.98] ${
                  isActive
                    ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-md'
                    : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900 active:bg-gray-200'
                }`
              }
              end={item.href === '/admin'}
            >
              <div className="relative z-10 flex items-center gap-3">
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium text-sm font-raleway truncate">{item.title}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center font-raleway">
            <p className="font-semibold text-urbana-gold">Costa Urbana</p>
            <p>Sistema Administrativo</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
