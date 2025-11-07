
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import EmployeeManagement from '@/components/admin/employees/EmployeeManagement';

const AdminEmployees: React.FC = () => {
  return (
    <AdminLayout title="Funcionários">
      <EmployeeManagement />
    </AdminLayout>
  );
};

export default AdminEmployees;
