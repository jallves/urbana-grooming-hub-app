
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-3xl font-playfair font-bold text-urbana-gold">Fluxo de Caixa</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Gerencie entradas e saídas financeiras</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-gradient-to-r from-urbana-gold to-urbana-gold/80 hover:from-urbana-gold/90 hover:to-urbana-gold text-urbana-black font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-urbana-black border-gray-700 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-urbana-gold font-playfair">Nova Transação</DialogTitle>
            </DialogHeader>
            <CashFlowForm onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-900 border-gray-700 h-auto">
          <TabsTrigger 
            value="dashboard" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black text-gray-300 text-sm"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger 
            value="transactions" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black text-gray-300 text-sm"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Transações</span>
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black text-gray-300 text-sm"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-4 sm:mt-6 w-full">
          <CashFlowDashboard />
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-4 sm:mt-6 w-full">
          <CashFlowTransactions />
        </TabsContent>
        
        <TabsContent value="reports" className="mt-4 sm:mt-6 w-full">
          <CashFlowReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashFlowManagement;
