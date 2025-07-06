
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
      let targetMonth = null;
      
      if (filter === 'month') {
        targetMonth = new Date().getMonth() + 1;
      } else if (filter === 'today') {
        targetMonth = new Date().getMonth() + 1;
      } else if (filter === 'week') {
        targetMonth = new Date().getMonth() + 1;
      }

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
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Aniversariantes</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Gerencie aniversários e campanhas especiais</p>
        </div>
      </div>

      <Card className="bg-white border-gray-200 w-full">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
            Filtros de Aniversariantes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <BirthdayFilters filter={filter} onFilterChange={setFilter} />
        </CardContent>
      </Card>

      <div className="w-full overflow-x-auto">
        <BirthdayList 
          clients={clients || []}
          isLoading={isLoading}
          filter={filter}
          onRefresh={() => refetch()}
        />
      </div>
    </div>
  );
};

export default BirthdayManagement;
