
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CampaignList from './CampaignList';
import CouponList from './CouponList';
import MarketingDashboard from './MarketingDashboard';
import MarketingReports from '../reports/MarketingReports';
import { BarChart3, Ticket, PercentCircle, LayoutDashboard } from 'lucide-react';

const MarketingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketing</h1>
        <p className="text-gray-500">Gerenciamento de campanhas, cupons e indicações</p>
      </div>

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <PercentCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Campanhas</span>
          </TabsTrigger>
          <TabsTrigger value="coupons" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            <span className="hidden sm:inline">Cupons</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
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

        <TabsContent value="reports" className="mt-6">
          <MarketingReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingManagement;
