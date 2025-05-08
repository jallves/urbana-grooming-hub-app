
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Scissors, 
  DollarSign, 
  Package, 
  BarChart2, 
  Settings, 
  MessageSquare, 
  ShoppingCart, 
  Megaphone 
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton 
} from "@/components/ui/sidebar";

const AdminSidebar: React.FC = () => {
  const menuItems = [
    { title: 'Dashboard', url: '/admin', icon: BarChart2 },
    { title: 'Agendamentos', url: '/admin/agendamentos', icon: Calendar },
    { title: 'Profissionais', url: '/admin/profissionais', icon: Scissors },
    { title: 'Clientes', url: '/admin/clientes', icon: Users },
    { title: 'Financeiro', url: '/admin/financeiro', icon: DollarSign },
    { title: 'Serviços e Produtos', url: '/admin/servicos', icon: Package },
    { title: 'Vendas', url: '/admin/vendas', icon: ShoppingCart },
    { title: 'Marketing', url: '/admin/marketing', icon: Megaphone },
    { title: 'Relatórios', url: '/admin/relatorios', icon: BarChart2 },
    { title: 'Suporte', url: '/admin/suporte', icon: MessageSquare },
    { title: 'Configurações', url: '/admin/configuracoes', icon: Settings }
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <div className="py-6 px-4">
          <h2 className="text-xl font-bold text-gray-800">Urbana Barbearia</h2>
          <p className="text-xs text-gray-500">Sistema Administrativo</p>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={({ isActive }) => 
                        `flex items-center gap-2 w-full py-2 px-3 rounded-md text-sm ${
                          isActive 
                            ? 'bg-gray-200 text-gray-900 font-medium' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`
                      }
                    >
                      <item.icon size={18} />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
