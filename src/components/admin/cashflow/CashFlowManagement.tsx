
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
    <div className="h-full min-h-0 flex flex-col bg-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 sm:p-4 border-b border-gray-300">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-black">Fluxo de Caixa</h1>
          <p className="text-xs sm:text-sm text-gray-700">Gerencie entradas e saídas financeiras</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white text-sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nova Transação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-300 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-black">Nova Transação</DialogTitle>
            </DialogHeader>
            <CashFlowForm onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 min-h-0 p-3 sm:p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-gray-300 h-auto mb-3">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-black data-[state=active]:text-white text-gray-700"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="flex items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-black data-[state=active]:text-white text-gray-700"
            >
              <List className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Transações</span>
              <span className="sm:hidden">Trans</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-black data-[state=active]:text-white text-gray-700"
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
