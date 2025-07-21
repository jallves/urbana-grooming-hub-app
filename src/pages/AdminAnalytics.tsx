
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import AnalyticsOverview from '@/components/admin/analytics/AnalyticsOverview';
import FinancialMetrics from '@/components/admin/analytics/FinancialMetrics';
import AppointmentMetrics from '@/components/admin/analytics/AppointmentMetrics';
import ClientMetrics from '@/components/admin/analytics/ClientMetrics';
import PerformanceMetrics from '@/components/admin/analytics/PerformanceMetrics';
import { TrendingUp, Calendar, Users, DollarSign, Target } from 'lucide-react';

const AdminAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Visão Geral', shortLabel: 'Geral', icon: TrendingUp },
    { id: 'financial', label: 'Financeiro', shortLabel: 'Fin.', icon: DollarSign },
    { id: 'appointments', label: 'Agendamentos', shortLabel: 'Agend.', icon: Calendar },
    { id: 'clients', label: 'Clientes', shortLabel: 'Client.', icon: Users },
    { id: 'performance', label: 'Performance', shortLabel: 'Perf.', icon: Target },
  ];

  return (
    <AdminRoute>
      <AdminLayout title="Analytics & Insights">
        <div className="h-full bg-gray-950 text-gray-100">
          <div className="h-full flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid grid-cols-3 sm:grid-cols-5 bg-gray-800 border border-gray-700 mb-4 mx-4 mt-2">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-1 py-2 px-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-gray-300 hover:text-white transition-all"
                  >
                    <tab.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex-1 px-4 pb-4 overflow-hidden">
                <TabsContent value="overview" className="h-full m-0">
                  <AnalyticsOverview />
                </TabsContent>

                <TabsContent value="financial" className="h-full m-0">
                  <FinancialMetrics />
                </TabsContent>

                <TabsContent value="appointments" className="h-full m-0">
                  <AppointmentMetrics />
                </TabsContent>

                <TabsContent value="clients" className="h-full m-0">
                  <ClientMetrics />
                </TabsContent>

                <TabsContent value="performance" className="h-full m-0">
                  <PerformanceMetrics />
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
