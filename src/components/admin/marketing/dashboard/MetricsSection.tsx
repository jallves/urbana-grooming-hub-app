
import React from 'react';
import MetricCard from './MetricCard';
import { useCampaignStats } from './useCampaignStats';
import { useCouponStats } from './useCouponStats';
import { Percent, Tag, ShoppingBag } from 'lucide-react';

const MetricsSection: React.FC = () => {
  const { data: campaignStats, isLoading: isLoadingCampaigns } = useCampaignStats();
  const { data: couponStats, isLoading: isLoadingCoupons } = useCouponStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Campanhas Ativas"
        value={`${campaignStats?.active || 0}`}
        icon={Percent}
        description={`De ${campaignStats?.total || 0} campanhas no total`}
        isLoading={isLoadingCampaigns}
      />

      <MetricCard
        title="Cupons Ativos"
        value={`${couponStats?.active || 0}`}
        icon={Tag}
        description={`De ${couponStats?.total || 0} cupons no total`}
        isLoading={isLoadingCoupons}
      />

      <MetricCard
        title="Cupons Utilizados"
        value={`${couponStats?.usages || 0}`}
        icon={ShoppingBag}
        description="Registros de uso de cupons"
        isLoading={isLoadingCoupons}
      />

      <MetricCard
        title="Taxa de Conversão"
        value="3.2%"
        icon={Percent}
        trend={{ value: "+0.5%", direction: "up" }}
        description="Últimos 30 dias"
      />
    </div>
  );
};

export default MetricsSection;
