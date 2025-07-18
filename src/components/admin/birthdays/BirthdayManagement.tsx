
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

      // Chamada da função RPC sem o parâmetro table_name
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
    <div className="w-full h-full bg-black text-white p-4 sm:p-6">
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Aniversariantes</h1>
            <p className="text-sm text-gray-400 mt-1">Gerencie aniversários e campanhas especiais</p>
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-700 w-full shadow-sm">
          <CardHeader className="pb-4 px-6">
            <CardTitle className="text-lg font-bold text-white">
              Filtros de Aniversariantes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <BirthdayFilters filter={filter} onFilterChange={setFilter} />
          </CardContent>
        </Card>

        <div className="w-full overflow-hidden rounded-lg shadow-sm border border-gray-700 bg-gray-900">
          <BirthdayList 
            clients={clients || []}
            isLoading={isLoading}
            filter={filter}
            onRefresh={() => refetch()}
          />
        </div>
      </div>
    </div>
  );
};

export default BirthdayManagement;
