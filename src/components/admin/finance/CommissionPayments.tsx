
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Clock, DollarSign, User, Search, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CommissionData {
  id: string;
  barber_id: string;
  appointment_id: string;
  amount: number;
  commission_rate: number;
  status: 'pending' | 'paid';
  created_at: string;
  payment_date?: string;
  staff: {
    name: string;
    email: string;
  };
  appointments: {
    start_time: string;
    clients: {
      name: string;
    };
    services: {
      name: string;
      price: number;
    };
  };
}

const CommissionPayments: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [barberFilter, setBarberFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch commissions data
  const { data: commissions = [], isLoading, refetch } = useQuery({
    queryKey: ['barber-commissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barber_commissions')
        .select(`
          *,
          staff:barber_id (
            name,
            email
          ),
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CommissionData[];
    }
  });

  // Fetch barbers for filter
  const { data: barbers = [] } = useQuery({
    queryKey: ['barbers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name')
        .eq('role', 'barber')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Payment mutation
  const payCommissionMutation = useMutation({
    mutationFn: async (commissionIds: string[]) => {
      const { error } = await supabase
        .from('barber_commissions')
        .update({ 
          status: 'paid', 
          payment_date: new Date().toISOString() 
        })
        .in('id', commissionIds);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Comissões pagas com sucesso!",
        description: "As comissões selecionadas foram marcadas como pagas.",
      });
      queryClient.invalidateQueries({ queryKey: ['barber-commissions'] });
      setSelectedCommissions([]);
      setIsPaymentDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao processar pagamento",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filter commissions
  const filteredCommissions = commissions.filter(commission => {
    // Status filter
    if (statusFilter !== 'all' && commission.status !== statusFilter) {
      return false;
    }

    // Barber filter
    if (barberFilter !== 'all' && commission.barber_id !== barberFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const barberName = commission.staff?.name?.toLowerCase() || '';
      const clientName = commission.appointments?.clients?.name?.toLowerCase() || '';
      const serviceName = commission.appointments?.services?.name?.toLowerCase() || '';
      
      return barberName.includes(query) || clientName.includes(query) || serviceName.includes(query);
    }

    return true;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  const handleSelectCommission = (commissionId: string) => {
    setSelectedCommissions(prev => 
      prev.includes(commissionId)
        ? prev.filter(id => id !== commissionId)
        : [...prev, commissionId]
    );
  };

  const handleSelectAll = () => {
    const pendingCommissions = filteredCommissions
      .filter(c => c.status === 'pending')
      .map(c => c.id);
    
    if (selectedCommissions.length === pendingCommissions.length) {
      setSelectedCommissions([]);
    } else {
      setSelectedCommissions(pendingCommissions);
    }
  };

  const pendingCommissions = filteredCommissions.filter(c => c.status === 'pending');
  const selectedAmount = filteredCommissions
    .filter(c => selectedCommissions.includes(c.id))
    .reduce((sum, c) => sum + Number(c.amount), 0);

  // Statistics
  const totalPending = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + Number(c.amount), 0);
  
  const totalPaid = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="rounded-full bg-yellow-100 p-3 mr-4">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Comissões Pendentes</div>
              <div className="text-xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Comissões Pagas</div>
              <div className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Geral</div>
              <div className="text-xl font-bold">{formatCurrency(totalPending + totalPaid)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por barbeiro, cliente ou serviço..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
              </SelectContent>
            </Select>

            <Select value={barberFilter} onValueChange={setBarberFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Barbeiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Barbeiros</SelectItem>
                {barbers.map((barber) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    {barber.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedCommissions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{selectedCommissions.length} comissões selecionadas</span>
                  <span className="text-gray-500 ml-2">- Total: {formatCurrency(selectedAmount)}</span>
                </div>
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      Pagar Comissões Selecionadas
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar Pagamento</DialogTitle>
                      <DialogDescription>
                        Você está prestes a marcar {selectedCommissions.length} comissões como pagas.
                        Valor total: {formatCurrency(selectedAmount)}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => payCommissionMutation.mutate(selectedCommissions)}
                        disabled={payCommissionMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {payCommissionMutation.isPending ? 'Processando...' : 'Confirmar Pagamento'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedCommissions.length === pendingCommissions.length && pendingCommissions.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Barbeiro</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Valor Serviço</TableHead>
                  <TableHead>Taxa (%)</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredCommissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Nenhuma comissão encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCommissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>
                        {commission.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selectedCommissions.includes(commission.id)}
                            onChange={() => handleSelectCommission(commission.id)}
                            className="rounded"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {commission.staff?.name}
                        </div>
                      </TableCell>
                      <TableCell>{commission.appointments?.clients?.name}</TableCell>
                      <TableCell>{commission.appointments?.services?.name}</TableCell>
                      <TableCell>{formatCurrency(Number(commission.appointments?.services?.price || 0))}</TableCell>
                      <TableCell>{commission.commission_rate}%</TableCell>
                      <TableCell className="font-medium">{formatCurrency(Number(commission.amount))}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(commission.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                          {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {commission.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedCommissions([commission.id]);
                              setIsPaymentDialogOpen(true);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Pagar
                          </Button>
                        )}
                        {commission.status === 'paid' && commission.payment_date && (
                          <span className="text-sm text-gray-500">
                            Pago em {formatDate(commission.payment_date)}
                          </span>
                        )}
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

export default CommissionPayments;
