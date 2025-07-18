
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CampaignList from './CampaignList';
import CouponList from './CouponList';
import MarketingDashboard from './MarketingDashboard';
import MarketingReports from '../reports/MarketingReports';
import { BarChart3, Ticket, Percent, LayoutDashboard } from 'lucide-react';

const MarketingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="w-full h-full bg-black text-white p-4 sm:p-6">
      <div className="w-full space-y-4 sm:space-y-6">
        <div className="px-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Marketing</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Gerenciamento de campanhas, cupons e indicações</p>
        </div>

        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 bg-gray-800 border border-gray-700 rounded-lg p-1 h-auto">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-gray-300 font-medium transition-all"
            >
              <LayoutDashboard className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </TabsTrigger>
            <TabsTrigger 
              value="campaigns" 
              className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white text-gray-300 font-medium transition-all"
            >
              <Percent className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Campanhas</span>
              <span className="sm:hidden">Camp</span>
            </TabsTrigger>
            <TabsTrigger 
              value="coupons" 
              className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-gray-300 font-medium transition-all"
            >
              <Ticket className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Cupons</span>
              <span className="sm:hidden">Cup</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white text-gray-300 font-medium transition-all"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Relatórios</span>
              <span className="sm:hidden">Rel</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-4 sm:mt-6 w-full">
            <div className="w-full overflow-x-auto">
              <MarketingDashboard />
            </div>
          </TabsContent>
          
          <TabsContent value="campaigns" className="mt-4 sm:mt-6 w-full">
            <div className="w-full overflow-x-auto">
              <CampaignList />
            </div>
          </TabsContent>
          
          <TabsContent value="coupons" className="mt-4 sm:mt-6 w-full">
            <div className="w-full overflow-x-auto">
              <CouponList />
            </div>
          </TabsContent>

          <TabsContent value="reports" className="mt-4 sm:mt-6 w-full">
            <div className="w-full overflow-x-auto">
              <MarketingReports />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MarketingManagement;
