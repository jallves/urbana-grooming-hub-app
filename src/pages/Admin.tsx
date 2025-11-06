
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';

const Admin: React.FC = () => {
  return (
    <AdminLayout title="Dashboard">
      <div className="w-full h-full">
        <AdminDashboard />
      </div>
    </AdminLayout>
  );
};

export default Admin;
