import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FinancialDashboard from '@/components/erp/FinancialDashboard';
import IntegrationErrorsMonitor from '@/components/admin/monitoring/IntegrationErrorsMonitor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminERPFinancial: React.FC = () => {
  return (
    <AdminLayout 
      title="Sistema ERP Financeiro" 
      description="Gestão completa e integrada de todas as transações financeiras"
      icon="💼"
    >
      <div className="w-full h-full flex flex-col bg-gray-50">
        <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100 border border-gray-200 h-auto p-1 gap-1">
              <TabsTrigger 
                value="dashboard"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-md data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] transition-all font-semibold"
              >
                📊 Dashboard Financeiro
              </TabsTrigger>
              <TabsTrigger 
                value="monitoring"
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 px-4 rounded-md data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] transition-all font-semibold"
              >
                🔄 Monitor de Integrações
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
              <FinancialDashboard />
            </TabsContent>
            <TabsContent value="monitoring">
              <IntegrationErrorsMonitor />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminERPFinancial;
