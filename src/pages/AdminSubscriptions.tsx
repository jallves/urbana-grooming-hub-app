import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import SubscriptionModule from '@/components/admin/subscriptions/SubscriptionModule';

const AdminSubscriptions: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b bg-white px-4 lg:hidden">
            <SidebarTrigger />
          </header>
          <main className="flex-1 overflow-auto">
            <SubscriptionModule />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminSubscriptions;
