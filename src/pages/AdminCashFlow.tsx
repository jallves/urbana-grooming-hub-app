
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import CashFlowManagement from '../components/admin/cashflow/CashFlowManagement';

const AdminCashFlow: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-clash mb-2">
            Fluxo de Caixa
          </h1>
          <p className="text-gray-400 font-inter">
            Controle detalhado do fluxo de caixa e movimentações financeiras
          </p>
        </div>
        <CashFlowManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminCashFlow;
