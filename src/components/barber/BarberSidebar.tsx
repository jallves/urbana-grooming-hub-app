import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  DollarSign,
  Home,
  Clock,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navigationItems = [
  { 
    name: 'Início', 
    path: '/barbeiro/dashboard', 
    icon: Home,
    description: 'Visão geral'
  },
  { 
    name: 'Agenda', 
    path: '/barbeiro/agendamentos', 
    icon: Calendar,
    description: 'Seus agendamentos'
  },
  { 
    name: 'Horários', 
    path: '/barbeiro/horarios', 
    icon: Clock,
    description: 'Disponibilidade'
  },
  { 
    name: 'Comissões', 
    path: '/barbeiro/comissoes', 
    icon: DollarSign,
    description: 'Seus ganhos'
  },
];

const BarberSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-urbana-gold/20 bg-gradient-to-b from-urbana-black/95 via-urbana-black/90 to-urbana-black/95 backdrop-blur-2xl"
    >
      <SidebarContent>
        {/* Navigation Header */}
        {!isCollapsed && (
          <div className="px-3 py-4 border-b border-urbana-gold/10">
            <div className="relative">
              <h2 className="text-sm font-semibold text-urbana-light">Navegação</h2>
              <p className="text-[10px] text-urbana-light/60 mt-0.5">Acesse suas funcionalidades</p>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-urbana-light/70">
              Menu Principal
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 p-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      className={`
                        relative flex items-center gap-3 justify-start
                        p-2.5 rounded-xl transition-all duration-200
                        border backdrop-blur-sm
                        ${active 
                          ? 'bg-gradient-to-r from-urbana-gold/20 to-urbana-gold-vibrant/10 text-urbana-gold border-urbana-gold/40' 
                          : 'text-urbana-light/70 hover:text-urbana-gold hover:bg-urbana-gold/5 border-transparent hover:border-urbana-gold/20'
                        }
                      `}
                    >
                      {/* Icon Container */}
                      <div className={`
                        relative flex items-center justify-center
                        w-8 h-8 rounded-lg shrink-0
                        transition-colors duration-200
                        ${active 
                          ? 'bg-gradient-to-br from-urbana-gold/30 to-urbana-gold-vibrant/20' 
                          : 'bg-urbana-black/40'
                        }
                      `}>
                        <Icon className={`
                          h-4 w-4 transition-colors duration-200
                          ${active ? 'text-urbana-gold' : 'text-urbana-light/70'}
                        `} />
                      </div>
                      
                      {/* Label with description */}
                      {!isCollapsed && (
                        <div className="flex-1 text-left">
                          <span className={`
                            block text-xs font-semibold transition-colors duration-200
                            ${active ? 'text-urbana-gold' : 'text-urbana-light'}
                          `}>
                            {item.name}
                          </span>
                          <span className={`
                            block text-[10px] transition-colors duration-200 mt-0.5
                            ${active ? 'text-urbana-gold/70' : 'text-urbana-light/50'}
                          `}>
                            {item.description}
                          </span>
                        </div>
                      )}
                      
                      {/* Active indicator */}
                      {active && !isCollapsed && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <div className="w-1.5 h-1.5 rounded-full bg-urbana-gold" />
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Divider */}
        <div className="px-2 py-1.5">
          <div className="h-px bg-gradient-to-r from-transparent via-urbana-gold/30 to-transparent" />
        </div>

        {/* User Info Section */}
        <div className="mt-auto p-2 border-t border-urbana-gold/10 space-y-2">
          {!isCollapsed && (
            <div className="relative">
              <div className="relative flex items-center gap-2 p-2.5 bg-gradient-to-br from-urbana-black/60 to-urbana-black/40 rounded-xl backdrop-blur-sm border border-urbana-gold/20">
                {/* Avatar/Icon */}
                <div className="relative">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-vibrant/10 flex items-center justify-center border border-urbana-gold/30 shadow-lg shadow-urbana-gold/20">
                    <span className="text-urbana-gold font-bold text-xs">
                      {(user?.user_metadata?.name?.charAt(0) || 'B').toUpperCase()}
                    </span>
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-urbana-black shadow-lg shadow-green-500/50 animate-pulse" />
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-urbana-light truncate">
                    {user?.user_metadata?.name?.split(' ')[0] || 'Barbeiro'}
                  </p>
                  <p className="text-[10px] text-urbana-light/60 truncate">
                    {user?.email || 'email@exemplo.com'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1 h-1 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                    <span className="text-[9px] text-green-400 font-medium">Online</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="flex justify-center p-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-vibrant/10 flex items-center justify-center border border-urbana-gold/30 shadow-lg shadow-urbana-gold/20 relative">
                <span className="text-urbana-gold font-bold text-xs">
                  {(user?.user_metadata?.name?.charAt(0) || 'B').toUpperCase()}
                </span>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-urbana-black shadow-lg shadow-green-500/50 animate-pulse" />
              </div>
            </div>
          )}

          {/* Logout Button */}
          <Button
            variant="outline"
            onClick={signOut}
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 transition-all py-2 h-auto group flex items-center justify-center gap-2"
          >
            <LogOut className="h-3 w-3 group-hover:scale-110 transition-transform" />
            {!isCollapsed && <span className="text-xs font-semibold">Sair</span>}
          </Button>
        </div>

        {/* Footer decorative element */}
        {!isCollapsed && (
          <div className="px-3 pb-2">
            <div className="h-0.5 bg-gradient-to-r from-transparent via-urbana-gold/30 to-transparent rounded-full" />
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default BarberSidebar;
