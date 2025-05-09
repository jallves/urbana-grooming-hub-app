
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
      <div className="min-h-screen flex w-full bg-gray-100 overflow-x-hidden">
        <AdminSidebar />
        <div className="flex-1 p-3 md:p-6 overflow-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Painel Administrativo</h1>
              <p className="text-sm text-gray-500">Urbana Barbearia</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Link 
                to="/" 
                className="text-xs md:text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                Ver Site
              </Link>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold">
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
