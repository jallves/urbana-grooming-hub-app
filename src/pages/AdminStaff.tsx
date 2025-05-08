
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import StaffManagement from '../components/admin/staff/StaffManagement';

const AdminStaff: React.FC = () => {
  return (
    <AdminLayout>
      <StaffManagement />
    </AdminLayout>
  );
};

export default AdminStaff;
