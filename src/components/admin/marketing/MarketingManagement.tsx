
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CampaignList from './CampaignList';
import CouponList from './CouponList';
import MarketingDashboard from './MarketingDashboard';

const MarketingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketing</h1>
        <p className="text-gray-500">Gerenciamento de campanhas, cupons e indicações</p>
      </div>

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="coupons">Cupons de Desconto</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6">
          <MarketingDashboard />
        </TabsContent>
        
        <TabsContent value="campaigns" className="mt-6">
          <CampaignList />
        </TabsContent>
        
        <TabsContent value="coupons" className="mt-6">
          <CouponList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingManagement;
