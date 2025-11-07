import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '@/contexts/AuthContext';
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
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = "Painel Administrativo" }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const userInitials = user?.email?.charAt(0).toUpperCase() || 'A';

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Overlay quando sidebar aberta */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar flutuante (fixed) */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Conteúdo ocupa 100% da largura */}
      <div className="w-full flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="w-full px-4 sm:px-6 lg:px-8 lg:pl-72 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Botão menu mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 font-playfair">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Notificações */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 bg-urbana-gold text-white p-0 border-0 text-xs" />
              </Button>

              {/* Menu Usuário */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-gray-100">
                    <Avatar className="h-8 w-8 border-2 border-urbana-gold">
                      <AvatarFallback className="bg-gradient-to-r from-urbana-gold to-yellow-500 text-white text-sm font-medium">
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
                    <User className="mr-2 h-4 w-4" /> Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                    onClick={() => navigate('/')}
                  >
                    <Settings className="mr-2 h-4 w-4" /> Ver Site
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

        {/* Área principal */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="w-full h-full lg:pl-64">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
