
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceManagement from '@/components/admin/finance/FinanceManagement';

const AdminFinance: React.FC = () => {
  return (
    <AdminLayout 
      title="Gestão Financeira" 
      description="Gestão financeira e fluxo de caixa da barbearia"
      icon="💰"
    >
      <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6 space-y-4 sm:space-y-6">
        <FinanceManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminFinance;
