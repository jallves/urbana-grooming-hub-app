
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import ProductManagement from '../components/admin/products/ProductManagement';

const AdminProducts: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-clash mb-2">
            Produtos e Serviços
          </h1>
          <p className="text-gray-400 font-inter">
            Gerenciamento de produtos e serviços da barbearia
          </p>
        </div>
        <ProductManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
