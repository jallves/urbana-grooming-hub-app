
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientManagement from '@/components/admin/clients/ClientManagement';

const AdminClients: React.FC = () => {
  return (
    <AdminLayout title="Clientes">
      <div className="w-full h-full flex flex-col">
        <ClientManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminClients;
