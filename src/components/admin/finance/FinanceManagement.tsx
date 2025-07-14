import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TransactionList from './TransactionList';
import FinanceReports from './FinanceReports';
import CommissionPayments from './CommissionPayments';
import { DollarSign, Receipt, TrendingUp } from 'lucide-react';

const FinanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('transactions');

  return (
    <div className="w-full bg-gray-950 p-4"> {/* Fundo escuro com padding */}
      <Tabs 
        defaultValue="transactions" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        {/* TabsList com fundo escuro e texto preto (ícones brancos para contraste) */}
        <TabsList className="grid w-full grid-cols-3 bg-gray-900 border border-gray-700 rounded-lg p-1 h-auto">
          <TabsTrigger 
            value="transactions" 
            className="flex items-center gap-2 py-3 text-sm data-[state=active]:bg-gray-700 data-[state=active]:text-black text-gray-300 hover:text-black font-medium transition-all"
          >
            <DollarSign className="h-4 w-4 text-white" /> {/* Ícone branco */}
            <span>Transações</span>
          </TabsTrigger>
          <TabsTrigger 
            value="commissions" 
            className="flex items-center gap-2 py-3 text-sm data-[state=active]:bg-gray-700 data-[state=active]:text-black text-gray-300 hover:text-black font-medium transition-all"
          >
            <Receipt className="h-4 w-4 text-white" />
            <span>Comissões</span>
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className="flex items-center gap-2 py-3 text-sm data-[state=active]:bg-gray-700 data-[state=active]:text-black text-gray-300 hover:text-black font-medium transition-all"
          >
            <TrendingUp className="h-4 w-4 text-white" />
            <span>Relatórios</span>
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo das Tabs com fundo claro e texto preto */}
        <TabsContent value="transactions" className="mt-4">
          <div className="bg-white border border-gray-300 rounded-lg p-6 text-black shadow-lg">
            <TransactionList />
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="mt-4">
          <div className="bg-white border border-gray-300 rounded-lg p-6 text-black shadow-lg">
            <CommissionPayments />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <div className="bg-white border border-gray-300 rounded-lg p-6 text-black shadow-lg">
            <FinanceReports />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceManagement;