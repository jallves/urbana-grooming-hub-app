import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { LogOut, Bell, Settings, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme/theme-toggle';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = "Painel Administrativo", description, icon }) => {
  const { user, signOut } = useAuth();
  const { displayName } = useEmployeeProfile();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate('/auth', { replace: true });
  };

  const userInitials = displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A';

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-gray-50">
      {/* Overlay com animação */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar flutuante (fixed) */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Conteúdo principal com transição */}
      <main className="flex-1 h-full overflow-y-auto bg-gray-50 lg:ml-64 transition-all duration-300">
        {/* Header fixo com blur backdrop - Mobile Optimized */}
        <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="w-full px-2 sm:px-4 lg:px-8 py-1.5 sm:py-2 lg:py-3 flex justify-between items-center gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0 flex-1">
              {/* Botão menu mobile com toque otimizado */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-gray-700 hover:text-gray-900 hover:bg-gray-100 
                min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 flex-shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0">
                {icon && <div className="text-lg sm:text-xl lg:text-2xl flex-shrink-0">{icon}</div>}
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 font-playfair truncate">
                    {title}
                  </h1>
                  {description && (
                    <p className="text-[10px] sm:text-xs lg:text-sm text-gray-700 font-raleway mt-0.5 truncate hidden sm:block">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-3 flex-shrink-0">
              {/* Saudação do usuário - com cache para não piscar */}
              <span className="hidden lg:block text-xs lg:text-sm font-medium text-gray-700 transition-opacity duration-0 truncate max-w-[120px] xl:max-w-none">
                Bem-vindo, {displayName}
              </span>
              
              {/* Notificações com touch otimizado */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-700 hover:text-gray-900 hover:bg-gray-100 
                min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 flex-shrink-0"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                <Badge className="absolute top-1 right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-urbana-gold text-white p-0 border-0 text-[8px] sm:text-[10px]" />
              </Button>

              {/* Menu Usuário */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-gray-100 
                    min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 flex-shrink-0"
                  >
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border-2 border-urbana-gold">
                      <AvatarFallback className="bg-gradient-to-r from-urbana-gold to-yellow-500 text-white text-xs sm:text-sm font-medium">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-lg" align="end">
                  <DropdownMenuLabel className="text-gray-900 font-playfair">Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem 
                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                    onClick={() => navigate('/admin/configuracoes')}
                  >
                    <User className="mr-2 h-4 w-4" /> Minha Conta
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Área de conteúdo com transição */}
        <div className="w-full h-full animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
