
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TransactionList from './TransactionList';
import FinanceReports from './FinanceReports';
import CommissionPayments from './CommissionPayments';

const FinanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('transactions');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestão Financeira</h1>
        <p className="text-gray-500">Acompanhe receitas, despesas, comissões e relatórios financeiros</p>
      </div>

      <Tabs defaultValue="transactions" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="mt-6">
          <TransactionList />
        </TabsContent>
        
        <TabsContent value="commissions" className="mt-6">
          <CommissionPayments />
        </TabsContent>
        
        <TabsContent value="reports" className="mt-6">
          <FinanceReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceManagement;
