
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import EmployeeManagement from '@/components/admin/employees/EmployeeManagement';

const AdminEmployees: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Funcionários">
        <div className="w-full">
          <EmployeeManagement />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminEmployees;
