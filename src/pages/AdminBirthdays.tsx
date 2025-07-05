
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import BirthdayManagement from '@/components/admin/birthdays/BirthdayManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminBirthdays: React.FC = () => {
  return (
    <AdminRoute allowBarber={true}>
      <AdminLayout title="Aniversários">
        <div className="space-y-8">
          <div className="grid gap-6">
            <ModernCard
              title="Gestão de Aniversários"
              description="Gestão de aniversários dos clientes e campanhas especiais"
              gradient="from-black-500/10 to-indigo-600/10"
            >
              <BirthdayManagement />
            </ModernCard>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBirthdays;
