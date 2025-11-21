import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FinancialDashboard from '@/components/erp/FinancialDashboard';

const AdminERPFinancial: React.FC = () => {
  return (
    <AdminLayout 
      title="Sistema ERP Financeiro" 
      description="Gestão completa e integrada de todas as transações financeiras"
      icon="💼"
    >
      <div className="w-full h-full flex flex-col bg-gray-50">
        <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
          <FinancialDashboard />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminERPFinancial;
