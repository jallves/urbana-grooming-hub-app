import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Users,
  Settings,
  LayoutDashboard,
  ShoppingCart,
  Cake,
  Scissors,
  UserCheck,
  X,
  Star,
  Globe,
  AlertCircle,
} from 'lucide-react';
import beltecLogo from '@/assets/beltec-logo.png';

interface AdminSidebarProps {
  onClose?: () => void;
  isOpen?: boolean; // novo para mobile
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onClose, isOpen }) => {
  const menuItems = [
    { title: 'Dashboard', icon: LayoutDashboard, href: '/admin', color: 'from-blue-500 to-cyan-500' },
    { title: 'Agendamentos Clientes', icon: UserCheck, href: '/admin/agendamentos-clientes', color: 'from-purple-500 to-violet-500' },
    { title: 'Checkouts Pendentes', icon: AlertCircle, href: '/admin/checkouts-pendentes', color: 'from-orange-500 to-yellow-500' },
    { title: 'Clientes', icon: Users, href: '/admin/clientes', color: 'from-orange-500 to-red-500' },
    { title: 'Funcionários', icon: UserCheck, href: '/admin/funcionarios', color: 'from-pink-500 to-rose-500' },
    { title: 'Barbeiros', icon: Scissors, href: '/admin/barbeiros', color: 'from-indigo-500 to-blue-500' },
    { title: 'Produtos', icon: ShoppingCart, href: '/admin/produtos', color: 'from-teal-500 to-cyan-500' },
    { title: 'ERP Financeiro', icon: Star, href: '/admin/erp-financeiro', color: 'from-urbana-gold to-yellow-600' },
    { title: 'Gestão do Site', icon: Globe, href: '/admin/site', color: 'from-blue-500 to-indigo-500' },
    { title: 'Aniversários', icon: Cake, href: '/admin/aniversarios', color: 'from-purple-500 to-indigo-500' },
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
            <div className="w-12 h-12 rounded-xl flex items-center justify-center">
              <img 
                src="/logo-costa-urbana-new.png" 
                alt="Costa Urbana Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-urbana-gold-dark font-playfair">
                Gestão Financeira
              </h2>
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
          {menuItems.map((item, index) => {
            const isActiveRoute = location.pathname === item.href || 
              (item.href !== '/admin' && location.pathname.startsWith(item.href));
            
            return (
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
                    : 'hover:bg-gray-50 active:bg-gray-100'
                }`
              }
              end={item.href === '/admin'}
            >
              <div className="relative z-10 flex items-center gap-3">
                <item.icon className={`h-5 w-5 flex-shrink-0 ${isActiveRoute ? 'text-white' : 'text-urbana-gold'}`} />
                <span className={`font-medium text-sm font-raleway truncate ${isActiveRoute ? 'text-white' : 'text-gray-900'}`}>{item.title}</span>
              </div>
            </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-semibold text-urbana-gold">ERP Sistema Inteligente</p>
            <p className="text-xs text-gray-900">By</p>
            <img 
              src={beltecLogo} 
              alt="Beltec Soluções" 
              className="w-20 h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
