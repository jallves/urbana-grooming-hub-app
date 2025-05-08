
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FinanceReports from '../components/admin/finance/FinanceReports';
import AppointmentReports from '../components/admin/reports/AppointmentReports';
import MarketingReports from '../components/admin/reports/MarketingReports';
import ClientReports from '../components/admin/reports/ClientReports';
import InventoryReports from '../components/admin/reports/InventoryReports';
import { FileChartColumn, Calendar, Tag, Users, Package } from 'lucide-react';

const AdminAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('financial');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Relatórios e Analytics</h1>
          <p className="text-gray-500">Visualize métricas de desempenho e indicadores de negócio</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <FileChartColumn className="h-4 w-4" />
              <span className="hidden md:inline">Financeiro</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden md:inline">Agendamentos</span>
            </TabsTrigger>
            <TabsTrigger value="marketing" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden md:inline">Marketing</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden md:inline">Estoque</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="financial" className="space-y-4">
            <FinanceReports />
          </TabsContent>
          
          <TabsContent value="appointments" className="space-y-4">
            <AppointmentReports />
          </TabsContent>
          
          <TabsContent value="marketing" className="space-y-4">
            <MarketingReports />
          </TabsContent>
          
          <TabsContent value="clients" className="space-y-4">
            <ClientReports />
          </TabsContent>
          
          <TabsContent value="inventory" className="space-y-4">
            <InventoryReports />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
