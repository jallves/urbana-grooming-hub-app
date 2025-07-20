
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TransactionList from './TransactionList';
import FinanceReports from './FinanceReports';
import CommissionPayments from './CommissionPayments';
import { DollarSign, Receipt, TrendingUp } from 'lucide-react';

const FinanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('transactions');

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <Tabs 
        defaultValue="transactions" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border border-urbana-gold/20 rounded-lg p-1 mb-4 h-auto flex-shrink-0">
          <TabsTrigger 
            value="transactions" 
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-urbana-gold data-[state=active]:text-black text-white hover:text-urbana-gold font-raleway font-medium transition-all duration-300"
          >
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Transações</span>
            <span className="sm:hidden">Trans</span>
          </TabsTrigger>
          <TabsTrigger 
            value="commissions" 
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-urbana-gold data-[state=active]:text-black text-white hover:text-urbana-gold font-raleway font-medium transition-all duration-300"
          >
            <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Comissões</span>
            <span className="sm:hidden">Com</span>
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-urbana-gold data-[state=active]:text-black text-white hover:text-urbana-gold font-raleway font-medium transition-all duration-300"
          >
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Relatórios</span>
            <span className="sm:hidden">Rel</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="flex-1 min-h-0">
          <div className="h-full bg-gray-800 border border-gray-700 rounded-lg">
            <TransactionList />
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="flex-1 min-h-0">
          <div className="h-full bg-gray-800 border border-gray-700 rounded-lg">
            <CommissionPayments />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="flex-1 min-h-0">
          <div className="h-full bg-gray-800 border border-gray-700 rounded-lg">
            <FinanceReports />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceManagement;
