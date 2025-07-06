
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, List, TrendingUp } from 'lucide-react';
import CashFlowDashboard from './CashFlowDashboard';
import CashFlowTransactions from './CashFlowTransactions';
import CashFlowReports from './CashFlowReports';
import CashFlowForm from './CashFlowForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const CashFlowManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div className="w-full sm:w-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Fluxo de Caixa</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Gerencie entradas e saídas financeiras</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nova Transação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Nova Transação</DialogTitle>
            </DialogHeader>
            <CashFlowForm onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-gray-200 rounded-lg p-1 h-auto">
          <TabsTrigger 
            value="dashboard" 
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-gray-700 text-xs sm:text-sm font-medium transition-all"
          >
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Dash</span>
          </TabsTrigger>
          <TabsTrigger 
            value="transactions" 
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white text-gray-700 text-xs sm:text-sm font-medium transition-all"
          >
            <List className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Transações</span>
            <span className="sm:hidden">Trans</span>
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white text-gray-700 text-xs sm:text-sm font-medium transition-all"
          >
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Relatórios</span>
            <span className="sm:hidden">Rel</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-4 sm:mt-6 w-full">
          <div className="w-full overflow-x-auto">
            <CashFlowDashboard />
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-4 sm:mt-6 w-full">
          <div className="w-full overflow-x-auto">
            <CashFlowTransactions />
          </div>
        </TabsContent>
        
        <TabsContent value="reports" className="mt-4 sm:mt-6 w-full">
          <div className="w-full overflow-x-auto">
            <CashFlowReports />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashFlowManagement;
