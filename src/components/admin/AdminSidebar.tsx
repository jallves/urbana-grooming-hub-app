import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarItem, SidebarTrigger } from "@/components/ui/sidebar";
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

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { isBarber } = useAuth();
  const { collapsed } = useSidebar();

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
      <SidebarHeader className="font-bold text-xl text-white">
        <SidebarTrigger />
        Urbana Barbearia
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((item) => (
          <SidebarItem
            key={item.href}
            title={item.title}
            icon={item.icon}
            href={item.href}
            active={location.pathname === item.href}
          />
        ))}
      </SidebarContent>
      <SidebarFooter>
        {/* Footer content can go here */}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
