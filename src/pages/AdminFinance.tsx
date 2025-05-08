
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import FinanceManagement from '../components/admin/finance/FinanceManagement';

const AdminFinance: React.FC = () => {
  return (
    <AdminLayout>
      <FinanceManagement />
    </AdminLayout>
  );
};

export default AdminFinance;
