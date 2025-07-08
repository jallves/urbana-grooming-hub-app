
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';

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
      // Get current user (barber)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get staff record for the current user
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('email', user.email)
        .single();

      if (staffError || !staffData) {
        console.error('Error fetching staff data:', staffError);
        return;
      }

      // Fetch commissions for this barber
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

      // Calculate totals
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
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: 'Total Pendente',
      value: `R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Clock,
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/10 to-red-500/10',
      borderColor: 'border-orange-500/20'
    },
    {
      title: 'Total Pago',
      value: `R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: CheckCircle,
      color: 'text-green-400',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      title: 'Total Geral',
      value: `R$ ${(totalPending + totalPaid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-urbana-gold',
      bgGradient: 'from-urbana-gold/10 to-yellow-500/10',
      borderColor: 'border-urbana-gold/20'
    },
    {
      title: 'Comissões',
      value: commissions.length.toString(),
      icon: TrendingUp,
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/20'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-10 w-64 h-64 bg-urbana-gold rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-10 w-80 h-80 bg-urbana-gold rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold mb-4">
            <span className="bg-gradient-to-r from-white via-urbana-gold to-white bg-clip-text text-transparent">
              Minhas Comissões
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Acompanhe seus ganhos e histórico de comissões
          </p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className={`bg-gradient-to-br ${card.bgGradient} backdrop-blur-lg border ${card.borderColor} hover:border-urbana-gold/40 transition-all duration-300`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">{card.title}</CardTitle>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {card.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Commissions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-lg border border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-urbana-gold" />
                Histórico de Comissões
              </CardTitle>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 text-gray-600 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-white mb-2">Nenhuma comissão encontrada</h3>
                  <p className="text-gray-400">
                    As comissões aparecerão aqui conforme você concluir atendimentos
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
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
                        <TableRow key={commission.id} className="border-gray-700 hover:bg-gray-800/50">
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
        </motion.div>
      </div>
    </div>
  );
};

export default BarberCommissions;
