
import React, { useState } from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Download, Filter, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ModuleAccessGuard from '@/components/auth/ModuleAccessGuard';

const BarberCommissions: React.FC = () => {
  const [period, setPeriod] = useState<string>('month');
  
  const dummyCommissions = [
    {
      id: '1',
      date: '2023-07-15',
      client: 'Ricardo Almeida',
      service: 'Corte + Barba',
      value: 80,
      commission: 48
    },
    {
      id: '2',
      date: '2023-07-15',
      client: 'Carlos Eduardo',
      service: 'Corte Degradê',
      value: 60,
      commission: 36
    },
    {
      id: '3',
      date: '2023-07-14',
      client: 'Marcos Paulo',
      service: 'Barba Completa',
      value: 40,
      commission: 24
    }
  ];
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  const totalCommission = dummyCommissions.reduce((sum, item) => sum + item.commission, 0);

  return (
    <ModuleAccessGuard moduleId="reports">
      <BarberLayout title="Comissões">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Minhas Comissões</h2>
              <p className="text-zinc-400">Acompanhe seus ganhos e histórico de comissões</p>
            </div>
            <Button className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400">Comissão do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(totalCommission)}</p>
                <p className="text-xs text-zinc-400">7 serviços realizados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400">Previsão para o Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(totalCommission * 4)}</p>
                <p className="text-xs text-green-500">+15% que o mês anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400">Média por Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalCommission / dummyCommissions.length)}
                </p>
                <p className="text-xs text-zinc-400">Baseado no período atual</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Histórico de Comissões</CardTitle>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Esta Semana</SelectItem>
                      <SelectItem value="month">Este Mês</SelectItem>
                      <SelectItem value="quarter">Este Trimestre</SelectItem>
                      <SelectItem value="year">Este Ano</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="relative w-full sm:w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      type="search"
                      placeholder="Buscar..."
                      className="pl-8 w-full"
                    />
                  </div>

                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dummyCommissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>{formatDate(commission.date)}</TableCell>
                      <TableCell>{commission.client}</TableCell>
                      <TableCell>{commission.service}</TableCell>
                      <TableCell className="text-right">{formatCurrency(commission.value)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(commission.commission)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </BarberLayout>
    </ModuleAccessGuard>
  );
};

export default BarberCommissions;
