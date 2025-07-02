
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import EmployeeManagement from '@/components/admin/employees/EmployeeManagement';

const AdminEmployees: React.FC = () => {
  return (
    <AdminRoute>
      <div className="min-h-screen bg-black">
        <AdminLayout>
          <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-black p-6 rounded-lg border border-gray-700">
              <div>
                <h1 className="text-3xl font-bold font-playfair text-urbana-gold">
                  Funcionários
                </h1>
                <p className="text-gray-300 font-raleway mt-2">
                  Gerencie administradores, gerentes e barbeiros da Urbana Barbearia
                </p>
              </div>
            </header>

            <EmployeeManagement />
          </div>
        </AdminLayout>
      </div>
    </AdminRoute>
  );
};

export default AdminEmployees;
