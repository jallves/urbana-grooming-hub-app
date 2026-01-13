
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, DollarSign, User, Calendar, Check, X, Plus, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Commission {
  id: string;
  barber_id: string;
  appointment_id: string | null;
  amount: number;
  commission_rate: number;
  status: 'pending' | 'paid' | 'cancelled';
  payment_date: string | null;
  created_at: string;
  staff?: {
    id: string;
    name: string;
  };
}

const CommissionPayments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  
  const queryClient = useQueryClient();

  const { data: commissions, isLoading } = useQuery({
    queryKey: ['commissions', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('barber_commissions')
        .select('*, painel_barbeiros:barber_id(id, nome)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      // Map painel_barbeiros to staff format
      return (data || []).map(c => ({
        ...c,
        staff: c.painel_barbeiros ? { id: c.painel_barbeiros.id, name: c.painel_barbeiros.nome } : null
      })) as Commission[];
    },
  });

  const { data: commissionSummary } = useQuery({
    queryKey: ['commission-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barber_commissions')
        .select('amount, status, painel_barbeiros:barber_id(nome)');

      if (error) throw error;
      
      // Map data to include staff property
      const mappedData = (data || []).map(c => ({
        ...c,
        staff: c.painel_barbeiros ? { name: c.painel_barbeiros.nome } : null
      }));

      const totalPending = mappedData.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      const totalPaid = mappedData.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      const totalCancelled = mappedData.filter(c => c.status === 'cancelled').reduce((sum, c) => sum + Number(c.amount), 0) || 0;

      // Resumo por barbeiro
      const byBarber = mappedData.reduce((acc, commission) => {
        const barberName = commission.staff?.name || 'Barbeiro';
        if (!acc[barberName]) {
          acc[barberName] = { pending: 0, paid: 0, total: 0 };
        }
        const amount = Number(commission.amount);
        acc[barberName].total += amount;
        if (commission.status === 'pending') acc[barberName].pending += amount;
        if (commission.status === 'paid') acc[barberName].paid += amount;
        return acc;
      }, {} as Record<string, { pending: number; paid: number; total: number }>) || {};

      return {
        totalPending,
        totalPaid,
        totalCancelled,
        byBarber,
        total: totalPending + totalPaid + totalCancelled,
      };
    },
  });

  const payCommissions = useMutation({
    mutationFn: async ({ commissionIds, method, notes }: { commissionIds: string[], method: string, notes: string }) => {
      const { error } = await supabase
        .from('barber_commissions')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString(),
        })
        .in('id', commissionIds);

      if (error) throw error;

      // Registrar no fluxo de caixa
      const { data: commissionsData } = await supabase
        .from('barber_commissions')
        .select('*, painel_barbeiros:barber_id(nome)')
        .in('id', commissionIds);

      if (commissionsData) {
        for (const commission of commissionsData) {
          const barberName = (commission as any).painel_barbeiros?.nome || 'Barbeiro';
          await supabase.from('cash_flow').insert({
            transaction_type: 'expense',
            amount: commission.amount,
            description: `Pagamento de comissão - ${barberName}`,
            category: 'Comissões',
            payment_method: method,
            reference_id: commission.id,
            reference_type: 'commission',
            notes: notes,
            transaction_date: format(new Date(), 'yyyy-MM-dd'),
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission-summary'] });
      setSelectedCommissions([]);
      setPaymentDialogOpen(false);
      setPaymentMethod('');
      setPaymentNotes('');
      toast.success('Comissões pagas com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao pagar comissões');
    },
  });

  const filteredCommissions = commissions?.filter(commission => {
    const matchesSearch = commission.staff?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return matchesSearch;
  }) || [];

  const selectedTotal = filteredCommissions
    .filter(c => selectedCommissions.includes(c.id))
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const handleSelectAll = () => {
    if (selectedCommissions.length === filteredCommissions.length) {
      setSelectedCommissions([]);
    } else {
      setSelectedCommissions(filteredCommissions.map(c => c.id));
    }
  };

  const handlePayment = () => {
    if (selectedCommissions.length === 0) {
      toast.error('Selecione pelo menos uma comissão');
      return;
    }
    if (!paymentMethod) {
      toast.error('Selecione o método de pagamento');
      return;
    }
    payCommissions.mutate({
      commissionIds: selectedCommissions,
      method: paymentMethod,
      notes: paymentNotes,
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-urbana-gold"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-800 text-white">
      {/* Header com resumo */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Card className="bg-yellow-900/20 border-yellow-700/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-yellow-400" />
                <div>
                  <p className="text-xs text-yellow-400">Pendente</p>
                  <p className="text-sm font-bold text-yellow-400">
                    R$ {(commissionSummary?.totalPending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-900/20 border-green-700/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-xs text-green-400">Pago</p>
                  <p className="text-sm font-bold text-green-400">
                    R$ {(commissionSummary?.totalPaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-urbana-gold/20 border-urbana-gold/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-urbana-gold" />
                <div>
                  <p className="text-xs text-urbana-gold">Barbeiros</p>
                  <p className="text-sm font-bold text-urbana-gold">
                    {Object.keys(commissionSummary?.byBarber || {}).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-900/20 border-blue-700/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-xs text-blue-400">Total</p>
                  <p className="text-sm font-bold text-blue-400">
                    R$ {(commissionSummary?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e ações */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar barbeiro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSelectAll}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              {selectedCommissions.length === filteredCommissions.length ? 'Desmarcar' : 'Selecionar'} Todos
            </Button>
            
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={selectedCommissions.length === 0}
                  className="bg-urbana-gold text-black hover:bg-urbana-gold/90"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pagar Selecionadas
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle>Pagar Comissões</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="payment-method">Método de Pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Selecione o método" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="payment-notes">Observações</Label>
                    <Textarea
                      id="payment-notes"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Observações sobre o pagamento..."
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm text-gray-300">
                      Total a pagar: <span className="font-bold text-urbana-gold">
                        R$ {selectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </p>
                    <p className="text-sm text-gray-300">
                      Comissões selecionadas: {selectedCommissions.length}
                    </p>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => setPaymentDialogOpen(false)}
                      variant="outline"
                      className="flex-1 border-gray-600 text-white hover:bg-gray-700"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handlePayment}
                      disabled={payCommissions.isPending}
                      className="flex-1 bg-urbana-gold text-black hover:bg-urbana-gold/90"
                    >
                      {payCommissions.isPending ? 'Processando...' : 'Confirmar Pagamento'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Lista de comissões */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {filteredCommissions.map((commission) => (
          <Card key={commission.id} className="bg-gray-700 border-gray-600 hover:bg-gray-600 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCommissions.includes(commission.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCommissions([...selectedCommissions, commission.id]);
                      } else {
                        setSelectedCommissions(selectedCommissions.filter(id => id !== commission.id));
                      }
                    }}
                    className="w-4 h-4 text-urbana-gold bg-gray-600 border-gray-500 rounded focus:ring-urbana-gold focus:ring-2"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{commission.staff?.name || 'Barbeiro'}</h3>
                      <Badge variant={
                        commission.status === 'paid' ? 'default' : 
                        commission.status === 'pending' ? 'secondary' : 
                        'destructive'
                      }>
                        {commission.status === 'paid' ? 'Pago' : 
                         commission.status === 'pending' ? 'Pendente' : 
                         'Cancelado'}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <span>Taxa: {commission.commission_rate}%</span>
                      <span>Criado: {format(new Date(commission.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      {commission.payment_date && (
                        <span>Pago: {format(new Date(commission.payment_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-urbana-gold">
                    R$ {Number(commission.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredCommissions.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma comissão encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionPayments;
