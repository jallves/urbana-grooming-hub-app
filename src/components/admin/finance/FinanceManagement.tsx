
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TransactionList from './TransactionList';
import FinanceReports from './FinanceReports';
import CommissionPayments from './CommissionPayments';
import { DollarSign, Receipt, TrendingUp } from 'lucide-react';

const FinanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('transactions');

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="px-1">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Gestão Financeira</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Acompanhe receitas, despesas, comissões e relatórios financeiros</p>
      </div>

      <Tabs defaultValue="transactions" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-gray-200 rounded-lg p-1 h-auto">
          <TabsTrigger 
            value="transactions" 
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white text-gray-700 font-medium transition-all"
          >
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Transações</span>
            <span className="sm:hidden">Trans.</span>
          </TabsTrigger>
          <TabsTrigger 
            value="commissions" 
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-gray-700 font-medium transition-all"
          >
            <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Comissões</span>
            <span className="sm:hidden">Com.</span>
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white text-gray-700 font-medium transition-all"
          >
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Relatórios</span>
            <span className="sm:hidden">Rel.</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="mt-4 sm:mt-6 w-full">
          <div className="w-full overflow-x-auto">
            <TransactionList />
          </div>
        </TabsContent>
        
        <TabsContent value="commissions" className="mt-4 sm:mt-6 w-full">
          <div className="w-full overflow-x-auto">
            <CommissionPayments />
          </div>
        </TabsContent>
        
        <TabsContent value="reports" className="mt-4 sm:mt-6 w-full">
          <div className="w-full overflow-x-auto">
            <FinanceReports />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceManagement;
