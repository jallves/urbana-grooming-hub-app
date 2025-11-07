
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import EmployeeManagement from '@/components/admin/employees/EmployeeManagement';

const AdminEmployees: React.FC = () => {
  return (
    <AdminLayout title="Funcionários">
      <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6">
        <EmployeeManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminEmployees;
