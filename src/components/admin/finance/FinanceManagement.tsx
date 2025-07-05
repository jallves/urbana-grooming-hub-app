
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
        <h1 className="text-lg sm:text-2xl font-bold text-white">Gestão Financeira</h1>
        <p className="text-sm text-gray-400 mt-1">Acompanhe receitas, despesas, comissões e relatórios financeiros</p>
      </div>

      <Tabs defaultValue="transactions" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-black/40 border border-white/10 h-auto">
          <TabsTrigger value="transactions" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500">
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Transações</span>
            <span className="sm:hidden">Trans.</span>
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500">
            <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Comissões</span>
            <span className="sm:hidden">Com.</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Relatórios</span>
            <span className="sm:hidden">Rel.</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="mt-4 sm:mt-6 w-full">
          <TransactionList />
        </TabsContent>
        
        <TabsContent value="commissions" className="mt-4 sm:mt-6 w-full">
          <CommissionPayments />
        </TabsContent>
        
        <TabsContent value="reports" className="mt-4 sm:mt-6 w-full">
          <FinanceReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceManagement;
