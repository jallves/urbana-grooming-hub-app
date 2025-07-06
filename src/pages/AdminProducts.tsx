
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductManagement from '@/components/admin/products/ProductManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminProducts: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Produtos e Serviços">
        <ModernCard
          title="Gestão de Produtos"
          description="Gerenciamento de produtos e serviços da barbearia"
          className="w-full max-w-full bg-white border-gray-200"
          contentClassName="overflow-hidden"
        >
          <div className="w-full overflow-hidden">
            <ProductManagement />
          </div>
        </ModernCard>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminProducts;
