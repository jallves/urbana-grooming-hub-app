import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FinancialDashboard from '@/components/erp/FinancialDashboard';
import IntegrationErrorsMonitor from '@/components/admin/monitoring/IntegrationErrorsMonitor';
import { FixCashPaymentMethod } from '@/components/admin/erp/FixCashPaymentMethod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminERPFinancial: React.FC = () => {
  return (
    <AdminLayout title="ERP Financeiro">
      <div className="w-full h-full flex flex-col bg-gray-50">
        <div className="p-3 sm:p-4 lg:p-6 border-b bg-white shadow-sm">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 font-playfair">
            💼 Sistema ERP Financeiro
          </h1>
          <p className="text-xs sm:text-sm text-gray-700 font-raleway mt-1">
            Gestão completa e integrada de todas as transações financeiras
          </p>
        </div>
        <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="dashboard">Dashboard Financeiro</TabsTrigger>
              <TabsTrigger value="monitoring">Monitor de Integrações</TabsTrigger>
              <TabsTrigger value="tools">Ferramentas</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
              <FinancialDashboard />
            </TabsContent>
            <TabsContent value="monitoring">
              <IntegrationErrorsMonitor />
            </TabsContent>
            <TabsContent value="tools">
              <div className="space-y-6">
                <FixCashPaymentMethod />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminERPFinancial;
