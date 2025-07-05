import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientManagement from '@/components/admin/clients/ClientManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminClients: React.FC = () => {
  return (
    <AdminRoute allowBarber={true} requiredModule="clients">
      <AdminLayout title="Clientes">
        <div className="space-y-3 px-3 py-2 sm:space-y-4 sm:px-4 md:space-y-6 md:px-6">
          <ModernCard
            title="Gestão de Clientes"
            description="Gerenciamento completo da base de clientes"
            gradient="from-black-500/10 to-red-600/10"
            className="w-full"
            headerClassName="px-3 py-2 sm:px-4 sm:py-3"
            contentClassName="overflow-x-auto pb-2"
          >
            <div className="min-w-[280px] sm:min-w-[350px] md:min-w-full">
              <ClientManagement mobileView={true} />
            </div>
          </ModernCard>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminClients;