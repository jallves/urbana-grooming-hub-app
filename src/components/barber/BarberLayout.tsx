
import React from 'react';
import { useNavigate } from 'react-router-dom';
import BarberSidebar from './BarberSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Bell, Menu } from 'lucide-react';
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
import { useState } from 'react';

interface BarberLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const BarberLayout: React.FC<BarberLayoutProps> = ({ children, title = "Painel do Barbeiro" }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userInitials = user?.email?.charAt(0).toUpperCase() || 'B';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Modern Background Pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar - Hidden on mobile */}
        <div className={`${isMobile ? 'hidden' : 'block'} w-64 flex-shrink-0`}>
          <BarberSidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 z-50">
              <BarberSidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </>
        )}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-30">
            <div className="px-4 lg:px-8 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarOpen(true)}
                      className="text-white hover:bg-white/10"
                    >
                      <Menu className="h-6 w-6" />
                    </Button>
                  )}
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {title}
                    </h1>
                    <p className="text-sm text-gray-400">Urbana Barbearia</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="relative text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Bell className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 p-0 border-0 text-xs"></Badge>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/10 transition-all">
                        <Avatar className="h-10 w-10 ring-2 ring-white/20">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-black/90 backdrop-blur-lg border-white/20 text-white" align="end">
                      <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/20" />
                      <DropdownMenuItem 
                        className="cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => navigate('/barbeiro/perfil')}
                      >
                        Perfil
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/20" />
                      <DropdownMenuItem 
                        className="cursor-pointer text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 lg:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default BarberLayout;
