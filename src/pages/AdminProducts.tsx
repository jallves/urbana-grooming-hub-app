
import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import ProductManagement from '../components/admin/products/ProductManagement';

const AdminProducts: React.FC = () => {
  return (
    <AdminLayout>
      <ProductManagement />
    </AdminLayout>
  );
};

export default AdminProducts;
