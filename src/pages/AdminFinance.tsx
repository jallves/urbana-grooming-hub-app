
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceManagement from '@/components/admin/finance/FinanceManagement';

const AdminFinance: React.FC = () => {
  return (
    <AdminLayout title="Financeiro">
      <div className="w-full max-w-none h-full bg-white flex flex-col">
        <div className="px-4 py-4 sm:px-6 sm:py-6 border-b border-gray-200 flex-shrink-0">
          <div className="w-full">
            <h1 className="text-2xl sm:text-3xl font-playfair text-gray-900">
              💰 Gestão Financeira
            </h1>
            <p className="text-gray-700 font-raleway mt-1 sm:mt-2 text-sm sm:text-base">
              Gestão financeira e fluxo de caixa da barbearia
            </p>
          </div>
        </div>
        
        {/* Main content area with responsive padding and overflow handling */}
        <div className="flex-1 min-h-0 overflow-auto bg-gray-50">
          <div className="w-full p-4 sm:p-6">
            <FinanceManagement />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFinance;
