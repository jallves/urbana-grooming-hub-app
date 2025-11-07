import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import BirthdayManagement from '@/components/admin/birthdays/BirthdayManagement';

const AdminBirthdays: React.FC = () => {
  return (
    <AdminLayout title="Aniversários">
      <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6">
        <BirthdayManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminBirthdays;
