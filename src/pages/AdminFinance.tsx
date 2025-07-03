
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import FinanceManagement from '../components/admin/finance/FinanceManagement';

const AdminFinance: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-clash mb-2">
            Financeiro
          </h1>
          <p className="text-gray-400 font-inter">
            Gestão financeira e fluxo de caixa da barbearia
          </p>
        </div>
        <FinanceManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminFinance;
