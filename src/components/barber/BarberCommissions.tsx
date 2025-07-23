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
import StandardCard from './layouts/StandardCard';

interface Commission {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_date?: string;
  paid_at?: string;
  commission_rate?: number;
  appointment_details?: {
    client_name?: string;
    service_name?: string;
    service_price?: number;
    appointment_date?: string;
    appointment_time?: string;
  };
  source: string;
}

interface CommissionWithDetails extends Commission {
  appointment_details: {
    client_name: string;
    service_name: string;
    service_price: number;
    appointment_date: string;
    appointment_time: string;
  };
}

const BarberCommissions: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffId, setStaffId] = useState<string | null>(null);

  const totalPending = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPaid = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  useEffect(() => {
    const fetchStaffId = async () => {
      if (!user?.email) return;

      try {
        const { data: barberData } = await supabase
          .from('painel_barbeiros')
          .select('staff_id')
          .eq('email', user.email)
          .maybeSingle();

        if (barberData?.staff_id) {
          setStaffId(barberData.staff_id);
        }
      } catch (error) {
        console.error('Error fetching staff ID:', error);
      }
    };

    fetchStaffId();
  }, [user?.email]);

  useEffect(() => {
    const fetchCommissions = async () => {
      if (!staffId) return;

      setLoading(true);
      try {
        const { data: barberCommissions, error: bcError } = await supabase
          .from('barber_commissions')
          .select('*')
          .eq('barber_id', staffId)
          .order('created_at', { ascending: false });

        if (bcError) {
          console.error('Error fetching barber commissions:', bcError);
          setCommissions([]);
          return;
        }

        if (!barberCommissions || barberCommissions.length === 0) {
          setCommissions([]);
          return;
        }

        const transformedCommissions: Commission[] = [];

        for (const commission of barberCommissions) {
          let appointmentDetails;

          if (commission.appointment_source === 'painel') {
            const { data: painelData } = await supabase
              .from('painel_agendamentos')
              .select(`
                *,
                painel_clientes(nome),
                painel_servicos(nome, preco),
                painel_barbeiros(nome)
              `)
              .eq('id', commission.appointment_id)
              .maybeSingle();

            if (painelData) {
              appointmentDetails = {
                client_name: painelData.painel_clientes?.nome || 'Cliente',
                service_name: painelData.painel_servicos?.nome || 'Serviço',
                service_price: painelData.painel_servicos?.preco || 0,
                appointment_date: painelData.data || '',
                appointment_time: painelData.hora ? 
                  format(new Date(`2000-01-01T${painelData.hora}`), 'HH:mm') : '--:--'
              };
            }
          } else {
            const { data: appointmentData } = await supabase
              .from('appointments')
              .select(`
                *,
                clients(name),
                services(name, price)
              `)
              .eq('id', commission.appointment_id)
              .maybeSingle();

            if (appointmentData) {
              appointmentDetails = {
                client_name: appointmentData.clients?.name || 'Cliente',
                service_name: appointmentData.services?.name || 'Serviço',
                service_price: appointmentData.services?.price || 0,
                appointment_date: appointmentData.start_time?.split('T')[0] || '',
                appointment_time: appointmentData.start_time ? 
                  format(new Date(appointmentData.start_time), 'HH:mm') : '--:--'
              };
            }
          }

          transformedCommissions.push({
            id: commission.id,
            amount: commission.amount,
            status: commission.status,
            created_at: commission.created_at,
            payment_date: commission.payment_date,
            commission_rate: commission.commission_rate,
            source: commission.appointment_source || 'appointments',
            appointment_details: appointmentDetails
          });
        }

        setCommissions(transformedCommissions);
      } catch (error) {
        console.error('Error fetching commissions:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as comissões.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCommissions();
  }, [staffId, toast]);

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
      <div className="w-full h-full flex justify-center items-center min-h-96">
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
    <div className="w-full h-full flex flex-col space-y-3">
      {/* Summary Cards */}
      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {summaryCards.map((card, index) => (
          <StandardCard key={index}>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-xs font-medium text-gray-300 truncate pr-2">{card.title}</div>
              <card.icon className={`h-4 w-4 flex-shrink-0 ${card.color}`} />
            </div>
            <div className="text-sm sm:text-base lg:text-lg font-bold text-white truncate">
              {card.value}
            </div>
          </StandardCard>
        ))}
      </div>

      {/* Histórico de Comissões */}
      <StandardCard title="Histórico de Comissões">
        {commissions.length === 0 ? (
          <div className="w-full text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Nenhuma comissão encontrada</h3>
            <p className="text-sm text-gray-400">
              As comissões aparecerão aqui conforme você concluir atendimentos
            </p>
          </div>
        ) : (
          <div className="w-full space-y-3">
            {/* Mobile View - Cards */}
            <div className="w-full lg:hidden space-y-2">
              {commissions.map((commission) => (
                <Card key={`${commission.source}-${commission.id}`} className="w-full bg-gray-700/50 border-gray-600/50">
                  <CardContent className="p-3">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm truncate">
                            {commission.appointment_details?.client_name || 'Cliente'}
                          </h4>
                          <p className="text-xs text-gray-400 truncate">
                            {commission.appointment_details?.service_name || 'Serviço'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Origem: {commission.source === 'painel' ? 'Painel' : 'Sistema Novo'}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(commission.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-400">Data</p>
                          <p className="text-white truncate">
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
                          <p className="text-white truncate">
                            R$ {(commission.appointment_details?.service_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-600/50">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Comissão</span>
                          <span className="text-base font-bold text-urbana-gold">
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

            {/* Desktop View - Tabela */}
            <div className="w-full hidden lg:block">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700/50">
                      <TableHead className="text-gray-300 whitespace-nowrap">Data</TableHead>
                      <TableHead className="text-gray-300 whitespace-nowrap">Cliente</TableHead>
                      <TableHead className="text-gray-300 whitespace-nowrap">Serviço</TableHead>
                      <TableHead className="text-gray-300 whitespace-nowrap">Valor do Serviço</TableHead>
                      <TableHead className="text-gray-300 whitespace-nowrap">Taxa</TableHead>
                      <TableHead className="text-gray-300 whitespace-nowrap">Comissão</TableHead>
                      <TableHead className="text-gray-300 whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-gray-300 whitespace-nowrap">Pagamento</TableHead>
                      <TableHead className="text-gray-300 whitespace-nowrap">Origem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission) => (
                      <TableRow key={`${commission.source}-${commission.id}`} className="border-gray-700/50">
                        <TableCell className="text-gray-300 whitespace-nowrap">
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
                          <TableCell className="text-gray-300 whitespace-nowrap">
                            R$ {(commission.appointment_details?.service_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-urbana-gold whitespace-nowrap">
                            {commission.commission_rate ? `${commission.commission_rate}%` : 'N/A'}
                          </TableCell>
                          <TableCell className="font-bold text-urbana-gold whitespace-nowrap">
                            R$ {commission.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(commission.status)}
                          </TableCell>
                          <TableCell className="text-gray-300 whitespace-nowrap">
                            {(commission.payment_date || commission.paid_at)
                              ? format(new Date(commission.payment_date || commission.paid_at!), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-gray-400 text-xs whitespace-nowrap">
                            {commission.source === 'painel' ? 'Painel' : 'Sistema Novo'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        )}
      </StandardCard>
    </div>
  );
};

export default BarberCommissions;
