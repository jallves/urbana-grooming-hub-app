
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSkeleton from '@/components/admin/LoadingSkeleton';

// Componente temporário até criarmos o BarberScheduleManagement
const BarberScheduleManagement: React.FC<{ viewMode: string; barberId?: string }> = ({ viewMode, barberId }) => {
  return (
    <div className="p-8 text-center">
      <h3 className="text-lg font-semibold mb-2">Gerenciamento de Horários</h3>
      <p className="text-muted-foreground">
        Visualização: {viewMode === 'week' ? 'Semanal' : 'Mensal'}
        {barberId && ` - Barbeiro: ${barberId}`}
      </p>
    </div>
  );
};

const AdminBarberSchedules: React.FC = () => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedBarber, setSelectedBarber] = useState<string>('all');

  return (
    <AdminRoute>
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
