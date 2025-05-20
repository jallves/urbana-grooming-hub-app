
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from './AdminSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-black overflow-x-hidden">
        <AdminSidebar />
        <div className="flex-1 p-3 md:p-6 overflow-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Painel Administrativo</h1>
              <p className="text-sm text-gray-400">Urbana Barbearia</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-xs md:text-sm text-gray-400 hover:text-white flex items-center gap-1"
                asChild
              >
                <Link to="/">
                  Ver Site
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-zinc-800"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </header>
          <main className="overflow-x-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
