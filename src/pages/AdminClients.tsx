
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import ClientManagement from '../components/admin/clients/ClientManagement';
import AdminRoute from '../components/auth/AdminRoute';

const AdminClients: React.FC = () => {
  return (
    <AdminRoute allowBarber={true} requiredModule="clients">
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white font-clash mb-2">
              Clientes
            </h1>
            <p className="text-gray-400 font-inter">
              Gerenciamento completo da base de clientes
            </p>
          </div>
          <ClientManagement />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminClients;
