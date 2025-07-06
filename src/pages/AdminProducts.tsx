
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductManagement from '@/components/admin/products/ProductManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminProducts: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Produtos e Serviços">
        <div className="space-y-6 sm:space-y-8">
          <ModernCard
            title="Gestão de Produtos"
            description="Gerenciamento de produtos e serviços da barbearia"
            className="w-full max-w-full"
            contentClassName="overflow-hidden"
          >
            <div className="w-full overflow-hidden">
              <ProductManagement />
            </div>
          </ModernCard>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminProducts;
