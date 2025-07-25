
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Filters {
  mes: number;
  ano: number;
  tipo: string;
  barbeiro: string;
}

interface FiltrosFinanceirosProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const FiltrosFinanceiros: React.FC<FiltrosFinanceirosProps> = ({ filters, onFiltersChange }) => {
  const { data: barbeiros } = useQuery({
    queryKey: ['barbeiros-finance'],
    queryFn: async () => {
      const { data } = await supabase
        .from('staff')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      return data || [];
    }
  });

  const meses = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-32">
            <Select
              value={filters.mes.toString()}
              onValueChange={(value) => onFiltersChange({ ...filters, mes: parseInt(value) })}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {meses.map(mes => (
                  <SelectItem key={mes.value} value={mes.value.toString()}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-32">
            <Select
              value={filters.ano.toString()}
              onValueChange={(value) => onFiltersChange({ ...filters, ano: parseInt(value) })}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {anos.map(ano => (
                  <SelectItem key={ano} value={ano.toString()}>
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-32">
            <Select
              value={filters.tipo}
              onValueChange={(value) => onFiltersChange({ ...filters, tipo: value })}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-32">
            <Select
              value={filters.barbeiro}
              onValueChange={(value) => onFiltersChange({ ...filters, barbeiro: value })}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Barbeiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {barbeiros?.map(barbeiro => (
                  <SelectItem key={barbeiro.id} value={barbeiro.id}>
                    {barbeiro.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FiltrosFinanceiros;
