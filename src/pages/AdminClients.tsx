import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientManagement from '@/components/admin/clients/ClientManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminClients: React.FC = () => {
  return (
    <AdminRoute allowBarber={true} requiredModule="clients">
      <AdminLayout title="Clientes">
        <div className="space-y-4 md:space-y-8 px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:gap-6">
            <ModernCard
              title="Gestão de Clientes"
              description="Gerenciamento completo da base de clientes"
              gradient="from-black-500/10 to-red-600/10"
              className="w-full"
            >
              <div className="overflow-x-auto">
                <div className="min-w-[1024px] md:min-w-0">
                  <ClientManagement />
                </div>
              </div>
            </ModernCard>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminClients;