
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from "@/components/ui/sidebar";
import { 
  Calendar, 
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
  UserCheck
} from "lucide-react";

interface SidebarItemProps {
  title: string;
  icon: React.ComponentType<any>;
  href: string;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ title, icon: Icon, href, active }) => {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={() => navigate(href)}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
        active 
          ? 'bg-blue-600 text-white' 
          : 'text-gray-400 hover:text-white hover:bg-zinc-800'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{title}</span>
    </button>
  );
};

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { isBarber } = useAuth();

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
    },
    {
      title: "Agendamentos",
      icon: Calendar,
      href: "/admin/agendamentos",
    },
    {
      title: "Clientes",
      icon: Users,
      href: "/admin/clientes",
    },
    {
      title: "Funcionários",
      icon: UserCheck,
      href: "/admin/funcionarios",
    },
    {
      title: "Barbeiros",
      icon: Scissors,
      href: "/admin/barbeiros",
    },
    {
      title: "Produtos",
      icon: ShoppingCart,
      href: "/admin/produtos",
    },
    {
      title: "Financeiro",
      icon: Coins,
      href: "/admin/financeiro",
    },
    {
      title: "Marketing",
      icon: Percent,
      href: "/admin/marketing",
    },
    {
      title: "Aniversários",
      icon: Cake,
      href: "/admin/aniversarios",
    },
    {
      title: "Suporte",
      icon: Headphones,
      href: "/admin/suporte",
    },
    {
      title: "Escalas",
      icon: Calendar,
      href: "/admin/escalas",
    },
    {
      title: "Fluxo de Caixa",
      icon: LineChart,
      href: "/admin/fluxo-caixa",
    },
    {
      title: "Analytics",
      icon: LineChart,
      href: "/admin/analytics",
    },
    {
      title: "Configurações",
      icon: Settings,
      href: "/admin/configuracoes",
    },
  ];

  return (
    <Sidebar className="bg-zinc-900 border-r border-zinc-800 text-gray-400">
      <SidebarHeader className="font-bold text-xl text-white p-4">
        <SidebarTrigger />
        Urbana Barbearia
      </SidebarHeader>
      <SidebarContent className="px-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.href}
              title={item.title}
              icon={item.icon}
              href={item.href}
              active={location.pathname === item.href}
            />
          ))}
        </div>
      </SidebarContent>
      <SidebarFooter>
        {/* Footer content can go here */}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
