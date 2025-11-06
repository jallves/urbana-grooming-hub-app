import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import BirthdayManagement from '@/components/admin/birthdays/BirthdayManagement';

const AdminBirthdays: React.FC = () => {
  return (
    <AdminLayout title="Aniversários">
      <div className="w-full">
        <BirthdayManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminBirthdays;
