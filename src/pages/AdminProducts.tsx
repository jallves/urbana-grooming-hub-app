
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductManagement from '@/components/admin/products/ProductManagement';

const AdminProducts: React.FC = () => {
  return (
    <AdminLayout 
      title="Gestão de Produtos e Serviços" 
      description="Gerencie todos os produtos vendidos e serviços oferecidos pela barbearia"
      icon="🧴"
    >
      <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6 space-y-4 sm:space-y-6">
        <ProductManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
