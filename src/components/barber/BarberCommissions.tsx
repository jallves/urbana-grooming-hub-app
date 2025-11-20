
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

  const { totalPending, totalPaid, totalCommissions } = useMemo(() => {
    const pending = commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount, 0);
    
    const paid = commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);
    
    const total = commissions.reduce((sum, c) => sum + c.amount, 0);
    
    return { totalPending: pending, totalPaid: paid, totalCommissions: total };
  }, [commissions]);

  useEffect(() => {
    const fetchStaffId = async () => {
      if (!user?.email) {
        setStaffId(null);
        return;
      }

      try {
        const { data: staffData } = await supabase
          .from('staff')
          .select('id')
          .eq('email', user.email)
          .eq('role', 'barber')
          .eq('is_active', true)
          .maybeSingle();

        if (staffData?.id) {
          setStaffId(staffData.id);
        } else {
          setStaffId(null);
        }
      } catch (error) {
        console.error('[BarberCommissions] Erro ao buscar staff ID:', error);
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
        const { data: commissionsData, error: fetchError } = await supabase
          .from('barber_commissions')
          .select(`
            id,
            amount,
            status,
            commission_rate,
            payment_date,
            created_at,
            appointment_source,
            appointment_id
          `)
          .eq('barber_id', staffId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('[BarberCommissions] Erro ao buscar comissões:', fetchError);
          toast({
            title: "Erro ao carregar comissões",
            description: fetchError.message,
            variant: "destructive",
          });
          setCommissions([]);
          setLoading(false);
          return;
        }

        if (!commissionsData || commissionsData.length === 0) {
          setCommissions([]);
          setLoading(false);
          return;
        }

        const commissionsWithDetails = await Promise.all(
          commissionsData.map(async (commission) => {
            let appointmentDetails = {
              client_name: 'Cliente',
              service_name: 'Serviço',
              service_price: 0,
              appointment_date: commission.created_at,
              appointment_time: '--:--'
            };

            if (commission.appointment_id) {
              if (commission.appointment_source === 'painel') {
                const { data: painelData } = await supabase
                  .from('painel_agendamentos')
                  .select(`
                    data,
                    hora,
                    painel_clientes(nome),
                    painel_servicos(nome, preco)
                  `)
                  .eq('id', commission.appointment_id)
                  .maybeSingle();

                if (painelData) {
                  appointmentDetails = {
                    client_name: painelData.painel_clientes?.nome || 'Cliente',
                    service_name: painelData.painel_servicos?.nome || 'Serviço',
                    service_price: Number(painelData.painel_servicos?.preco) || 0,
                    appointment_date: painelData.data,
                    appointment_time: painelData.hora
                  };
                }
              } else {
                const { data: appointmentData } = await supabase
                  .from('appointments')
                  .select(`
                    start_time,
                    clients(name),
                    services(name, price)
                  `)
                  .eq('id', commission.appointment_id)
                  .maybeSingle();

                if (appointmentData) {
                  const startTime = new Date(appointmentData.start_time);
                  appointmentDetails = {
                    client_name: appointmentData.clients?.name || 'Cliente',
                    service_name: appointmentData.services?.name || 'Serviço',
                    service_price: Number(appointmentData.services?.price) || 0,
                    appointment_date: appointmentData.start_time,
                    appointment_time: format(startTime, 'HH:mm')
                  };
                }
              }
            }

            return {
              id: commission.id,
              amount: commission.amount,
              status: commission.status,
              created_at: commission.created_at,
              payment_date: commission.payment_date,
              commission_rate: commission.commission_rate,
              source: commission.appointment_source || 'appointments',
              appointment_details: appointmentDetails
            };
          })
        );

        setCommissions(commissionsWithDetails);
      } catch (error: any) {
        console.error('[BarberCommissions] Erro:', error);
        toast({
          title: "Erro ao carregar comissões",
          description: error.message,
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
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Paga</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>;
    }
  };

  const statsCards = [
    {
      title: 'Total de Comissões',
      value: `R$ ${totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-urbana-gold',
      bgGradient: 'from-yellow-500/10 to-amber-600/5'
    },
    {
      title: 'Comissões',
      value: commissions.length.toString(),
      icon: TrendingUp,
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/10 to-blue-600/5'
    },
    {
      title: 'Pendentes',
      value: `R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Clock,
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/10 to-orange-600/5'
    },
    {
      title: 'Pagas',
      value: `R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: CheckCircle,
      color: 'text-green-400',
      bgGradient: 'from-green-500/10 to-green-600/5'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <ResponsiveCard key={i}>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-700 rounded w-1/2"></div>
              </div>
            </ResponsiveCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <ResponsiveCard key={index}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </ResponsiveCard>
        ))}
      </div>

      <ResponsiveCard title="Histórico de Comissões" className="flex-1">
        {commissions.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Nenhuma comissão encontrada</h3>
            <p className="text-sm sm:text-base text-gray-400">
              As comissões aparecerão aqui conforme você concluir atendimentos
            </p>
          </div>
        ) : (
          <>
            <div className="block md:hidden space-y-4">
              {commissions.map((commission) => (
                <MobileCommissionCard
                  key={`${commission.source}-${commission.id}`}
                  commission={commission}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700/50">
                    <TableHead className="text-gray-300">Data</TableHead>
                    <TableHead className="text-gray-300">Cliente</TableHead>
                    <TableHead className="text-gray-300">Serviço</TableHead>
                    <TableHead className="text-gray-300">Valor Serviço</TableHead>
                    <TableHead className="text-gray-300">Taxa (%)</TableHead>
                    <TableHead className="text-gray-300">Comissão</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Pagamento</TableHead>
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
                      <TableCell className="text-gray-300">
                        {commission.appointment_details?.client_name || 'Cliente'}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {commission.appointment_details?.service_name || 'Serviço'}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        R$ {(commission.appointment_details?.service_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {commission.commission_rate ? `${commission.commission_rate}%` : 'N/A'}
                      </TableCell>
                      <TableCell className="text-green-400 font-semibold">
                        R$ {commission.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(commission.status)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {commission.payment_date
                          ? format(parseISO(commission.payment_date), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </ResponsiveCard>
    </div>
  );
};

export default BarberCommissions;