
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BookingSettings from '@/components/admin/settings/BookingSettings';
import TimeOffManagement from '@/components/admin/settings/TimeOffManagement';
import { Settings, Clock, Calendar } from 'lucide-react';

const AdminBookingSettings: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-yellow-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configurações de Agendamento</h1>
            <p className="text-gray-700">
              Configure horários de funcionamento, folgas e regras de agendamento
            </p>
          </div>
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-yellow-100 border border-yellow-300 rounded-lg p-1">
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-sm transition-colors hover:bg-yellow-300"
            >
              <Clock className="h-4 w-4" />
              Configurações Gerais
            </TabsTrigger>
            <TabsTrigger 
              value="timeoff" 
              className="flex items-center gap-2 data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-sm transition-colors hover:bg-yellow-300"
            >
              <Calendar className="h-4 w-4" />
              Folgas e Feriados
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings" className="mt-6">
            <BookingSettings />
          </TabsContent>
          
          <TabsContent value="timeoff" className="mt-6">
            <TimeOffManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminBookingSettings;
