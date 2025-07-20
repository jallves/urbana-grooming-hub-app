
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

const AdminAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('financial');

  return (
    <AdminRoute>
      <AdminLayout title="Relatórios e Analytics">
        <div className="h-full min-h-0 flex flex-col bg-gray-950 text-gray-100">
          <div className="p-3 sm:p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid grid-cols-2 sm:grid-cols-5 bg-gray-800 border border-gray-700 h-auto mb-3">
                <TabsTrigger
                  value="financial"
                  className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-gray-300"
                >
                  <FileChartColumn className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Financeiro</span>
                  <span className="sm:hidden">Fin.</span>
                </TabsTrigger>
                <TabsTrigger
                  value="appointments"
                  className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-gray-300"
                >
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Agendamentos</span>
                  <span className="sm:hidden">Agend.</span>
                </TabsTrigger>
                <TabsTrigger
                  value="marketing"
                  className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-gray-300"
                >
                  <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Marketing</span>
                  <span className="sm:hidden">Mark.</span>
                </TabsTrigger>
                <TabsTrigger
                  value="clients"
                  className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white text-gray-300"
                >
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Clientes</span>
                  <span className="sm:hidden">Cli.</span>
                </TabsTrigger>
                <TabsTrigger
                  value="inventory"
                  className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-300"
                >
                  <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Estoque</span>
                  <span className="sm:hidden">Est.</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 min-h-0">
                <TabsContent value="financial" className="h-full m-0">
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg h-full overflow-auto">
                    <div className="p-3 sm:p-4 border-b border-gray-700">
                      <h3 className="text-lg font-semibold text-urbana-gold">Relatórios Financeiros</h3>
                      <p className="text-sm text-gray-400">Visualize métricas financeiras e indicadores de desempenho</p>
                    </div>
                    <div className="p-3 sm:p-4">
                      <FinanceReports />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="appointments" className="h-full m-0">
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg h-full overflow-auto">
                    <div className="p-3 sm:p-4 border-b border-gray-700">
                      <h3 className="text-lg font-semibold text-urbana-gold">Relatórios de Agendamentos</h3>
                      <p className="text-sm text-gray-400">Analise dados de agendamentos e performance</p>
                    </div>
                    <div className="p-3 sm:p-4">
                      <AppointmentReports />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="marketing" className="h-full m-0">
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg h-full overflow-auto">
                    <div className="p-3 sm:p-4 border-b border-gray-700">
                      <h3 className="text-lg font-semibold text-urbana-gold">Relatórios de Marketing</h3>
                      <p className="text-sm text-gray-400">Acompanhe campanhas e estratégias de marketing</p>
                    </div>
                    <div className="p-3 sm:p-4">
                      <MarketingReports />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="clients" className="h-full m-0">
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg h-full overflow-auto">
                    <div className="p-3 sm:p-4 border-b border-gray-700">
                      <h3 className="text-lg font-semibold text-urbana-gold">Relatórios de Clientes</h3>
                      <p className="text-sm text-gray-400">Analise comportamento e dados dos clientes</p>
                    </div>
                    <div className="p-3 sm:p-4">
                      <ClientReports />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="inventory" className="h-full m-0">
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg h-full overflow-auto">
                    <div className="p-3 sm:p-4 border-b border-gray-700">
                      <h3 className="text-lg font-semibold text-urbana-gold">Relatórios de Estoque</h3>
                      <p className="text-sm text-gray-400">Controle de produtos e inventário</p>
                    </div>
                    <div className="p-3 sm:p-4">
                      <InventoryReports />
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminAnalytics;
