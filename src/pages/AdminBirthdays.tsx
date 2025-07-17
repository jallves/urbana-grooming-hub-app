import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import BirthdayManagement from '@/components/admin/birthdays/BirthdayManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminBirthdays: React.FC = () => {
  return (
    <AdminRoute allowBarber={true}>
      <AdminLayout title="Aniversários">
        <div className="flex flex-col h-full p-4 md:p-6 bg-gray-900">
          <ModernCard
            title="Gestão de Aniversários"
            description="Visualize e gerencie os aniversários dos clientes para campanhas especiais"
            className="w-full h-full border border-gray-700 rounded-lg bg-transparent"
            contentClassName="h-full overflow-hidden p-0"
            headerClassName="px-6 pt-6 pb-4 border-b border-gray-700"
            titleClassName="text-gray-900 font-bold dark:text-gray-900"
            descriptionClassName="text-gray-800 dark:text-gray-800"
          >
            <div className="h-full overflow-auto bg-transparent">
              <BirthdayManagement />
            </div>
          </ModernCard>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBirthdays;