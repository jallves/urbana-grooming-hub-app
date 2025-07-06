
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import BirthdayManagement from '@/components/admin/birthdays/BirthdayManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminBirthdays: React.FC = () => {
  return (
    <AdminRoute allowBarber={true}>
      <AdminLayout title="Aniversários">
        <ModernCard
          title="Gestão de Aniversários"
          description="Gestão de aniversários dos clientes e campanhas especiais"
          className="w-full max-w-full bg-white border-gray-200"
          contentClassName="overflow-hidden"
        >
          <div className="w-full overflow-hidden">
            <BirthdayManagement />
          </div>
        </ModernCard>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBirthdays;
