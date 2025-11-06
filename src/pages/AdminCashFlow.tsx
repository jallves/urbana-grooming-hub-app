
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import CashFlowManagement from '@/components/admin/cashflow/CashFlowManagement';

const AdminCashFlow: React.FC = () => {
  return (
    <AdminLayout title="Fluxo de Caixa">
      <div className="w-full h-full min-h-0 flex flex-col">
        <CashFlowManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminCashFlow;
