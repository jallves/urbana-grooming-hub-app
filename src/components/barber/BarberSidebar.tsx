
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, DollarSign, User, Scissors } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const BarberSidebar = () => {
  const menuItems = [
    {
      icon: Calendar,
      label: 'Agenda',
      path: '/barbeiro'
    },
    {
      icon: DollarSign,
      label: 'Comissões',
      path: '/barbeiro/comissoes'
    },
    {
      icon: User,
      label: 'Perfil',
      path: '/barbeiro/perfil'
    }
  ];

  return (
    <Sidebar>
      <SidebarContent className="bg-zinc-900 border-r border-zinc-800">
        <div className="flex items-center justify-center py-6 border-b border-zinc-800">
          <Scissors className="h-8 w-8 text-white" />
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 px-4 py-2">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.path}
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-4 py-2 rounded-md w-full ${
                          isActive 
                            ? 'bg-white text-black' 
                            : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
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

export default BarberSidebar;
