
import React from 'react';
import { Link } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-white overflow-x-hidden">
        <AdminSidebar />
        <div className="flex-1 p-3 md:p-6 overflow-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-black">Painel Administrativo</h1>
              <p className="text-sm text-urbana-gray">Urbana Barbearia</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Link 
                to="/" 
                className="text-xs md:text-sm text-urbana-gray hover:text-black flex items-center gap-1"
              >
                Ver Site
              </Link>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-urbana-black flex items-center justify-center text-urbana-gold font-semibold">
                A
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
