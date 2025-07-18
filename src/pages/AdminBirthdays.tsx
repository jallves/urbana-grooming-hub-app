import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import BirthdayManagement from '@/components/admin/birthdays/BirthdayManagement';

const AdminBirthdays: React.FC = () => {
  return (
    <AdminRoute allowBarber>
      <AdminLayout title="Aniversários">
        <div className="w-full">
          <BirthdayManagement />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBirthdays;
