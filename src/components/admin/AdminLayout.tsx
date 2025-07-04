
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from './AdminSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import DashboardContainer from '@/components/ui/containers/DashboardContainer';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-black text-white overflow-x-hidden panel-responsive">
        <AdminSidebar />
        <div className={`flex-1 overflow-auto ${isMobile ? 'pl-0' : 'md:pl-0'}`}>
          <header className={`panel-header-responsive ${isMobile ? 'pt-16' : ''}`}>
            <DashboardContainer maxWidth="full" spacing="sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h1 className="panel-title-responsive font-bold text-white">Painel Administrativo</h1>
                  <p className="text-sm text-gray-400">Urbana Barbearia</p>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="panel-text-responsive text-gray-400 hover:text-white flex items-center gap-1 hover:bg-gray-800"
                    onClick={() => navigate('/')}
                  >
                    Ver Site
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </div>
                </div>
              </div>
            </DashboardContainer>
          </header>
          <main className="panel-content-responsive overflow-x-auto">
            <DashboardContainer maxWidth="full">
              {children}
            </DashboardContainer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
