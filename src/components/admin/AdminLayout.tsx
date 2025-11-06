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
    <div className="min-h-screen flex bg-sidebar text-sidebar-foreground">
      {/* Overlay no mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar única */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-sidebar border-b border-sidebar-border sticky top-0 z-30 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Botão menu mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-sidebar-accent-foreground"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-lg sm:text-xl font-bold text-sidebar-foreground">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Notificações */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-sidebar-accent-foreground"
              >
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 bg-destructive p-0 border-0 text-xs" />
              </Button>

              {/* Menu Usuário */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8 border border-sidebar-border">
                      <AvatarFallback className="bg-gradient-to-r from-sidebar-primary to-accent text-sidebar-primary-foreground text-sm font-medium">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-sidebar border border-sidebar-border shadow-lg" align="end">
                  <DropdownMenuLabel className="text-sidebar-foreground">Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-sidebar-border" />
                  <DropdownMenuItem 
                    className=""
                    onClick={() => navigate('/admin/configuracoes')}
                  >
                    <User className="mr-2 h-4 w-4" /> Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className=""
                    onClick={() => navigate('/')}
                  >
                    <Settings className="mr-2 h-4 w-4" /> Ver Site
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-sidebar-border" />
                  <DropdownMenuItem
                    className="text-destructive"
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
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
