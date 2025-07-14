
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
      <Tabs defaultValue="transactions" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-background border rounded-lg p-1 h-auto">
          <TabsTrigger 
            value="transactions" 
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground font-medium transition-all"
          >
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Transações</span>
            <span className="sm:hidden">Trans.</span>
          </TabsTrigger>
          <TabsTrigger 
            value="commissions" 
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground font-medium transition-all"
          >
            <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Comissões</span>
            <span className="sm:hidden">Com.</span>
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground font-medium transition-all"
          >
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
