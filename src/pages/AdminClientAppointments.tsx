import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientAppointmentDashboard from '@/components/admin/client-appointments/ClientAppointmentDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CouponList from '@/components/admin/marketing/CouponList';
import { CalendarDays, Ticket } from 'lucide-react';

export default function AdminClientAppointments() {
  return (
    <AdminLayout 
      title="Agendamentos de Clientes" 
      description="Visualize e gerencie todos os agendamentos dos clientes"
      icon="📋"
    >
      <div className="w-full h-full">
        <Tabs defaultValue="agendamentos" className="w-full">
          <div className="px-3 sm:px-4 md:px-6 pt-4">
            <TabsList className="bg-white border border-gray-200 shadow-sm">
              <TabsTrigger value="agendamentos" className="data-[state=active]:bg-urbana-gold data-[state=active]:text-black">
                <CalendarDays className="w-4 h-4 mr-2" />
                Agendamentos
              </TabsTrigger>
              <TabsTrigger value="cupons" className="data-[state=active]:bg-urbana-gold data-[state=active]:text-black">
                <Ticket className="w-4 h-4 mr-2" />
                Cupons de Desconto
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="agendamentos" key="tab-agendamentos" className="mt-0">
            <ClientAppointmentDashboard />
          </TabsContent>

          <TabsContent value="cupons" key="tab-cupons" className="mt-0">
            <div className="p-3 sm:p-4 md:p-6">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900 font-playfair">
                    Cupons de Desconto
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Crie, ative, inative e edite os cupons que os clientes usam ao agendar pelo painel.
                  </p>
                </div>
                <CouponList />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
