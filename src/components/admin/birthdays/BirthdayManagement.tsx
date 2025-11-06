import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import BirthdayList from './BirthdayList';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export type FilterType = 'today' | 'week' | 'month';

const BirthdayManagement: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('today');

  const { data: clients, isLoading, error, refetch } = useQuery({
    queryKey: ['birthday-clients', filter],
    queryFn: async () => {
      const targetMonth = new Date().getMonth() + 1;
      const { data, error } = await supabase.rpc('get_birthday_clients', {
        target_month: targetMonth,
      });

      if (error) throw new Error(error.message);

      let filteredData = data || [];
      const today = new Date();

      if (filter === 'today') {
        filteredData = filteredData.filter(client => {
          if (!client.birth_date) return false;
          const birthDate = new Date(client.birth_date);
          return (
            birthDate.getDate() === today.getDate() &&
            birthDate.getMonth() === today.getMonth()
          );
        });
      } else if (filter === 'week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        filteredData = filteredData.filter(client => {
          if (!client.birth_date) return false;
          const birthDate = new Date(client.birth_date);
          const currentYearBirthday = new Date(
            today.getFullYear(),
            birthDate.getMonth(),
            birthDate.getDate()
          );
          return (
            currentYearBirthday >= startOfWeek &&
            currentYearBirthday <= endOfWeek
          );
        });
      }

      return filteredData;
    },
  });

  if (error) {
    toast.error('Erro ao carregar aniversariantes', {
      description: (error as Error).message,
    });
  }

  const filters = [
    { key: 'today', label: 'Hoje' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mês' },
  ];

  return (
    <div className="w-full h-full bg-gray-900 text-white">
      <div className="w-full px-4 md:px-6 py-4 sm:py-6 space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center sm:text-left"
        >
          <h1 className="text-lg sm:text-3xl font-bold leading-tight">Aniversariantes</h1>
          <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto sm:mx-0">
            Gerencie aniversários e campanhas especiais
          </p>
        </motion.div>

        {/* Barra de filtros */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {filters.map(item => (
            <motion.button
              key={item.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(item.key as FilterType)}
              className={`flex-shrink-0 px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                filter === item.key
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {item.label}
            </motion.button>
          ))}
        </div>

        {/* Lista */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-x-auto"
        >
          <Card className="bg-gray-800 border border-gray-700 shadow-md rounded-xl min-w-full">
            <BirthdayList
              clients={clients || []}
              isLoading={isLoading}
              filter={filter}
              onRefresh={() => refetch()}
            />
          </Card>
        </motion.div>

      </div>
    </div>
  );
};

export default BirthdayManagement;
