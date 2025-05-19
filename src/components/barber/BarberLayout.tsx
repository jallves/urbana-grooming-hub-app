
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

interface BarberLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const BarberLayout: React.FC<BarberLayoutProps> = ({ children, title = "Painel do Barbeiro" }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/barbeiro/login');
  };

  const userInitials = user?.email?.charAt(0).toUpperCase() || 'B';

  return (
    <div className="min-h-screen flex w-full bg-black text-white">
      {/* Fixed sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 w-64 hidden md:block">
        <BarberSidebar />
      </div>
      
      {/* Mobile sidebar - shown via a drawer or sheet */}
      <div className="md:hidden">
        <BarberSidebar />
      </div>
      
      {/* Main content with padding to account for fixed sidebar */}
      <div className="flex-1 md:ml-64 p-0 overflow-auto">
        <header className="bg-zinc-900 border-b border-zinc-800 px-4 md:px-6 py-3 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">{title}</h1>
              <p className="text-sm text-gray-400">Urbana Barbearia</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-zinc-800 relative"
              >
                <Bell className="h-5 w-5" />
                <Badge className="absolute top-0 right-0 h-2 w-2 bg-red-500 p-0 border-0"></Badge>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback className="bg-zinc-800">{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-white" align="end">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer hover:bg-zinc-800"
                    onClick={() => navigate('/barbeiro/perfil')}
                  >
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer text-red-500 hover:bg-zinc-800 hover:text-red-500"
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
        <main className="p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default BarberLayout;
