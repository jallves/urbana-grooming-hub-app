
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
  Star
} from "lucide-react";

interface AdminSidebarProps {
  onClose?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onClose }) => {
  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: "Agendamentos Clientes",
      icon: UserCheck,
      href: "/admin/agendamentos-clientes",
      color: 'from-purple-500 to-violet-500'
    },
    {
      title: "Clientes",
      icon: Users,
      href: "/admin/clientes",
      color: 'from-orange-500 to-red-500'
    },
    {
      title: "Funcionários",
      icon: UserCheck,
      href: "/admin/funcionarios",
      color: 'from-pink-500 to-rose-500'
    },
    {
      title: "Barbeiros",
      icon: Scissors,
      href: "/admin/barbeiros",
      color: 'from-indigo-500 to-blue-500'
    },
    {
      title: "Produtos",
      icon: ShoppingCart,
      href: "/admin/produtos",
      color: 'from-teal-500 to-cyan-500'
    },
    {
      title: "Financeiro",
      icon: Coins,
      href: "/admin/financeiro",
      color: 'from-yellow-500 to-orange-500'
    },
    {
      title: "Marketing",
      icon: Percent,
      href: "/admin/marketing",
      color: 'from-red-500 to-pink-500'
    },
    {
      title: "Aniversários",
      icon: Cake,
      href: "/admin/aniversarios",
      color: 'from-purple-500 to-indigo-500'
    },
    {
      title: "Suporte",
      icon: Headphones,
      href: "/admin/suporte",
      color: 'from-blue-500 to-purple-500'
    },
    {
      title: "Escalas",
      icon: UserCheck,
      href: "/admin/escalas",
      color: 'from-green-500 to-blue-500'
    },
    {
      title: "Fluxo de Caixa",
      icon: LineChart,
      href: "/admin/fluxo-caixa",
      color: 'from-cyan-500 to-blue-500'
    },
    {
      title: "Analytics",
      icon: LineChart,
      href: "/admin/analytics",
      color: 'from-violet-500 to-purple-500'
    },
    {
      title: "Configurações",
      icon: Settings,
      href: "/admin/configuracoes",
      color: 'from-gray-500 to-gray-600'
    },
  ];

  return (
    <div className="h-full bg-black/40 backdrop-blur-lg border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-urbana-gold to-yellow-500 rounded-xl flex items-center justify-center">
            <Star className="h-7 w-7 text-black" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-urbana-gold to-yellow-400 bg-clip-text text-transparent">
              Admin Panel
            </h2>
            <p className="text-xs text-gray-400">Urbana Barbearia</p>
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
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg scale-105'
                  : 'hover:bg-white/10 text-gray-300 hover:text-white hover:scale-105'
              }`
            }
            end={item.href === '/admin'}
          >
            <div className="relative z-10 flex items-center gap-3">
              <item.icon className="h-5 w-5" />
              <span className="font-medium text-sm">{item.title}</span>
            </div>
            
            {/* Hover effect background */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-gray-500 text-center">
          <p className="font-semibold text-urbana-gold">Urbana Barbearia</p>
          <p>Sistema Administrativo</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
