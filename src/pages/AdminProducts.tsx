
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductManagement from '@/components/admin/products/ProductManagement';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminProducts: React.FC = () => {
  return (
    <AdminLayout title="Produtos e Serviços">
      <div className="space-y-8">
        <div className="grid gap-6">
          <ModernCard
            title="Gestão de Produtos"
            description="Gerenciamento de produtos e serviços da barbearia"
            gradient="from-teal-500/10 to-cyan-600/10"
          >
            <ProductManagement />
          </ModernCard>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
