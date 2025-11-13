
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientManagement from '@/components/admin/clients/ClientManagement';

const AdminClients: React.FC = () => {
  return (
    <AdminLayout 
      title="Gestão de Clientes" 
      description="Gerencie todos os clientes da barbearia"
      icon="👥"
    >
      <ClientManagement />
    </AdminLayout>
  );
};

export default AdminClients;
