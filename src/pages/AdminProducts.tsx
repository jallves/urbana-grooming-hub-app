import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductManagement from '@/components/admin/products/ProductManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminProducts: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Produtos e Serviços">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <ModernCard
            title="🧴 Gestão de Produtos e Serviços"
            description="Gerencie todos os produtos vendidos e serviços oferecidos pela barbearia com praticidade e controle."
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl transition-all"
            contentClassName="overflow-x-auto p-4 sm:p-6"
          >
            <div className="min-w-[600px] md:min-w-full">
              <ProductManagement />
            </div>
          </ModernCard>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminProducts;

