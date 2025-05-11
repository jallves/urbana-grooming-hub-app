
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import BarberSidebar from './BarberSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, DollarSign, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BarberLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const BarberLayout: React.FC<BarberLayoutProps> = ({ children, title = "Agenda do Barbeiro" }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/barbeiro/login');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-black text-white overflow-x-hidden">
        <BarberSidebar />
        <div className="flex-1 p-3 md:p-6 overflow-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">{title}</h1>
              <p className="text-sm text-gray-400">Urbana Barbearia</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-zinc-800"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'B'}
              </div>
            </div>
          </header>
          <main className="overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default BarberLayout;
