
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BarberSidebar from './BarberSidebar';
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
import { useToast } from '@/hooks/use-toast';

interface BarberLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const BarberLayout: React.FC<BarberLayoutProps> = ({ children, title = "Painel do Barbeiro" }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      console.log('BarberLayout - Starting logout');
      toast({
        title: 'Saindo...',
        description: 'Você está sendo desconectado do sistema',
      });
      
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: 'Erro ao sair',
        description: 'Ocorreu um erro ao tentar sair. Tente novamente.',
        variant: 'destructive',
      });
      // Force redirect even if there's an error
      window.location.href = '/';
    }
  };

  const userInitials = user?.email?.charAt(0).toUpperCase() || 'B';

  return (
    <div className="min-h-screen flex bg-gray-950 text-gray-100">
      {/* Overlay no mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-200 ease-in-out`}>
        <BarberSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30 shadow-sm">
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Botão menu mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-gray-300 hover:bg-gray-800"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-100">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Notificações */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-300 hover:bg-gray-800"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                <Badge className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-red-500 p-0 border-0 text-xs" />
              </Button>

              {/* Menu Usuário */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-gray-800">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-gray-700">
                      <AvatarFallback className="bg-gradient-to-r from-urbana-gold to-yellow-500 text-black text-xs sm:text-sm font-medium">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-900 border border-gray-700 shadow-lg" align="end">
                  <DropdownMenuLabel className="text-gray-100">Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    className="hover:bg-gray-800"
                    onClick={() => navigate('/barbeiro/perfil')}
                  >
                    <User className="mr-2 h-4 w-4" /> Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="hover:bg-gray-800"
                    onClick={() => navigate('/')}
                  >
                    <Settings className="mr-2 h-4 w-4" /> Ver Site
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    className="text-red-400 hover:bg-red-800 hover:text-red-200"
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
        <main className="flex-1 overflow-y-auto bg-gray-950">
          <div className="w-full h-full p-0 sm:p-2 lg:p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default BarberLayout;
