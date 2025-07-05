
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminRoute from '@/components/auth/AdminRoute';

const Admin: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Dashboard">
        <div className="space-y-8">
          <AdminDashboard />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default Admin;
