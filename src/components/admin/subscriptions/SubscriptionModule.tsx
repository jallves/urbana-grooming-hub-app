import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Users, CreditCard, LayoutDashboard } from 'lucide-react';
import SubscriptionDashboardTab from './SubscriptionDashboardTab';
import SubscriptionPlansTab from './SubscriptionPlansTab';
import SubscriptionSubscribersTab from './SubscriptionSubscribersTab';
import SubscriptionPaymentsTab from './SubscriptionPaymentsTab';

const SubscriptionModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border shadow-sm w-full sm:w-auto grid grid-cols-4 sm:flex">
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Painel</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Planos</span>
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Assinantes</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Pagamentos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <SubscriptionDashboardTab />
        </TabsContent>
        <TabsContent value="plans">
          <SubscriptionPlansTab />
        </TabsContent>
        <TabsContent value="subscribers">
          <SubscriptionSubscribersTab />
        </TabsContent>
        <TabsContent value="payments">
          <SubscriptionPaymentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionModule;
