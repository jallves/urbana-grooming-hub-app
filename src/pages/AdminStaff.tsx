
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import StaffManagement from '../components/admin/staff/StaffManagement';
import AdminRoute from '../components/auth/AdminRoute';

const AdminStaff: React.FC = () => {
  return (
    <AdminRoute allowBarber={true}>
      <AdminLayout>
        <StaffManagement />
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminStaff;
