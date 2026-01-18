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
      // Fetch clients directly from painel_clientes including whatsapp field
      const { data, error } = await supabase
        .from('painel_clientes')
        .select('id, nome, email, telefone, data_nascimento, whatsapp')
        .not('data_nascimento', 'is', null);

      if (error) throw new Error(error.message);

      // Map to expected format with whatsapp support
      const mappedData = (data || []).map(c => ({
        id: c.id,
        name: c.nome,
        email: c.email,
        phone: c.telefone || c.whatsapp,
        whatsapp: c.whatsapp,
        birth_date: c.data_nascimento
      }));

      let filteredData = mappedData;
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
    { key: 'today', label: '🎂 Hoje', gradient: 'from-pink-600 to-rose-600' },
    { key: 'week', label: '📅 Semana', gradient: 'from-purple-600 to-indigo-600' },
    { key: 'month', label: '📆 Mês', gradient: 'from-blue-600 to-cyan-600' },
  ];

  return (
    <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header com estilo da barbearia */}
      <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-urbana-gold to-yellow-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl">🎉</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-playfair text-gray-900">
                Aniversariantes
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm font-raleway">
                Celebre com seus clientes em momentos especiais
              </p>
            </div>
          </div>
        </motion.div>

        {/* Barra de filtros com cores fixas */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2">
          {filters.map(item => (
            <motion.button
              key={item.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilter(item.key as FilterType)}
              className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-md bg-gradient-to-r ${item.gradient} text-white ${
                filter === item.key
                  ? 'ring-4 ring-offset-2 ring-gray-300 scale-105'
                  : 'opacity-80 hover:opacity-100'
              }`}
            >
              {item.label}
            </motion.button>
          ))}
        </div>

        {/* Lista com visual melhorado */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-x-auto"
        >
          <Card className="bg-white border-2 border-gray-200 shadow-lg rounded-xl min-w-full overflow-hidden">
            <div className="bg-gradient-to-r from-urbana-gold via-yellow-500 to-urbana-gold h-1"></div>
            <BirthdayList
              clients={clients || []}
              isLoading={isLoading}
              filter={filter}
              onRefresh={() => refetch()}
            />
          </Card>
        </motion.div>

      </div>
    );
  };

export default BirthdayManagement;
