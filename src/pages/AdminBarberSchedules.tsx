import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import dynamic from 'next/dynamic';
import AdminRoute from '@/components/auth/AdminRoute';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSkeleton from '@/components/admin/LoadingSkeleton';

const BarberScheduleManagement = dynamic(
  () => import('@/components/admin/schedules/BarberScheduleManagement'),
  { 
    loading: () => <LoadingSkeleton />,
    ssr: false 
  }
);

const AdminBarberSchedules: React.FC = () => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedBarber, setSelectedBarber] = useState<string>('all');

  return (
    <AdminRoute allowedRoles={['admin', 'manager']}>
      <AdminLayout>
        <div className="space-y-6">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Horários</h1>
              <p className="text-muted-foreground">
                Configure os horários de trabalho da equipe
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select 
                value={viewMode}
                onValueChange={(value) => setViewMode(value as 'week' | 'month')}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Visualização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Semanal
                    </div>
                  </SelectItem>
                  <SelectItem value="month">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Mensal
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={selectedBarber}
                onValueChange={setSelectedBarber}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Todos barbeiros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Barbeiros</SelectItem>
                  {/* Barbeiros seriam carregados dinamicamente */}
                  <SelectItem value="1">João Silva</SelectItem>
                  <SelectItem value="2">Maria Santos</SelectItem>
                </SelectContent>
              </Select>
              
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Horário
              </Button>
            </div>
          </header>

          <BarberScheduleManagement 
            viewMode={viewMode} 
            barberId={selectedBarber !== 'all' ? selectedBarber : undefined}
          />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminBarberSchedules;