
import React, { useState } from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, ArrowUp, ArrowDown } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

// Mock data for commissions
const mockCommissions = [
  {
    id: '1',
    date: '2025-05-10',
    clientName: 'João Silva',
    service: 'Corte Degradê',
    value: 50,
    commission: 30,
    status: 'pago'
  },
  {
    id: '2',
    date: '2025-05-10',
    clientName: 'Pedro Almeida',
    service: 'Barba',
    value: 35,
    commission: 21,
    status: 'pago'
  },
  {
    id: '3',
    date: '2025-05-09',
    clientName: 'Carlos Mendes',
    service: 'Corte + Barba',
    value: 75,
    commission: 45,
    status: 'pago'
  },
  {
    id: '4',
    date: '2025-05-09',
    clientName: 'Lucas Ferreira',
    service: 'Corte Tesoura',
    value: 60,
    commission: 36,
    status: 'pago'
  },
  {
    id: '5',
    date: '2025-05-08',
    clientName: 'Rafael Costa',
    service: 'Corte Degradê',
    value: 50,
    commission: 30,
    status: 'pago'
  },
  {
    id: '6',
    date: '2025-05-07',
    clientName: 'Marcos Santos',
    service: 'Barba',
    value: 35,
    commission: 21,
    status: 'pago'
  }
];

// Mock data for payments
const mockPayments = [
  {
    id: '1',
    date: '2025-05-01',
    period: 'Abril 2025',
    amount: 1200,
    method: 'Pix',
    receipt: 'rec123.pdf'
  },
  {
    id: '2',
    date: '2025-04-01',
    period: 'Março 2025',
    amount: 1350,
    method: 'Transferência',
    receipt: 'rec456.pdf'
  },
  {
    id: '3',
    date: '2025-03-01',
    period: 'Fevereiro 2025',
    amount: 1100,
    method: 'Pix',
    receipt: 'rec789.pdf'
  }
];

// Chart data for daily earnings
const chartData = {
  labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
  data: [120, 160, 150, 180, 200, 170, 0]
};

const BarberCommissions: React.FC = () => {
  const [period, setPeriod] = useState('day');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedCommissions = [...mockCommissions].sort((a, b) => {
    if (sortField === 'date') {
      return sortDirection === 'asc' 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortField === 'value') {
      return sortDirection === 'asc' ? a.value - b.value : b.value - a.value;
    }
    return 0;
  });

  const totalEarned = mockCommissions.reduce((sum, item) => sum + item.commission, 0);
  
  // Calculate daily earnings for the past 7 days
  const getTodayEarnings = () => {
    const today = new Date().toISOString().split('T')[0];
    return mockCommissions
      .filter(item => item.date === today)
      .reduce((sum, item) => sum + item.commission, 0);
  };

  const getWeekEarnings = () => {
    const sevenDaysAgo = subDays(new Date(), 7).toISOString().split('T')[0];
    return mockCommissions
      .filter(item => item.date >= sevenDaysAgo)
      .reduce((sum, item) => sum + item.commission, 0);
  };

  const getMonthEarnings = () => {
    const currentMonth = new Date().getMonth() + 1;
    return mockCommissions
      .filter(item => {
        const itemMonth = new Date(item.date).getMonth() + 1;
        return itemMonth === currentMonth;
      })
      .reduce((sum, item) => sum + item.commission, 0);
  };
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const handleDownload = (receiptId: string) => {
    console.log(`Downloading receipt: ${receiptId}`);
    // Implementation would connect to backend to download receipt
  };

  return (
    <BarberLayout title="Comissões e Ganhos">
      <div className="space-y-6">
        {/* Cards for summary information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Ganhos do Dia</CardTitle>
              <CardDescription className="text-gray-400">
                {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">R$ {getTodayEarnings().toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Ganhos da Semana</CardTitle>
              <CardDescription className="text-gray-400">Últimos 7 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">R$ {getWeekEarnings().toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Ganhos do Mês</CardTitle>
              <CardDescription className="text-gray-400">
                {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">R$ {getMonthEarnings().toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Chart for earnings visualization */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <CardTitle className="text-white">Histórico de Ganhos</CardTitle>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectItem value="day">Diário</SelectItem>
                  <SelectItem value="week">Semanal</SelectItem>
                  <SelectItem value="month">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 mt-2">
              {/* Simple bar chart representation */}
              <div className="flex h-full items-end gap-2">
                {chartData.data.map((value, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="bg-white w-full rounded-t-sm"
                      style={{ height: `${(value / 200) * 100}%` }}
                    ></div>
                    <div className="text-gray-400 text-xs mt-2">{chartData.labels[index]}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for commission details and payment history */}
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="bg-zinc-900 border-zinc-800">
            <TabsTrigger value="services" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Serviços
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Histórico de Pagamentos
            </TabsTrigger>
          </TabsList>
          
          {/* Services Tab */}
          <TabsContent value="services">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Detalhamento por Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-zinc-900">
                      <TableHead 
                        className="text-white cursor-pointer" 
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center">
                          Data {renderSortIcon('date')}
                        </div>
                      </TableHead>
                      <TableHead className="text-white">Cliente</TableHead>
                      <TableHead className="text-white">Serviço</TableHead>
                      <TableHead 
                        className="text-white cursor-pointer text-right" 
                        onClick={() => handleSort('value')}
                      >
                        <div className="flex items-center justify-end">
                          Valor {renderSortIcon('value')}
                        </div>
                      </TableHead>
                      <TableHead className="text-white text-right">Comissão (60%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCommissions.map((commission) => (
                      <TableRow key={commission.id} className="border-zinc-800 hover:bg-zinc-800">
                        <TableCell className="text-white">
                          {format(new Date(commission.date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-white">{commission.clientName}</TableCell>
                        <TableCell className="text-white">{commission.service}</TableCell>
                        <TableCell className="text-white text-right">R$ {commission.value.toFixed(2)}</TableCell>
                        <TableCell className="text-white text-right">R$ {commission.commission.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {/* Total row */}
                    <TableRow className="bg-zinc-800 border-zinc-700">
                      <TableCell colSpan={4} className="text-white font-semibold">Total</TableCell>
                      <TableCell className="text-white font-semibold text-right">R$ {totalEarned.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Payments History Tab */}
          <TabsContent value="payments">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Histórico de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-zinc-900">
                      <TableHead className="text-white">Data</TableHead>
                      <TableHead className="text-white">Período</TableHead>
                      <TableHead className="text-white">Método</TableHead>
                      <TableHead className="text-white text-right">Valor</TableHead>
                      <TableHead className="text-white text-right">Comprovante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockPayments.map((payment) => (
                      <TableRow key={payment.id} className="border-zinc-800 hover:bg-zinc-800">
                        <TableCell className="text-white">
                          {format(new Date(payment.date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-white">{payment.period}</TableCell>
                        <TableCell className="text-white">{payment.method}</TableCell>
                        <TableCell className="text-white text-right">R$ {payment.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-zinc-700 text-white hover:bg-zinc-800"
                            onClick={() => handleDownload(payment.receipt)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BarberLayout>
  );
};

export default BarberCommissions;
