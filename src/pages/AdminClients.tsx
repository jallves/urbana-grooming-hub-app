
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientManagement from '@/components/admin/clients/ClientManagement';
import AdminRoute from '@/components/auth/AdminRoute';

const AdminClients: React.FC = () => {
  return (
    <AdminRoute allowBarber={true} requiredModule="clients">
      <AdminLayout title="Clientes">
        <div className="space-y-6">
          <ClientManagement />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminClients;
