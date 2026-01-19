
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
          <p className="text-xs sm:text-sm text-gray-700">Controle centralizado de todas as movimentações financeiras</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nova Entrada</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
            </DialogHeader>
            <CashFlowForm onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 min-h-0 p-2 sm:p-3 lg:p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-gray-300 h-auto mb-2 sm:mb-3 p-0.5">
            <TabsTrigger 
              value="dashboard" 
              className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-3 text-[10px] sm:text-sm bg-blue-500 text-white data-[state=active]:bg-blue-600 data-[state=active]:shadow-md"
            >
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-3 text-[10px] sm:text-sm bg-cyan-500 text-white data-[state=active]:bg-cyan-600 data-[state=active]:shadow-md"
            >
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Transações</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-3 text-[10px] sm:text-sm bg-teal-500 text-white data-[state=active]:bg-teal-600 data-[state=active]:shadow-md"
            >
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Relatórios</span>
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
