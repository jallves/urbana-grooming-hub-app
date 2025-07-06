
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import FinanceReports from '@/components/admin/finance/FinanceReports';
import AppointmentReports from '@/components/admin/reports/AppointmentReports';
import MarketingReports from '@/components/admin/reports/MarketingReports';
import ClientReports from '@/components/admin/reports/ClientReports';
import InventoryReports from '@/components/admin/reports/InventoryReports';
import { FileChartColumn, Calendar, Tag, Users, Package } from 'lucide-react';
import ModernCard from '@/components/ui/containers/ModernCard';

const AdminAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('financial');

  return (
    <AdminRoute>
      <AdminLayout title="Relatórios e Analytics">
        <div className="space-y-6 sm:space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 sm:grid-cols-5 mb-6 sm:mb-8 bg-gray-100 border border-gray-200 rounded-lg p-1">
              <TabsTrigger 
                value="financial" 
                className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-gray-700 py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-all"
              >
                <FileChartColumn className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Financeiro</span>
                <span className="sm:hidden">Fin.</span>
              </TabsTrigger>
              <TabsTrigger 
                value="appointments" 
                className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white text-gray-700 py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-all"
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Agendamentos</span>
                <span className="sm:hidden">Agend.</span>
              </TabsTrigger>
              <TabsTrigger 
                value="marketing" 
                className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white text-gray-700 py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-all"
              >
                <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Marketing</span>
                <span className="sm:hidden">Mark.</span>
              </TabsTrigger>
              <TabsTrigger 
                value="clients" 
                className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white text-gray-700 py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-all"
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Clientes</span>
                <span className="sm:hidden">Cli.</span>
              </TabsTrigger>
              <TabsTrigger 
                value="inventory" 
                className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700 py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-all"
              >
                <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Estoque</span>
                <span className="sm:hidden">Est.</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="financial" className="space-y-4">
              <ModernCard
                title="Relatórios Financeiros"
                description="Visualize métricas financeiras e indicadores de desempenho"
                className="w-full max-w-full"
                contentClassName="overflow-hidden"
              >
                <div className="w-full overflow-hidden">
                  <FinanceReports />
                </div>
              </ModernCard>
            </TabsContent>
            
            <TabsContent value="appointments" className="space-y-4">
              <ModernCard
                title="Relatórios de Agendamentos"
                description="Analise dados de agendamentos e performance"
                className="w-full max-w-full"
                contentClassName="overflow-hidden"
              >
                <div className="w-full overflow-hidden">
                  <AppointmentReports />
                </div>
              </ModernCard>
            </TabsContent>
            
            <TabsContent value="marketing" className="space-y-4">
              <ModernCard
                title="Relatórios de Marketing"
                description="Acompanhe campanhas e estratégias de marketing"
                className="w-full max-w-full"
                contentClassName="overflow-hidden"
              >
                <div className="w-full overflow-hidden">
                  <MarketingReports />
                </div>
              </ModernCard>
            </TabsContent>
            
            <TabsContent value="clients" className="space-y-4">
              <ModernCard
                title="Relatórios de Clientes"
                description="Analise comportamento e dados dos clientes"
                className="w-full max-w-full"
                contentClassName="overflow-hidden"
              >
                <div className="w-full overflow-hidden">
                  <ClientReports />
                </div>
              </ModernCard>
            </TabsContent>
            
            <TabsContent value="inventory" className="space-y-4">
              <ModernCard
                title="Relatórios de Estoque"
                description="Controle de produtos e inventário"
                className="w-full max-w-full"
                contentClassName="overflow-hidden"
              >
                <div className="w-full overflow-hidden">
                  <InventoryReports />
                </div>
              </ModernCard>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminAnalytics;
