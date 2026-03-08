import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Users, CreditCard } from 'lucide-react';
import SubscriptionPlansTab from './SubscriptionPlansTab';
import SubscriptionSubscribersTab from './SubscriptionSubscribersTab';
import SubscriptionPaymentsTab from './SubscriptionPaymentsTab';

const SubscriptionModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('plans');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Crown className="h-7 w-7 text-amber-500" />
          Assinaturas
        </h1>
        <p className="text-gray-500 mt-1">Gerencie planos, assinantes e pagamentos recorrentes</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="plans" className="gap-2 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Planos</span>
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Assinantes</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Pagamentos</span>
          </TabsTrigger>
        </TabsList>

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
