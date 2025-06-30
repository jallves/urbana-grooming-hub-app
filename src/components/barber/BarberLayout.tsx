
import React from 'react';
import { useNavigate } from 'react-router-dom';
import BarberSidebar from './BarberSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Bell } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';

interface BarberLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const BarberLayout: React.FC<BarberLayoutProps> = ({ children, title = "Painel do Barbeiro" }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/barber/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userInitials = user?.email?.charAt(0).toUpperCase() || 'B';

  return (
    <div className="min-h-screen flex w-full bg-black text-white">
      <BarberSidebar />
      
      {/* Main content */}
      <div className={`flex-1 overflow-auto ${isMobile ? 'pl-0' : 'md:pl-0'}`}>
        <header className={`bg-zinc-900 border-b border-zinc-800 px-4 md:px-6 py-3 sticky top-0 z-10 backdrop-blur-sm ${isMobile ? 'pt-16' : ''}`}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-white">{title}</h1>
              <p className="text-xs md:text-sm text-gray-400">Urbana Barbearia</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                <Badge className="absolute top-0 right-0 h-2 w-2 bg-red-500 p-0 border-0"></Badge>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 md:h-10 md:w-10 rounded-full hover:bg-zinc-800 transition-colors">
                    <Avatar className="h-8 w-8 md:h-10 md:w-10">
                      <AvatarFallback className="bg-zinc-800 text-white text-xs md:text-sm">{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-white" align="end">
                  <DropdownMenuLabel className="text-xs md:text-sm">Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer hover:bg-zinc-800 transition-colors text-xs md:text-sm"
                    onClick={() => navigate('/barber/perfil')}
                  >
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer text-red-500 hover:bg-zinc-800 hover:text-red-400 transition-colors text-xs md:text-sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6 overflow-auto min-h-[calc(100vh-80px)]">{children}</main>
      </div>
    </div>
  );
};

export default BarberLayout;
