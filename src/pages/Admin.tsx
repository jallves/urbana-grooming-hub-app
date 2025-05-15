
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminRoute from '../components/auth/AdminRoute';

const AdminPage: React.FC = () => {
  return (
    <AdminRoute allowBarber={true}>
      <AdminLayout>
        <AdminDashboard />
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminPage;
