import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import BirthdayManagement from '@/components/admin/birthdays/BirthdayManagement';
import AdminRoute from '@/components/auth/AdminRoute';

const AdminBirthdays: React.FC = () => (
  <AdminRoute allowBarber>
    <AdminLayout title="Aniversários">
      <BirthdayManagement />
    </AdminLayout>
  </AdminRoute>
);

export default AdminBirthdays;