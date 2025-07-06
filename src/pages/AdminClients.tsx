
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientManagement from '@/components/admin/clients/ClientManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminClients: React.FC = () => {
  return (
    <AdminRoute allowBarber={true} requiredModule="clients">
      <AdminLayout title="Clientes">
        <div className="w-full max-w-full overflow-hidden">
          <div className="space-y-2 p-2 sm:space-y-3 sm:p-3 md:space-y-4 md:p-4 lg:space-y-6 lg:p-6">
            <ModernCard
              title="Gestão de Clientes"
              description="Gerenciamento completo da base de clientes"
              gradient="from-black-500/10 to-red-600/10"
              className="w-full max-w-full"
              headerClassName="px-2 py-2 sm:px-3 sm:py-2 md:px-4 md:py-3"
              contentClassName="p-2 sm:p-3 md:p-4 overflow-hidden"
            >
              <div className="w-full overflow-hidden">
                <ClientManagement />
              </div>
            </ModernCard>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminClients;
