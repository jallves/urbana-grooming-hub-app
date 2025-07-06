
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import BirthdayManagement from '@/components/admin/birthdays/BirthdayManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminBirthdays: React.FC = () => {
  return (
    <AdminRoute allowBarber={true}>
      <AdminLayout title="Aniversários">
        <div className="space-y-6 sm:space-y-8">
          <ModernCard
            title="Gestão de Aniversários"
            description="Gestão de aniversários dos clientes e campanhas especiais"
            className="w-full max-w-full"
            contentClassName="overflow-hidden"
          >
            <div className="w-full overflow-hidden">
              <BirthdayManagement />
            </div>
          </ModernCard>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBirthdays;
