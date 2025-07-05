
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/admin/AdminLayout';
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
    <AdminLayout title="Relatórios e Analytics">
      <div className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-8 bg-black/40 border border-white/10">
            <TabsTrigger value="financial" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500">
              <FileChartColumn className="h-4 w-4" />
              <span className="hidden md:inline">Financeiro</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500">
              <Calendar className="h-4 w-4" />
              <span className="hidden md:inline">Agendamentos</span>
            </TabsTrigger>
            <TabsTrigger value="marketing" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500">
              <Tag className="h-4 w-4" />
              <span className="hidden md:inline">Marketing</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500">
              <Package className="h-4 w-4" />
              <span className="hidden md:inline">Estoque</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="financial" className="space-y-4">
            <ModernCard
              title="Relatórios Financeiros"
              description="Visualize métricas financeiras e indicadores de desempenho"
              gradient="from-blue-500/10 to-cyan-600/10"
            >
              <FinanceReports />
            </ModernCard>
          </TabsContent>
          
          <TabsContent value="appointments" className="space-y-4">
            <ModernCard
              title="Relatórios de Agendamentos"
              description="Analise dados de agendamentos e performance"
              gradient="from-green-500/10 to-emerald-600/10"
            >
              <AppointmentReports />
            </ModernCard>
          </TabsContent>
          
          <TabsContent value="marketing" className="space-y-4">
            <ModernCard
              title="Relatórios de Marketing"
              description="Acompanhe campanhas e estratégias de marketing"
              gradient="from-red-500/10 to-pink-600/10"
            >
              <MarketingReports />
            </ModernCard>
          </TabsContent>
          
          <TabsContent value="clients" className="space-y-4">
            <ModernCard
              title="Relatórios de Clientes"
              description="Analise comportamento e dados dos clientes"
              gradient="from-purple-500/10 to-violet-600/10"
            >
              <ClientReports />
            </ModernCard>
          </TabsContent>
          
          <TabsContent value="inventory" className="space-y-4">
            <ModernCard
              title="Relatórios de Estoque"
              description="Controle de produtos e inventário"
              gradient="from-orange-500/10 to-yellow-600/10"
            >
              <InventoryReports />
            </ModernCard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
