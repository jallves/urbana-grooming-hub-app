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
    <div className="min-h-screen bg-gray-50 text-gray-900 w-full overflow-x-hidden">
      {/* Layout Structure */}
      <div className="relative z-10 flex min-h-screen w-full">
        {/* Sidebar - Always visible on desktop */}
        <div className={`${isMobile ? 'hidden' : 'block'} w-64 lg:w-72 flex-shrink-0 border-r border-gray-200 bg-white`}>
          <AdminSidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 z-50 bg-white">
              <AdminSidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </>
        )}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen w-full overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-30 w-full shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8 py-3 w-full">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarOpen(true)}
                      className="text-gray-500 hover:bg-gray-100 h-9 w-9"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 truncate">
                      {title}
                    </h1>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="relative text-gray-500 hover:bg-gray-100 h-9 w-9"
                  >
                    <Bell className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 p-0 border-0 text-xs"></Badge>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-gray-100">
                        <Avatar className="h-8 w-8 border border-gray-200">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-lg" align="end">
                      <DropdownMenuLabel className="text-gray-800">Minha Conta</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-200" />
                      <DropdownMenuItem 
                        className="cursor-pointer hover:bg-gray-100 text-gray-700"
                        onClick={() => navigate('/admin/configuracoes')}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer hover:bg-gray-100 text-gray-700"
                        onClick={() => navigate('/')}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Ver Site
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-200" />
                      <DropdownMenuItem 
                        className="cursor-pointer text-red-600 hover:bg-red-50"
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
          <main className="flex-1 overflow-y-auto w-full bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;