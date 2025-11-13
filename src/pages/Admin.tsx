
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';

const Admin: React.FC = () => {
  return (
    <AdminLayout 
      title="Dashboard Administrativo" 
      description="Visão geral das operações da barbearia"
      icon="📊"
    >
      <AdminDashboard />
    </AdminLayout>
  );
};

export default Admin;
