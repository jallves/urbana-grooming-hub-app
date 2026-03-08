import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SubscriptionModule from '@/components/admin/subscriptions/SubscriptionModule';

const AdminSubscriptions: React.FC = () => {
  return (
    <AdminLayout 
      title="Gestão de Assinaturas" 
      description="Gerencie planos, assinantes, pagamentos e métricas recorrentes"
    >
      <SubscriptionModule />
    </AdminLayout>
  );
};

export default AdminSubscriptions;
