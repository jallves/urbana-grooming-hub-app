
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import BarberLayout from './BarberLayout';

interface Commission {
  id: string;
  amount: number;
  commission_rate: number;
  status: string;
  created_at: string;
  payment_date: string | null;
  appointment: {
    id: string;
    service: {
      name: string;
      price: number;
    };
    client: {
      name: string;
    };
  };
}

const BarberCommissions: React.FC = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('email', user.email)
        .single();

      if (staffError || !staffData) {
        console.error('Error fetching staff data:', staffError);
        return;
      }

      const { data, error } = await supabase
        .from('barber_commissions')
        .select(`
          *,
          appointment:appointments (
            id,
            service:services (name, price),
            client:clients (name)
          )
        `)
        .eq('barber_id', staffData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching commissions:', error);
        toast({
          title: "Erro ao carregar comissões",
          description: "Não foi possível carregar suas comissões.",
          variant: "destructive",
        });
        return;
      }

      setCommissions(data || []);

      const pending = data?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0;
      const paid = data?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) || 0;
      
      setTotalPending(pending);
      setTotalPaid(paid);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="border-yellow-500/50 text-yellow-400 bg-yellow-500/10">Pendente</Badge>;
      case 'paid':
        return <Badge className="border-green-500/50 text-green-400 bg-green-500/10">Pago</Badge>;
      default:
        return <Badge className="border-gray-500/50 text-gray-400 bg-gray-500/10">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <BarberLayout title="Minhas Comissões">
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </BarberLayout>
    );
  }

  const summaryCards = [
    {
      title: 'Total Pendente',
      value: `R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Clock,
      color: 'text-orange-400'
    },
    {
      title: 'Total Pago',
      value: `R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: CheckCircle,
      color: 'text-green-400'
    },
    {
      title: 'Total Geral',
      value: `R$ ${(totalPending + totalPaid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-urbana-gold'
    },
    {
      title: 'Comissões',
      value: commissions.length.toString(),
      icon: TrendingUp,
      color: 'text-blue-400'
    }
  ];

  return (
    <BarberLayout title="Minhas Comissões">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, index) => (
            <Card key={index} className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">{card.title}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-white">
                  {card.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Commissions Table */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-urbana-gold" />
              Histórico de Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Nenhuma comissão encontrada</h3>
                <p className="text-gray-400">
                  As comissões aparecerão aqui conforme você concluir atendimentos
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700/50">
                      <TableHead className="text-gray-300">Data</TableHead>
                      <TableHead className="text-gray-300">Cliente</TableHead>
                      <TableHead className="text-gray-300">Serviço</TableHead>
                      <TableHead className="text-gray-300">Valor do Serviço</TableHead>
                      <TableHead className="text-gray-300">Taxa</TableHead>
                      <TableHead className="text-gray-300">Comissão</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission) => (
                      <TableRow key={commission.id} className="border-gray-700/50">
                        <TableCell className="text-gray-300">
                          {format(new Date(commission.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {commission.appointment?.client?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {commission.appointment?.service?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          R$ {(commission.appointment?.service?.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-urbana-gold">
                          {commission.commission_rate}%
                        </TableCell>
                        <TableCell className="font-bold text-white">
                          R$ {commission.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(commission.status)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {commission.payment_date 
                            ? format(new Date(commission.payment_date), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BarberLayout>
  );
};

export default BarberCommissions;
