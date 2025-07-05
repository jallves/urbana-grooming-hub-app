
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import MarketingManagement from '@/components/admin/marketing/MarketingManagement';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminMarketing: React.FC = () => {
  return (
    <AdminLayout title="Marketing">
      <div className="space-y-8">
        <div className="grid gap-6">
          <ModernCard
            title="Gestão de Marketing"
            description="Gerenciamento de campanhas, cupons e estratégias de marketing"
            gradient="from-black-500/10 to-pink-600/10"
          >
            <MarketingManagement />
          </ModernCard>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMarketing;
