
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TransactionList from './TransactionList';
import FinanceReports from './FinanceReports';
import CommissionPayments from './CommissionPayments';
import { DollarSign, Receipt, TrendingUp } from 'lucide-react';

const FinanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('transactions');

  return (
    <div className="w-full">
      <Tabs 
        defaultValue="transactions" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 bg-black border border-urbana-gold/30 rounded-lg p-1 h-auto">
          <TabsTrigger 
            value="transactions" 
            className="flex items-center gap-2 py-3 text-sm data-[state=active]:bg-urbana-gold data-[state=active]:text-black text-white hover:text-urbana-gold font-raleway font-medium transition-all duration-300"
          >
            <DollarSign className="h-4 w-4" />
            <span>Transações</span>
          </TabsTrigger>
          <TabsTrigger 
            value="commissions" 
            className="flex items-center gap-2 py-3 text-sm data-[state=active]:bg-urbana-gold data-[state=active]:text-black text-white hover:text-urbana-gold font-raleway font-medium transition-all duration-300"
          >
            <Receipt className="h-4 w-4" />
            <span>Comissões</span>
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className="flex items-center gap-2 py-3 text-sm data-[state=active]:bg-urbana-gold data-[state=active]:text-black text-white hover:text-urbana-gold font-raleway font-medium transition-all duration-300"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Relatórios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-6">
          <div className="bg-black border border-gray-700 rounded-lg p-6 text-white">
            <TransactionList />
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="mt-6">
          <div className="bg-black border border-gray-700 rounded-lg p-6 text-white">
            <CommissionPayments />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="bg-black border border-gray-700 rounded-lg p-6 text-white">
            <FinanceReports />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceManagement;
