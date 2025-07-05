
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientManagement from '@/components/admin/clients/ClientManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminClients: React.FC = () => {
  return (
    <AdminRoute allowBarber={true} requiredModule="clients">
      <AdminLayout title="Clientes">
        <div className="space-y-8">
          <div className="grid gap-6">
            <ModernCard
              title="Gestão de Clientes"
              description="Gerenciamento completo da base de clientes"
              gradient="from-orange-500/10 to-red-600/10"
            >
              <ClientManagement />
            </ModernCard>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminClients;
