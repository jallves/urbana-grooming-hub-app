
import React, { useState } from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format, subDays, isWithinInterval, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, Filter, Calendar as CalendarIcon, DollarSign, FileText, TrendingUp } from 'lucide-react';

// Types for commission data
interface CommissionItem {
  id: string;
  date: Date;
  client: string;
  service: string;
  value: number;
  commission: number;
  percentage: number;
  status: 'pendente' | 'pago';
}

// Types for payment history
interface PaymentItem {
  id: string;
  date: Date;
  value: number;
  method: string;
  description: string;
  reference: string; // Month or period reference
  receipt?: string; // URL to receipt PDF
}

const BarberCommissions: React.FC = () => {
  const { user } = useAuth();
  const [periodFilter, setPeriodFilter] = useState<'day' | 'week' | 'month'>('month');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<PaymentItem | null>(null);

  // Mock data for commissions
  const mockCommissions: CommissionItem[] = [
    {
      id: '1',
      date: new Date(2025, 4, 12),
      client: 'João Silva',
      service: 'Corte Degradê',
      value: 50,
      commission: 30,
      percentage: 60,
      status: 'pago'
    },
    {
      id: '2',
      date: new Date(2025, 4, 11),
      client: 'Pedro Almeida',
      service: 'Barba',
      value: 35,
      commission: 21,
      percentage: 60,
      status: 'pago'
    },
    {
      id: '3',
      date: new Date(2025, 4, 10),
      client: 'Carlos Mendes',
      service: 'Corte + Barba',
      value: 75,
      commission: 45,
      percentage: 60,
      status: 'pago'
    },
    {
      id: '4',
      date: subDays(new Date(), 3),
      client: 'Lucas Ferreira',
      service: 'Corte Tesoura',
      value: 60,
      commission: 36,
      percentage: 60,
      status: 'pendente'
    },
    {
      id: '5',
      date: subDays(new Date(), 5),
      client: 'Marcos Oliveira',
      service: 'Corte Degradê',
      value: 50,
      commission: 30,
      percentage: 60,
      status: 'pendente'
    }
  ];

  // Mock data for payment history
  const mockPayments: PaymentItem[] = [
    {
      id: '1',
      date: new Date(2025, 3, 30), // April 30th
      value: 1254.50,
      method: 'Transferência',
      description: 'Pagamento do mês de Abril',
      reference: 'Abril/2025',
      receipt: '/receipt-april.pdf'
    },
    {
      id: '2',
      date: new Date(2025, 2, 31), // March 31st
      value: 1120.80,
      method: 'Pix',
      description: 'Pagamento do mês de Março',
      reference: 'Março/2025',
      receipt: '/receipt-march.pdf'
    },
    {
      id: '3',
      date: new Date(2025, 1, 28), // February 28th
      value: 980.40,
      method: 'Transferência',
      description: 'Pagamento do mês de Fevereiro',
      reference: 'Fevereiro/2025',
      receipt: '/receipt-feb.pdf'
    }
  ];

  // Filter commissions based on selected period
  const getFilteredCommissions = () => {
    return mockCommissions.filter(commission => {
      if (periodFilter === 'day') {
        return format(commission.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      } else if (periodFilter === 'week') {
        const today = new Date();
        const weekStart = subDays(today, 7);
        return isWithinInterval(commission.date, { start: weekStart, end: today });
      } else if (periodFilter === 'month') {
        // Filter by selected month
        return (
          commission.date >= startOfMonth(selectedMonth) &&
          commission.date <= endOfMonth(selectedMonth)
        );
      }
      return true;
    }).filter(commission => {
      // Filter by service if one is selected
      if (selectedService !== 'all') {
        return commission.service === selectedService;
      }
      return true;
    });
  };

  const filteredCommissions = getFilteredCommissions();

  // Calculate summary data
  const calculateSummary = () => {
    const total = filteredCommissions.reduce((sum, item) => sum + item.commission, 0);
    const paid = filteredCommissions
      .filter(item => item.status === 'pago')
      .reduce((sum, item) => sum + item.commission, 0);
    const pending = filteredCommissions
      .filter(item => item.status === 'pendente')
      .reduce((sum, item) => sum + item.commission, 0);
      
    return { total, paid, pending };
  };

  const summary = calculateSummary();

  // Prepare chart data
  const chartDataByDay = () => {
    // Group commissions by day
    const groupedData: Record<string, number> = {};
    
    filteredCommissions.forEach(item => {
      const dateKey = format(item.date, 'dd/MM');
      groupedData[dateKey] = (groupedData[dateKey] || 0) + item.commission;
    });
    
    // Convert to array format for recharts
    return Object.entries(groupedData).map(([date, value]) => ({
      date,
      value,
    }));
  };

  // Prepare service distribution data for pie chart
  const getServiceDistribution = () => {
    const distribution: Record<string, number> = {};
    
    filteredCommissions.forEach(item => {
      distribution[item.service] = (distribution[item.service] || 0) + item.commission;
    });
    
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const serviceDistribution = getServiceDistribution();
  const dailyData = chartDataByDay();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Get unique services from data
  const uniqueServices = Array.from(new Set(mockCommissions.map(item => item.service)));

  // Handle payment detail view
  const handleViewReceipt = (payment: PaymentItem) => {
    setSelectedPaymentDetail(payment);
  };

  return (
    <BarberLayout title="Controle de Comissões">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Total de Comissões</CardTitle>
              <CardDescription className="text-gray-400">
                {periodFilter === 'day' ? 'Hoje' : 
                 periodFilter === 'week' ? 'Últimos 7 dias' : 
                 `${format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-white mr-2" />
                <span className="text-2xl font-bold text-white">
                  R$ {summary.total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Comissões Pagas</CardTitle>
              <CardDescription className="text-gray-400">Valores já recebidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-2xl font-bold text-green-500">
                  R$ {summary.paid.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Comissões Pendentes</CardTitle>
              <CardDescription className="text-gray-400">A receber</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-amber-500 mr-2" />
                <span className="text-2xl font-bold text-amber-500">
                  R$ {summary.pending.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as 'day' | 'week' | 'month')}>
              <SelectTrigger className="w-[120px] bg-zinc-900 border-zinc-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                <SelectItem value="day">Hoje</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
              </SelectContent>
            </Select>
            
            {periodFilter === 'month' && (
              <Button 
                variant="outline" 
                className="border-zinc-700 text-white"
                onClick={() => setIsDatePickerOpen(true)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
              </Button>
            )}
            
            <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Selecionar Mês</DialogTitle>
                </DialogHeader>
                <div className="p-4 flex flex-col items-center space-y-4">
                  <div className="flex justify-between w-full">
                    <Button 
                      variant="outline" 
                      className="border-zinc-700 text-white"
                      onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
                    >
                      Mês Anterior
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-zinc-700 text-white"
                      onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                    >
                      Próximo Mês
                    </Button>
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedMonth}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedMonth(date);
                        setIsDatePickerOpen(false);
                      }
                    }}
                    className="p-3 pointer-events-auto rounded-md bg-zinc-900 text-white"
                    classNames={{
                      day_selected: "bg-white text-black hover:bg-gray-200 hover:text-black",
                      day_today: "bg-zinc-800 text-white",
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder="Todos os serviços" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
              <SelectItem value="all">Todos os serviços</SelectItem>
              {uniqueServices.map(service => (
                <SelectItem key={service} value={service}>{service}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="bg-zinc-900 border-zinc-800">
            <TabsTrigger 
              value="details" 
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Detalhes
            </TabsTrigger>
            <TabsTrigger 
              value="charts" 
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Gráficos
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Pagamentos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Detalhamento de Comissões</CardTitle>
                <CardDescription className="text-gray-400">
                  Lista de serviços e valores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left py-3 px-2">Data</th>
                        <th className="text-left py-3 px-2">Cliente</th>
                        <th className="text-left py-3 px-2">Serviço</th>
                        <th className="text-right py-3 px-2">Valor</th>
                        <th className="text-right py-3 px-2">Comissão (%)</th>
                        <th className="text-right py-3 px-2">Comissão (R$)</th>
                        <th className="text-center py-3 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCommissions.map((item) => (
                        <tr key={item.id} className="border-b border-zinc-800">
                          <td className="py-3 px-2">{format(item.date, 'dd/MM/yyyy')}</td>
                          <td className="py-3 px-2">{item.client}</td>
                          <td className="py-3 px-2">{item.service}</td>
                          <td className="py-3 px-2 text-right">R$ {item.value.toFixed(2).replace('.', ',')}</td>
                          <td className="py-3 px-2 text-right">{item.percentage}%</td>
                          <td className="py-3 px-2 text-right">R$ {item.commission.toFixed(2).replace('.', ',')}</td>
                          <td className="py-3 px-2 text-center">
                            <Badge className={item.status === 'pago' ? 'bg-green-500' : 'bg-amber-500'}>
                              {item.status === 'pago' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {filteredCommissions.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-gray-400">
                            Nenhuma comissão encontrada no período selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-zinc-800">
                        <td colSpan={5} className="py-3 px-2 text-right font-bold">Total:</td>
                        <td className="py-3 px-2 text-right font-bold">
                          R$ {summary.total.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-3 px-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="charts">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Comissões por Dia</CardTitle>
                  <CardDescription className="text-gray-400">
                    Distribuição das comissões no período
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {dailyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="date" tick={{ fill: '#ccc' }} />
                        <YAxis tick={{ fill: '#ccc' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }} 
                          formatter={(value) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, 'Comissão']}
                        />
                        <Bar dataKey="value" fill="#fff" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      Sem dados no período selecionado
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Distribuição por Serviço</CardTitle>
                  <CardDescription className="text-gray-400">
                    Comissões por tipo de serviço
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {serviceDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={serviceDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {serviceDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend formatter={(value) => <span style={{ color: '#ccc' }}>{value}</span>} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }}
                          formatter={(value) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, 'Comissão']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      Sem dados no período selecionado
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="payments">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Histórico de Pagamentos</CardTitle>
                <CardDescription className="text-gray-400">
                  Registro de pagamentos recebidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left py-3 px-2">Data</th>
                        <th className="text-left py-3 px-2">Referência</th>
                        <th className="text-left py-3 px-2">Método</th>
                        <th className="text-right py-3 px-2">Valor</th>
                        <th className="text-center py-3 px-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockPayments.map((payment) => (
                        <tr key={payment.id} className="border-b border-zinc-800">
                          <td className="py-3 px-2">{format(payment.date, 'dd/MM/yyyy')}</td>
                          <td className="py-3 px-2">{payment.reference}</td>
                          <td className="py-3 px-2">{payment.method}</td>
                          <td className="py-3 px-2 text-right">R$ {payment.value.toFixed(2).replace('.', ',')}</td>
                          <td className="py-3 px-2 flex justify-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-zinc-700"
                              onClick={() => handleViewReceipt(payment)}
                            >
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Ver detalhes</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-zinc-700"
                              title="Baixar comprovante"
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Baixar comprovante</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {mockPayments.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-gray-400">
                            Nenhum pagamento encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Payment Detail Dialog */}
        <Dialog open={!!selectedPaymentDetail} onOpenChange={() => setSelectedPaymentDetail(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Detalhes do Pagamento</DialogTitle>
            </DialogHeader>
            {selectedPaymentDetail && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <p className="text-gray-400">Data:</p>
                  <p className="col-span-3">{format(selectedPaymentDetail.date, 'dd/MM/yyyy')}</p>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <p className="text-gray-400">Referência:</p>
                  <p className="col-span-3">{selectedPaymentDetail.reference}</p>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <p className="text-gray-400">Descrição:</p>
                  <p className="col-span-3">{selectedPaymentDetail.description}</p>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <p className="text-gray-400">Método:</p>
                  <p className="col-span-3">{selectedPaymentDetail.method}</p>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <p className="text-gray-400">Valor:</p>
                  <p className="col-span-3">R$ {selectedPaymentDetail.value.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="flex justify-end">
                  <Button className="bg-white text-black hover:bg-gray-200">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Comprovante
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </BarberLayout>
  );
};

export default BarberCommissions;
