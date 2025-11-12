
import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ResponsiveCard from './layouts/ResponsiveCard';
import MobileCommissionCard from './layouts/MobileCommissionCard';

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

const BarberCommissions: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffId, setStaffId] = useState<string | null>(null);

  const { totalPending, totalPaid } = useMemo(() => {
    const pending = commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount, 0);
    
    const paid = commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);
    
    return { totalPending: pending, totalPaid: paid };
  }, [commissions]);

  useEffect(() => {
    const fetchStaffId = async () => {
      if (!user?.email) {
        setStaffId(null);
        return;
      }

      try {
        const { data: barberData } = await supabase
          .from('painel_barbeiros')
          .select('staff_id')
          .eq('email', user.email)
          .maybeSingle();

        if (barberData?.staff_id) {
          setStaffId(barberData.staff_id);
        } else {
          setStaffId(null);
        }
      } catch (error) {
        console.error('Error fetching staff ID:', error);
        setStaffId(null);
      }
    };

    fetchStaffId();
  }, [user?.email]);

  useEffect(() => {
    const fetchCommissions = async () => {
      if (!staffId) {
        setCommissions([]);
        setLoading(false);
        return;
      }

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
        return <Badge className="border-yellow-500/50 text-yellow-400 bg-yellow-500/10 text-xs">Pendente</Badge>;
      case 'paid':
        return <Badge className="border-green-500/50 text-green-400 bg-green-500/10 text-xs">Pago</Badge>;
      default:
        return <Badge className="border-gray-500/50 text-gray-400 bg-gray-500/10 text-xs">{status}</Badge>;
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
      title: 'Pendente',
      value: `R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Clock,
      color: 'text-orange-400'
    },
    {
      title: 'Pago',
      value: `R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: CheckCircle,
      color: 'text-green-400'
    },
    {
      title: 'Total',
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
    <div className="w-full h-full flex flex-col space-y-3 p-2 sm:p-4">
      {/* Summary Cards - 2x2 Grid on Mobile */}
      <div className="w-full grid grid-cols-2 gap-2 sm:gap-3">
        {summaryCards.map((card, index) => (
          <ResponsiveCard key={index} className="min-h-[80px] sm:min-h-[100px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-full">
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-300 mb-1 truncate">{card.title}</div>
                <div className="text-sm sm:text-base lg:text-lg font-bold text-white truncate">
                  {card.value}
                </div>
              </div>
              <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${card.color} mt-1 sm:mt-0`} />
            </div>
          </ResponsiveCard>
        ))}
      </div>

      {/* Commissions History */}
      <ResponsiveCard title="Histórico de Comissões" className="flex-1">
        {commissions.length === 0 ? (
          <div className="w-full text-center py-8 sm:py-12">
            <DollarSign className="h-12 w-12 sm:h-16 sm:w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Nenhuma comissão encontrada</h3>
            <p className="text-sm sm:text-base text-gray-400">
              As comissões aparecerão aqui conforme você concluir atendimentos
            </p>
          </div>
        ) : (
          <div className="w-full space-y-3">
            {/* Mobile View - Cards */}
            <div className="w-full lg:hidden">
              {commissions.map((commission) => (
                <MobileCommissionCard
                  key={`${commission.source}-${commission.id}`}
                  commission={commission}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="w-full hidden lg:block">
              <div className="w-full overflow-x-auto">
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
                            ? format(parseISO(commission.appointment_details.appointment_date), 'dd/MM/yyyy', { locale: ptBR })
                            : format(parseISO(commission.created_at), 'dd/MM/yyyy', { locale: ptBR })
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
                            ? format(parseISO(commission.payment_date || commission.paid_at!), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-gray-400 text-xs">
                          {commission.source === 'painel' ? 'Painel' : 'Sistema Novo'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </ResponsiveCard>
    </div>
  );
};

export default BarberCommissions;
