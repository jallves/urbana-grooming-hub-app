
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
    <div className="w-full h-full bg-black text-white overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Header - Compacto */}
        <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-800">
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">Marketing</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Campanhas, cupons e relatórios</p>
        </div>

        {/* Tabs Navigation - Compacta */}
        <div className="flex-shrink-0 px-3 sm:px-4 pt-2">
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 bg-gray-800 border border-gray-700 rounded-lg p-1 h-9 sm:h-10">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center gap-1 py-1 px-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-gray-300 font-medium transition-all"
              >
                <LayoutDashboard className="h-3 w-3" />
                <span className="hidden sm:inline text-xs">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="campaigns" 
                className="flex items-center gap-1 py-1 px-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white text-gray-300 font-medium transition-all"
              >
                <Percent className="h-3 w-3" />
                <span className="hidden sm:inline text-xs">Campanhas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="coupons" 
                className="flex items-center gap-1 py-1 px-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-gray-300 font-medium transition-all"
              >
                <Ticket className="h-3 w-3" />
                <span className="hidden sm:inline text-xs">Cupons</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reports" 
                className="flex items-center gap-1 py-1 px-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white text-gray-300 font-medium transition-all"
              >
                <BarChart3 className="h-3 w-3" />
                <span className="hidden sm:inline text-xs">Relatórios</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Content Area - Scrollable */}
            <div className="mt-3 h-[calc(100vh-140px)] overflow-y-auto">
              <TabsContent value="dashboard" className="mt-0 h-full">
                <MarketingDashboard />
              </TabsContent>
              
              <TabsContent value="campaigns" className="mt-0 h-full">
                <CampaignList />
              </TabsContent>
              
              <TabsContent value="coupons" className="mt-0 h-full">
                <CouponList />
              </TabsContent>

              <TabsContent value="reports" className="mt-0 h-full">
                <MarketingReports />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MarketingManagement;
