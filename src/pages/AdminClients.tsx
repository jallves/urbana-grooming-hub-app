
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientManagement from '@/components/admin/clients/ClientManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminClients: React.FC = () => {
  return (
    <AdminRoute allowBarber={true} requiredModule="clients">
      <AdminLayout title="Clientes">
        <div className="space-y-6 sm:space-y-8">
          <ModernCard
            title="Gestão de Clientes"
            description="Gerenciamento completo da base de clientes"
            className="w-full max-w-full"
            contentClassName="overflow-hidden"
          >
            <div className="w-full overflow-hidden">
              <ClientManagement />
            </div>
          </ModernCard>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminClients;
