
import React, { useState, useEffect } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const BarberCommissions: React.FC = () => {
  const [period, setPeriod] = useState<string>('month');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user } = useAuth();
  
  const { data: commissions, isLoading } = useQuery({
    queryKey: ['barber-commissions', user?.email, period],
    queryFn: async () => {
      // First find the barber ID associated with this user
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, name')
        .eq('email', user?.email)
        .single();
        
      if (staffError) throw new Error(staffError.message);

      // Get date range based on selected period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1); // Default to month
      }
      
      // Query barber commissions with appointment and service details
      const { data, error } = await supabase
        .from('barber_commissions')
        .select(`
          *,
          appointment:appointment_id(
            start_time, 
            client:client_id(name),
            service:service_id(name, price)
          )
        `)
        .eq('barber_id', staffData.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user?.email,
  });
  
  // Filter commissions by search query
  const filteredCommissions = commissions?.filter(commission => {
    if (!searchQuery) return true;
    
    const clientName = commission.appointment?.client?.name?.toLowerCase() || '';
    const serviceName = commission.appointment?.service?.name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return clientName.includes(query) || serviceName.includes(query);
  });
  
  // Calculate total commission
  const totalCommission = filteredCommissions?.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) || 0;
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
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
            <CardTitle className="text-sm text-zinc-400">Comissão do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalCommission)}</p>
            <p className="text-xs text-zinc-400">
              {filteredCommissions?.length || 0} serviços realizados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Média por Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(filteredCommissions?.length 
                ? totalCommission / filteredCommissions.length 
                : 0)}
            </p>
            <p className="text-xs text-zinc-400">Baseado no período atual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {filteredCommissions?.filter(c => c.status === 'pending').length || 0} pendentes
            </p>
            <p className="text-xs text-green-500">
              {filteredCommissions?.filter(c => c.status === 'paid').length || 0} pagas no período
            </p>
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
                </SelectContent>
              </Select>
              
              <div className="relative w-full sm:w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-urbana-gold"></div>
            </div>
          ) : filteredCommissions && filteredCommissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      {formatDate(commission.appointment?.start_time || '')}
                    </TableCell>
                    <TableCell>{commission.appointment?.client?.name || 'N/A'}</TableCell>
                    <TableCell>{commission.appointment?.service?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(parseFloat(commission.appointment?.service?.price || '0'))}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(parseFloat(commission.amount || '0'))}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${commission.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Nenhuma comissão encontrada para o período selecionado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BarberCommissions;
