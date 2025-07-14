import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, DollarSign, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Commission {
  id: string;
  amount: number;
  commission_rate: number;
  status: string;
  created_at: string;
  payment_date: string | null;
  staff: {
    id: string;
    name: string;
  };
  appointments?: {
    id: string;
    start_time: string;
    services: {
      name: string;
      price: number;
    };
    clients: {
      name: string;
    };
  };
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
}

const CommissionPayments: React.FC = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);

  useEffect(() => {
    fetchCommissions();
    fetchStaffMembers();
  }, [selectedStaff, statusFilter]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('barber_commissions')
        .select(`
          *,
          staff!barber_id(id, name)
        `)
        .order('created_at', { ascending: false });

      if (selectedStaff && selectedStaff !== 'all') {
        query = query.eq('barber_id', selectedStaff);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const commissionsWithDetails = await Promise.all(
        (data || []).map(async (commission) => {
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
                appointments: {
                  id: appointmentData.id,
                  start_time: appointmentData.data + 'T' + appointmentData.hora,
                  services: {
                    name: appointmentData.painel_servicos?.nome || 'Serviço',
                    price: appointmentData.painel_servicos?.preco || 0
                  },
                  clients: {
                    name: appointmentData.painel_clientes?.nome || 'Cliente'
                  }
                }
              };
            }
            return {
              ...commission,
              appointments: {
                id: commission.appointment_id,
                start_time: new Date().toISOString(),
                services: { name: 'Serviço', price: 0 },
                clients: { name: 'Cliente' }
              }
            };
          } catch (error) {
            console.error('Error fetching appointment details:', error);
            return {
              ...commission,
              appointments: {
                id: commission.appointment_id,
                start_time: new Date().toISOString(),
                services: { name: 'Serviço', price: 0 },
                clients: { name: 'Cliente' }
              }
            };
          }
        })
      );

      setCommissions(commissionsWithDetails);
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

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, email')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error fetching staff members:', error);
    }
  };

  const handlePayCommission = async (commissionId: string) => {
    try {
      const { error } = await supabase
        .from('barber_commissions')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', commissionId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comissão marcada como paga.",
      });

      fetchCommissions();
    } catch (error) {
      console.error('Error updating commission:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a comissão.",
        variant: "destructive",
      });
    }
  };

  const handleBulkPayment = async () => {
    if (selectedCommissions.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos uma comissão para pagamento.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('barber_commissions')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString()
        })
        .in('id', selectedCommissions);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${selectedCommissions.length} comissões marcadas como pagas.`,
      });

      setSelectedCommissions([]);
      fetchCommissions();
    } catch (error) {
      console.error('Error bulk updating commissions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as comissões selecionadas.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'paid':
        return <Badge className="bg-green-600">Pago</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPendingAmount = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPaidAmount = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Comissões Pendentes</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ {totalPendingAmount.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Comissões Pagas</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ {totalPaidAmount.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total de Comissões</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{commissions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="staff-select" className="text-gray-300">Profissional</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Todos os profissionais" className="text-white" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="all" className="hover:bg-gray-700">Todos os profissionais</SelectItem>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id} className="hover:bg-gray-700">
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-select" className="text-gray-300">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="all" className="hover:bg-gray-700">Todos os status</SelectItem>
                  <SelectItem value="pending" className="hover:bg-gray-700">Pendente</SelectItem>
                  <SelectItem value="paid" className="hover:bg-gray-700">Pago</SelectItem>
                  <SelectItem value="cancelled" className="hover:bg-gray-700">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedCommissions.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {selectedCommissions.length} comissões selecionadas
              </span>
              <Button 
                onClick={handleBulkPayment} 
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Marcar como Pagas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-gray-400">Carregando...</div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              Nenhuma comissão encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left p-2 text-gray-300">
                      <input
                        type="checkbox"
                        className="bg-gray-700 border-gray-600"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCommissions(commissions.map(c => c.id));
                          } else {
                            setSelectedCommissions([]);
                          }
                        }}
                      />
                    </th>
                    <th className="text-left p-2 text-gray-300">Profissional</th>
                    <th className="text-left p-2 text-gray-300">Cliente</th>
                    <th className="text-left p-2 text-gray-300">Serviço</th>
                    <th className="text-left p-2 text-gray-300">Data</th>
                    <th className="text-left p-2 text-gray-300">Valor</th>
                    <th className="text-left p-2 text-gray-300">Taxa</th>
                    <th className="text-left p-2 text-gray-300">Comissão</th>
                    <th className="text-left p-2 text-gray-300">Status</th>
                    <th className="text-left p-2 text-gray-300">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          className="bg-gray-700 border-gray-600"
                          checked={selectedCommissions.includes(commission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCommissions([...selectedCommissions, commission.id]);
                            } else {
                              setSelectedCommissions(selectedCommissions.filter(id => id !== commission.id));
                            }
                          }}
                        />
                      </td>
                      <td className="p-2 text-gray-300">{commission.staff?.name}</td>
                      <td className="p-2 text-gray-300">{commission.appointments?.clients?.name}</td>
                      <td className="p-2 text-gray-300">{commission.appointments?.services?.name}</td>
                      <td className="p-2 text-gray-300">
                        {format(new Date(commission.appointments?.start_time), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="p-2 text-gray-300">R$ {commission.appointments?.services?.price?.toFixed(2)}</td>
                      <td className="p-2 text-gray-300">{commission.commission_rate}%</td>
                      <td className="p-2 text-gray-300">R$ {commission.amount.toFixed(2)}</td>
                      <td className="p-2">{getStatusBadge(commission.status)}</td>
                      <td className="p-2">
                        {commission.status === 'pending' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handlePayCommission(commission.id)}
                          >
                            Pagar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionPayments;