
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceManagement from '@/components/admin/finance/FinanceManagement';

const AdminFinance: React.FC = () => {
  return (
    <AdminLayout title="Financeiro">
      <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6 space-y-4 sm:space-y-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-playfair text-gray-900">
            💰 Gestão Financeira
          </h1>
          <p className="text-gray-700 font-raleway mt-1 sm:mt-2 text-sm sm:text-base">
            Gestão financeira e fluxo de caixa da barbearia
          </p>
        </div>
        <FinanceManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminFinance;
