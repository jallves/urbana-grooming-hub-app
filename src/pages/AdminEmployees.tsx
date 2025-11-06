
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import EmployeeManagement from '@/components/admin/employees/EmployeeManagement';

const AdminEmployees: React.FC = () => {
  return (
    <AdminLayout title="Funcionários">
      <div className="w-full">
        <EmployeeManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminEmployees;
