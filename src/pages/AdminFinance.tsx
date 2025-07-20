
imimport React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceManagement from '@/components/admin/finance/FinanceManagement';
import AdminRoute from '@/components/auth/AdminRoute';

const AdminFinance: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Financeiro">
        <div className="h-full bg-gray-900 flex flex-col">
          {/* Header section with responsive padding and typography */}
          <div className="px-4 py-4 sm:px-6 sm:py-6 border-b border-gray-700 flex-shrink-0">
            <div className="max-w-7xl mx-auto w-full">
              <h1 className="text-2xl sm:text-3xl font-playfair text-urbana-gold">
                💰 Gestão Financeira
              </h1>
              <p className="text-gray-300 font-raleway mt-1 sm:mt-2 text-sm sm:text-base">
                Gestão financeira e fluxo de caixa da barbearia
              </p>
            </div>
          </div>
          
          {/* Main content area with responsive padding and overflow handling */}
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-7xl mx-auto w-full p-4 sm:p-6">
              <FinanceManagement />
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminFinance;