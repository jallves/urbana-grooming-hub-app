
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import EmployeeManagement from '@/components/admin/employees/EmployeeManagement';

const AdminEmployees: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Funcionários</h1>
              <p className="text-gray-400">
                Gerencie administradores, gerentes e barbeiros
              </p>
            </div>
          </header>

          <EmployeeManagement />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminEmployees;
