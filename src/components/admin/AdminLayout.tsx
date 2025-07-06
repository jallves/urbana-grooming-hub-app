
import React from 'react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = "Painel Administrativo" }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userInitials = user?.email?.charAt(0).toUpperCase() || 'A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white w-full overflow-x-hidden">
      {/* Modern Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-urbana-gold to-yellow-500 rounded-full blur-3xl opacity-10"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl opacity-10"></div>
      </div>

      <div className="relative z-10 flex min-h-screen w-full">
        {/* Sidebar - Always visible on desktop */}
        <div className={`${isMobile ? 'hidden' : 'block'} w-64 lg:w-80 flex-shrink-0`}>
          <AdminSidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 z-50">
              <AdminSidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </>
        )}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen w-full overflow-hidden">
          {/* Header - Otimizado para mobile */}
          <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-30 w-full">
            <div className="px-2 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-4 w-full">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarOpen(true)}
                      className="text-white hover:bg-white/10 h-8 w-8 flex-shrink-0"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="text-sm sm:text-lg lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-urbana-gold to-yellow-400 bg-clip-text text-transparent truncate">
                      {title}
                    </h1>
                    <p className="text-xs sm:text-sm text-yellow-400 truncate"> Barbearia Costa Urbana </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="relative text-gray-400 hover:text-white hover:bg-white/10 transition-all hidden sm:flex h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    <Badge className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-red-500 p-0 border-0 text-xs"></Badge>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-white/10 transition-all">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-urbana-gold/30">
                          <AvatarFallback className="bg-gradient-to-r from-urbana-gold to-yellow-500 text-black text-xs sm:text-sm font-semibold">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 sm:w-56 bg-black/90 backdrop-blur-lg border-white/20 text-white" align="end">
                      <DropdownMenuLabel className="text-xs sm:text-sm text-white">Minha Conta</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/20" />
                      <DropdownMenuItem 
                        className="cursor-pointer hover:bg-white/10 transition-colors text-xs sm:text-sm text-white focus:text-white"
                        onClick={() => navigate('/admin/configuracoes')}
                      >
                        <User className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer hover:bg-white/10 transition-colors text-xs sm:text-sm text-white focus:text-white"
                        onClick={() => navigate('/')}
                      >
                        <Settings className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Ver Site
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/20" />
                      <DropdownMenuItem 
                        className="cursor-pointer text-red-400 hover:bg-red-500/20 hover:text-red-300 focus:text-red-300 transition-colors text-xs sm:text-sm"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area - PADRONIZADO com o Dashboard */}
          <main className="flex-1 overflow-y-auto w-full">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
