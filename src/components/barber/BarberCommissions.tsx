
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, TrendingUp, Calendar, CheckCircle } from 'lucide-react';

const BarberCommissions: React.FC = () => {
  const { user } = useAuth();

  // Get barber ID from email
  const { data: barberData } = useQuery({
    queryKey: ['barber-profile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.email
  });

  // Fetch commissions data
  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['barber-commissions', barberData?.id],
    queryFn: async () => {
      if (!barberData?.id) return [];
      
      const { data, error } = await supabase
        .from('barber_commissions')
        .select(`
          *,
          appointments:appointment_id (
            start_time,
            clients:client_id (
              name
            ),
            services:service_id (
              name,
              price
            )
          )
        `)
        .eq('barber_id', barberData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!barberData?.id
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  // Calculate summary metrics
  const totalPending = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + Number(c.amount), 0);
  
  const totalPaid = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const thisMonthCommissions = commissions.filter(c => {
    const commissionDate = new Date(c.created_at);
    const now = new Date();
    return commissionDate.getMonth() === now.getMonth() && 
           commissionDate.getFullYear() === now.getFullYear();
  });

  const thisMonthTotal = thisMonthCommissions.reduce((sum, c) => sum + Number(c.amount), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-yellow-100 p-3 mr-4">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
                <p className="text-xs text-muted-foreground">Comissões Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                <p className="text-xs text-muted-foreground">Comissões Pagas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrency(thisMonthTotal)}</div>
                <p className="text-xs text-muted-foreground">Este Mês</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-purple-100 p-3 mr-4">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{commissions.length}</div>
                <p className="text-xs text-muted-foreground">Total de Comissões</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Valor do Serviço</TableHead>
                  <TableHead>Taxa (%)</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Nenhuma comissão encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>{commission.appointments?.clients?.name || 'N/A'}</TableCell>
                      <TableCell>{commission.appointments?.services?.name || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(Number(commission.appointments?.services?.price || 0))}</TableCell>
                      <TableCell>{commission.commission_rate}%</TableCell>
                      <TableCell className="font-medium">{formatCurrency(Number(commission.amount))}</TableCell>
                      <TableCell>{formatDate(commission.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                          {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BarberCommissions;
