
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import CashFlowDashboard from './CashFlowDashboard';
import CashFlowTransactions from './CashFlowTransactions';
import CashFlowReports from './CashFlowReports';
import CashFlowForm from './CashFlowForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const CashFlowManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6 bg-urbana-black min-h-screen p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-urbana-gold">Fluxo de Caixa</h1>
          <p className="text-gray-400 mt-1">Gerencie entradas e saídas financeiras</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-urbana-gold to-urbana-gold/80 hover:from-urbana-gold/90 hover:to-urbana-gold text-urbana-black font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-urbana-black border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-urbana-gold font-playfair">Nova Transação</DialogTitle>
            </DialogHeader>
            <CashFlowForm onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-900 border-gray-700">
          <TabsTrigger 
            value="dashboard" 
            className="data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black text-gray-300"
          >
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="transactions" 
            className="data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black text-gray-300"
          >
            Transações
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className="data-[state=active]:bg-urbana-gold data-[state=active]:text-urbana-black text-gray-300"
          >
            Relatórios
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6">
          <CashFlowDashboard />
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-6">
          <CashFlowTransactions />
        </TabsContent>
        
        <TabsContent value="reports" className="mt-6">
          <CashFlowReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashFlowManagement;
