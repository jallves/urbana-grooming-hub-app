
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import MarketingManagement from '@/components/admin/marketing/MarketingManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminMarketing: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Marketing">
        <ModernCard
          title="Gestão de Marketing"
          description="Gerenciamento de campanhas, cupons e estratégias de marketing"
          className="w-full max-w-full bg-white border-gray-200"
          contentClassName="overflow-hidden"
        >
          <div className="w-full overflow-hidden">
            <MarketingManagement />
          </div>
        </ModernCard>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminMarketing;
