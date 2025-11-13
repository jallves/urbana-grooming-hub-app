import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import BirthdayManagement from '@/components/admin/birthdays/BirthdayManagement';

const AdminBirthdays: React.FC = () => {
  return (
    <AdminLayout 
      title="Gestão de Aniversários" 
      description="Gerencie os aniversariantes e envie mensagens personalizadas"
      icon="🎂"
    >
      <BirthdayManagement />
    </AdminLayout>
  );
};

export default AdminBirthdays;
