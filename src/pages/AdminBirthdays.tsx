
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import BirthdayManagement from '@/components/admin/birthdays/BirthdayManagement';
import AdminRoute from '@/components/auth/AdminRoute';

const AdminBirthdays: React.FC = () => {
  return (
    <AdminRoute allowBarber={true}>
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white font-clash mb-2">
              Aniversários
            </h1>
            <p className="text-gray-400 font-inter">
              Gestão de aniversários dos clientes e campanhas especiais
            </p>
          </div>
          <BirthdayManagement />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBirthdays;
