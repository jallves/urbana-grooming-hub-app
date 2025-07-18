
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import BirthdayManagement from '@/components/admin/birthdays/BirthdayManagement';
import AdminRoute from '@/components/auth/AdminRoute';

const AdminBirthdays: React.FC = () => (
  <AdminRoute allowBarber>
    <div className="min-h-screen bg-gray-900">
      <AdminLayout title="Aniversários">
        <div className="p-0 m-0">
          <BirthdayManagement />
        </div>
      </AdminLayout>
    </div>
  </AdminRoute>
);

export default AdminBirthdays;
