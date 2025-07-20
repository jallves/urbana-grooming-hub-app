
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
    <div className="h-full min-h-0 flex flex-col bg-gray-950 text-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 sm:p-4 border-b border-gray-800">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-100">Fluxo de Caixa</h1>
          <p className="text-xs sm:text-sm text-gray-400">Gerencie entradas e saídas financeiras</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nova Transação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
            </DialogHeader>
            <CashFlowForm onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 min-h-0 p-3 sm:p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border border-gray-700 h-auto mb-3">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-gray-300"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="flex items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-gray-300"
            >
              <List className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Transações</span>
              <span className="sm:hidden">Trans</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-gray-300"
            >
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Relatórios</span>
              <span className="sm:hidden">Rel</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 min-h-0">
            <TabsContent value="dashboard" className="h-full m-0">
              <div className="h-full overflow-auto">
                <CashFlowDashboard />
              </div>
            </TabsContent>
            
            <TabsContent value="transactions" className="h-full m-0">
              <div className="h-full overflow-auto">
                <CashFlowTransactions />
              </div>
            </TabsContent>
            
            <TabsContent value="reports" className="h-full m-0">
              <div className="h-full overflow-auto">
                <CashFlowReports />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default CashFlowManagement;
