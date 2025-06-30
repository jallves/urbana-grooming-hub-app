
import { useEffect, useState } from 'react';
import { Calendar, List, Download, Plus, Filter, Search } from 'lucide-react';
import { toast } from "sonner";
import { motion } from 'framer-motion';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import { AppointmentViewMode } from '@/types/admin';
import LoadingSkeleton from '@/components/admin/LoadingSkeleton';
import AppointmentCalendar from '@/components/admin/appointments/calendar/AppointmentCalendar';
import AppointmentList from '@/components/admin/appointments/list/AppointmentList';
import AppointmentStats from '@/components/admin/appointments/AppointmentStats';
import AppointmentFiltersBar from '@/components/admin/appointments/AppointmentFiltersBar';

const AdminAppointments = () => {
  const [viewMode, setViewMode] = useState<AppointmentViewMode>('calendar');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const setupRealtimeUpdates = async () => {
      try {
        const channel = supabase
          .channel('appointment-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'appointments',
            },
            () => {
              toast.info('Agendamento atualizado', {
                description: 'Os dados foram atualizados em tempo real.',
              });
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        toast.error('Erro de conexão', {
          description: 'Falha ao monitorar atualizações em tempo real.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    const cleanup = setupRealtimeUpdates();

    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, []);

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as AppointmentViewMode);
  };

  const handleExport = () => {
    toast.info('Exportação em andamento...', {
      description: 'Funcionalidade de exportar ainda não implementada.',
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 bg-black min-h-screen">
          <LoadingSkeleton />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminRoute allowedRoles={['admin', 'barber']}>
      <AdminLayout>
        <div className="flex flex-col h-full bg-black text-white">
          {/* Header Section */}
          <div className="border-b border-gray-700 bg-gray-900 px-6 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold font-playfair text-urbana-gold flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-urbana-gold" />
                  Agendamentos
                </h1>
                <p className="text-sm text-gray-400 mt-1 font-raleway">
                  Gerencie e visualize todos os horários agendados com elegância
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 lg:flex-none lg:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por cliente, serviço..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-urbana-gold focus:ring-urbana-gold"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2 border-gray-600 text-gray-300 hover:text-urbana-gold hover:border-urbana-gold bg-gray-800"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="gap-2 border-gray-600 text-gray-300 hover:text-urbana-gold hover:border-urbana-gold bg-gray-800"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
                <Button 
                  size="sm" 
                  className="gap-2 bg-urbana-gold text-black hover:bg-urbana-gold/90 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Novo Agendamento
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="px-6 py-4 bg-gray-900/50">
            <AppointmentStats />
          </div>

          {/* Filters Bar */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 py-4 border-b border-gray-700 bg-gray-900"
            >
              <AppointmentFiltersBar />
            </motion.div>
          )}

          {/* Content Section */}
          <div className="flex-1 px-6 py-4 overflow-hidden bg-black">
            <Tabs value={viewMode} onValueChange={handleViewModeChange} className="h-full flex flex-col">
              <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto mb-4 bg-gray-800 border-gray-700">
                <TabsTrigger 
                  value="calendar" 
                  className="gap-2 data-[state=active]:bg-urbana-gold data-[state=active]:text-black text-gray-300"
                >
                  <Calendar className="h-4 w-4" />
                  Calendário
                </TabsTrigger>
                <TabsTrigger 
                  value="list" 
                  className="gap-2 data-[state=active]:bg-urbana-gold data-[state=active]:text-black text-gray-300"
                >
                  <List className="h-4 w-4" />
                  Lista
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="flex-1 mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <AppointmentCalendar searchQuery={searchQuery} />
                </motion.div>
              </TabsContent>

              <TabsContent value="list" className="flex-1 mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <AppointmentList searchQuery={searchQuery} />
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminAppointments;
