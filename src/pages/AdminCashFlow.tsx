
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import CashFlowManagement from '../components/admin/cashflow/CashFlowManagement';

const AdminCashFlow: React.FC = () => {
  return (
    <AdminLayout>
      <CashFlowManagement />
    </AdminLayout>
  );
};

export default AdminCashFlow;
