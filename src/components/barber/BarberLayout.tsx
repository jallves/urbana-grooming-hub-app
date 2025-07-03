
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
      // Redirection is handled by the signOut function in AuthContext
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userInitials = user?.email?.charAt(0).toUpperCase() || 'B';

  return (
    <div className="min-h-screen flex w-full bg-black text-white panel-responsive">
      <BarberSidebar />
      
      {/* Main content */}
      <div className={`flex-1 overflow-auto ${isMobile ? 'pl-0' : 'md:pl-0'}`}>
        <header className={`panel-header-responsive ${isMobile ? 'pt-16' : ''}`}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="panel-title-responsive font-bold text-white">{title}</h1>
              <p className="text-sm text-gray-400">Urbana Barbearia</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800 transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                <Badge className="absolute top-0 right-0 h-2 w-2 bg-red-500 p-0 border-0"></Badge>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 md:h-10 md:w-10 rounded-full hover:bg-gray-800 transition-colors">
                    <Avatar className="h-8 w-8 md:h-10 md:w-10">
                      <AvatarFallback className="bg-gray-800 text-white text-xs md:text-sm">{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-900 border-gray-700 text-white" align="end">
                  <DropdownMenuLabel className="panel-text-responsive">Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer hover:bg-gray-800 transition-colors panel-text-responsive"
                    onClick={() => navigate('/barbeiro/perfil')}
                  >
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors panel-text-responsive"
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
        <main className="panel-content-responsive overflow-auto min-h-[calc(100vh-80px)]">{children}</main>
      </div>
    </div>
  );
};

export default BarberLayout;
