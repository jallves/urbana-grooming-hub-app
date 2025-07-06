
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import MarketingManagement from '@/components/admin/marketing/MarketingManagement';
import AdminRoute from '@/components/auth/AdminRoute';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminMarketing: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Marketing">
        <div className="space-y-6 sm:space-y-8">
          <ModernCard
            title="Gestão de Marketing"
            description="Gerenciamento de campanhas, cupons e estratégias de marketing"
            className="w-full max-w-full"
            contentClassName="overflow-hidden"
          >
            <div className="w-full overflow-hidden">
              <MarketingManagement />
            </div>
          </ModernCard>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminMarketing;
