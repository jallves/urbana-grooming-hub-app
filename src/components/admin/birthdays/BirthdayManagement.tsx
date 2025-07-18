import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import BirthdayList from './BirthdayList';
import BirthdayFilters from './BirthdayFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export type FilterType = 'today' | 'week' | 'month';

const BirthdayManagement: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('today');

  const { data: clients, isLoading, error, refetch } = useQuery({
    queryKey: ['birthday-clients', filter],
    queryFn: async () => {
      let targetMonth = new Date().getMonth() + 1;
      
      const { data, error } = await supabase.rpc('get_birthday_clients', {
        target_month: targetMonth
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      let filteredData = data || [];
      
      if (filter === 'today') {
        const today = new Date();
        filteredData = filteredData.filter(client => {
          if (!client.birth_date) return false;
          const birthDate = new Date(client.birth_date);
          return birthDate.getDate() === today.getDate() && 
                 birthDate.getMonth() === today.getMonth();
        });
      } else if (filter === 'week') {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        filteredData = filteredData.filter(client => {
          if (!client.birth_date) return false;
          const birthDate = new Date(client.birth_date);
          const currentYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
          return currentYearBirthday >= startOfWeek && currentYearBirthday <= endOfWeek;
        });
      }
      
      return filteredData;
    }
  });

  if (error) {
    toast.error('Erro ao carregar aniversariantes', {
      description: (error as Error).message
    });
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Aniversariantes
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Gerencie aniversários e campanhas especiais
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Filtros */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg font-bold text-white">
                Filtros de Aniversariantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BirthdayFilters filter={filter} onFilterChange={setFilter} />
            </CardContent>
          </Card>

          {/* Lista */}
          <Card className="bg-gray-800 border-gray-700">
            <BirthdayList 
              clients={clients || []}
              isLoading={isLoading}
              filter={filter}
              onRefresh={() => refetch()}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BirthdayManagement;
