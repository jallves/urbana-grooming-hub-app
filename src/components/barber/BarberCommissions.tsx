
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Commission {
  id: string;
  amount: number;
  commission_rate?: number;
  status: string;
  created_at: string;
  payment_date?: string | null;
  paid_at?: string | null;
  appointment_id: string;
  source: 'barber_commissions' | 'new_commissions';
}

interface CommissionWithDetails extends Commission {
  appointment_details?: {
    client_name: string;
    service_name: string;
    service_price: number;
    appointment_date: string;
    appointment_time: string;
  };
}

const BarberCommissions: React.FC = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<CommissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBarberIds = async () => {
      if (!user?.email) return;

      try {
        // Buscar barbeiro na tabela painel_barbeiros
        const { data: painelBarber } = await supabase
          .from('painel_barbeiros')
          .select('id, staff_id')
          .eq('email', user.email)
          .maybeSingle();

        // Buscar barbeiro na tabela barbers
        const { data: barber } = await supabase
          .from('barbers')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        // Buscar staff
        const { data: staff } = await supabase
          .from('staff')
          .select('id')
          .eq('email', user.email)
          .eq('role', 'barber')
          .maybeSingle();

        if (painelBarber?.id) setBarberId(painelBarber.id);
        if (painelBarber?.staff_id) setStaffId(painelBarber.staff_id);
        else if (staff?.id) setStaffId(staff.id);

        console.log('Barber IDs found:', { 
          barberId: painelBarber?.id || barber?.id, 
          staffId: painelBarber?.staff_id || staff?.id 
        });
      } catch (error) {
        console.error('Error fetching barber IDs:', error);
      }
    };

    fetchBarberIds();
  }, [user?.email]);

  useEffect(() => {
    if (barberId || staffId) {
      fetchCommissions();
    }
  }, [barberId, staffId]);

  const fetchCommissions = async () => {
    try {
      console.log('Fetching commissions for barberId:', barberId, 'staffId:', staffId);
      
      const allCommissions: CommissionWithDetails[] = [];

      // Buscar comissões da tabela barber_commissions (se tiver staffId)
      if (staffId) {
        const { data: barberCommissions, error: barberError } = await supabase
          .from('barber_commissions')
          .select('*')
          .eq('barber_id', staffId)
          .order('created_at', { ascending: false });

        if (barberError) {
          console.error('Error fetching barber_commissions:', barberError);
        } else if (barberCommissions) {
          const formattedBarberCommissions = barberCommissions.map(commission => ({
            ...commission,
            source: 'barber_commissions' as const,
            paid_at: commission.payment_date
          }));
          allCommissions.push(...formattedBarberCommissions);
        }
      }

      // Buscar comissões da tabela new_commissions (se tiver barberId)
      if (barberId) {
        const { data: newCommissions, error: newError } = await supabase
          .from('new_commissions')
          .select('*')
          .eq('barber_id', barberId)
          .order('created_at', { ascending: false });

        if (newError) {
          console.error('Error fetching new_commissions:', newError);
        } else if (newCommissions) {
          const formattedNewCommissions = newCommissions.map(commission => ({
            ...commission,
            source: 'new_commissions' as const
          }));
          allCommissions.push(...formattedNewCommissions);
        }
      }

      // Buscar detalhes dos agendamentos para cada comissão
      const commissionsWithDetails = await Promise.all(
        allCommissions.map(async (commission) => {
          try {
            const { data: appointmentData } = await supabase
              .from('painel_agendamentos')
              .select(`
                id,
                data,
                hora,
                painel_clientes!inner(nome),
                painel_servicos!inner(nome, preco)
              `)
              .eq('id', commission.appointment_id)
              .maybeSingle();

            if (appointmentData) {
              return {
                ...commission,
                appointment_details: {
                  client_name: appointmentData.painel_clientes?.nome || 'Cliente',
                  service_name: appointmentData.painel_servicos?.nome || 'Serviço',
                  service_price: appointmentData.painel_servicos?.preco || 0,
                  appointment_date: appointmentData.data,
                  appointment_time: appointmentData.hora
                }
              };
            }
            return commission;
          } catch (error) {
            console.error('Error fetching appointment details:', error);
            return commission;
          }
        })
      );

      // Ordenar por data de criação (mais recente primeiro)
      commissionsWithDetails.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setCommissions(commissionsWithDetails);

      // Calcular totais
      const pending = commissionsWithDetails
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.amount, 0);
      const paid = commissionsWithDetails
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.amount, 0);
      
      setTotalPending(pending);
      setTotalPaid(paid);

      console.log('Commissions loaded:', commissionsWithDetails.length);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar as comissões.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription para atualizações
  useEffect(() => {
    const channels: any[] = [];

    if (staffId) {
      const barberCommissionsChannel = supabase
        .channel('barber_commissions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'barber_commissions',
            filter: `barber_id=eq.${staffId}`
          },
          () => {
            console.log('Barber commissions updated');
            fetchCommissions();
          }
        )
        .subscribe();
      
      channels.push(barberCommissionsChannel);
    }

    if (barberId) {
      const newCommissionsChannel = supabase
        .channel('new_commissions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'new_commissions',
            filter: `barber_id=eq.${barberId}`
          },
          () => {
            console.log('New commissions updated');
            fetchCommissions();
          }
        )
        .subscribe();
      
      channels.push(newCommissionsChannel);
    }

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [barberId, staffId]);

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
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
      </div>
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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-300">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl font-bold text-white truncate">
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
            <div className="space-y-4">
              {/* Mobile View */}
              <div className="lg:hidden space-y-4">
                {commissions.map((commission) => (
                  <Card key={`${commission.source}-${commission.id}`} className="bg-gray-700/50 border-gray-600/50">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-white">
                              {commission.appointment_details?.client_name || 'Cliente'}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {commission.appointment_details?.service_name || 'Serviço'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Origem: {commission.source === 'barber_commissions' ? 'Comissões' : 'Novo Sistema'}
                            </p>
                          </div>
                          {getStatusBadge(commission.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Data</p>
                            <p className="text-white">
                              {commission.appointment_details?.appointment_date 
                                ? format(new Date(commission.appointment_details.appointment_date), 'dd/MM/yyyy', { locale: ptBR })
                                : format(new Date(commission.created_at), 'dd/MM/yyyy', { locale: ptBR })
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Horário</p>
                            <p className="text-white">
                              {commission.appointment_details?.appointment_time || '--:--'}
                            </p>
                          </div>
                          {commission.commission_rate && (
                            <div>
                              <p className="text-gray-400">Taxa</p>
                              <p className="text-urbana-gold">{commission.commission_rate}%</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-400">Valor Serviço</p>
                            <p className="text-white">
                              R$ {(commission.appointment_details?.service_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-600/50">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Comissão</span>
                            <span className="text-lg font-bold text-urbana-gold">
                              R$ {commission.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                        
                        {(commission.payment_date || commission.paid_at) && (
                          <div className="text-xs text-gray-400">
                            Pago em: {format(new Date(commission.payment_date || commission.paid_at!), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden lg:block overflow-x-auto">
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
                      <TableHead className="text-gray-300">Origem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission) => (
                      <TableRow key={`${commission.source}-${commission.id}`} className="border-gray-700/50">
                        <TableCell className="text-gray-300">
                          {commission.appointment_details?.appointment_date 
                            ? format(new Date(commission.appointment_details.appointment_date), 'dd/MM/yyyy', { locale: ptBR })
                            : format(new Date(commission.created_at), 'dd/MM/yyyy', { locale: ptBR })
                          }
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {commission.appointment_details?.client_name || 'Cliente'}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {commission.appointment_details?.service_name || 'Serviço'}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          R$ {(commission.appointment_details?.service_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-urbana-gold">
                          {commission.commission_rate ? `${commission.commission_rate}%` : 'N/A'}
                        </TableCell>
                        <TableCell className="font-bold text-urbana-gold">
                          R$ {commission.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(commission.status)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {(commission.payment_date || commission.paid_at)
                            ? format(new Date(commission.payment_date || commission.paid_at!), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-gray-400 text-xs">
                          {commission.source === 'barber_commissions' ? 'Comissões' : 'Novo Sistema'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BarberCommissions;
