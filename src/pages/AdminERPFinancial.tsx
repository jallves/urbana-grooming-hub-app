import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FinancialDashboard from '@/components/erp/FinancialDashboard';

const AdminERPFinancial: React.FC = () => {
  return (
    <AdminLayout title="ERP Financeiro">
      <div className="w-full h-full flex flex-col bg-gray-50">
        <div className="p-3 sm:p-4 lg:p-6 border-b bg-white shadow-sm">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 font-playfair">
            💼 Sistema ERP Financeiro
          </h1>
          <p className="text-xs sm:text-sm text-gray-700 font-raleway mt-1">
            Gestão completa e integrada de todas as transações financeiras
          </p>
        </div>
        <div className="flex-1 overflow-auto">
          <FinancialDashboard />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminERPFinancial;
