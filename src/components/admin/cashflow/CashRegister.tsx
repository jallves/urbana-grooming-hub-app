import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import {
  Lock, Unlock, DollarSign, TrendingUp, TrendingDown,
  Clock, CalendarDays, AlertTriangle, CheckCircle2, ArrowRight
} from 'lucide-react';
import { format, parseISO, startOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CashRegister: React.FC = () => {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [openDialogVisible, setOpenDialogVisible] = useState(false);
  const [closeDialogVisible, setCloseDialogVisible] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  // Fetch today's session
  const { data: todaySession, isLoading: loadingSession } = useQuery({
    queryKey: ['cash-register-today', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_register_sessions')
        .select('*')
        .eq('date', today)
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  // Fetch previous session (for carryover balance)
  const { data: previousSession } = useQuery({
    queryKey: ['cash-register-previous', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_register_sessions')
        .select('*')
        .lt('date', today)
        .eq('status', 'closed')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch recent sessions history
  const { data: recentSessions } = useQuery({
    queryKey: ['cash-register-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_register_sessions')
        .select('*')
        .order('date', { ascending: false })
        .limit(15);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });

  // Fetch today's financial movements (income/expense)
  const { data: todayMovements } = useQuery({
    queryKey: ['cash-register-movements', today],
    queryFn: async () => {
      // Financial records
      const { data: frData, error: frError } = await supabase
        .from('financial_records')
        .select('transaction_type, net_amount, amount, status')
        .eq('transaction_date', today)
        .eq('status', 'completed');
      if (frError) throw frError;

      // Contas receber received today
      const { data: crData, error: crError } = await supabase
        .from('contas_receber')
        .select('valor, status')
        .eq('data_recebimento', today)
        .eq('status', 'recebido');
      if (crError) throw crError;

      // Contas pagar paid today
      const { data: cpData, error: cpError } = await supabase
        .from('contas_pagar')
        .select('valor, status')
        .eq('data_pagamento', today)
        .eq('status', 'pago');
      if (cpError) throw cpError;

      // Calculate from financial_records
      let income = 0;
      let expense = 0;
      (frData || []).forEach(r => {
        const val = Number(r.net_amount || r.amount || 0);
        if (r.transaction_type === 'revenue') income += val;
        else expense += val;
      });

      // Add contas receber
      (crData || []).forEach(r => { income += Number(r.valor || 0); });

      // Add contas pagar
      (cpData || []).forEach(r => { expense += Number(r.valor || 0); });

      return { income, expense, net: income - expense };
    },
    refetchInterval: 10000,
  });

  const isOpen = todaySession?.status === 'open';
  const isClosed = todaySession?.status === 'closed';
  const noSession = !todaySession;

  const previousClosingBalance = previousSession?.closing_balance ?? 0;

  // Expected balance = opening + income - expense
  const expectedBalance = useMemo(() => {
    if (!todaySession) return 0;
    const opening = Number(todaySession.opening_balance || 0);
    const income = todayMovements?.income || 0;
    const expense = todayMovements?.expense || 0;
    return opening + income - expense;
  }, [todaySession, todayMovements]);

  // Open cash register
  const openMutation = useMutation({
    mutationFn: async () => {
      const bal = parseFloat(openingBalance) || 0;
      const { error } = await supabase
        .from('cash_register_sessions')
        .insert({
          date: today,
          opening_balance: bal,
          status: 'open',
          opened_at: new Date().toISOString(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Caixa aberto com sucesso!');
      setOpenDialogVisible(false);
      setOpeningBalance('');
      queryClient.invalidateQueries({ queryKey: ['cash-register-today'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-history'] });
    },
    onError: (err: any) => toast.error('Erro ao abrir caixa', { description: err.message }),
  });

  // Close cash register
  const closeMutation = useMutation({
    mutationFn: async () => {
      if (!todaySession) throw new Error('Nenhum caixa aberto');
      const closeBal = parseFloat(closingBalance) || 0;
      const diff = closeBal - expectedBalance;

      const { error } = await supabase
        .from('cash_register_sessions')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closing_balance: closeBal,
          expected_balance: expectedBalance,
          difference: diff,
          total_sales: todayMovements?.income || 0,
          total_expenses: todayMovements?.expense || 0,
          notes: closeNotes || null,
        })
        .eq('id', todaySession.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Caixa fechado com sucesso!');
      setCloseDialogVisible(false);
      setClosingBalance('');
      setCloseNotes('');
      queryClient.invalidateQueries({ queryKey: ['cash-register-today'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-history'] });
    },
    onError: (err: any) => toast.error('Erro ao fechar caixa', { description: err.message }),
  });

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (loadingSession) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Carregando caixa...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-auto">
      {/* Status Header */}
      <div className={`rounded-lg p-4 border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isOpen
          ? 'bg-green-50 border-green-300'
          : isClosed
          ? 'bg-gray-100 border-gray-300'
          : 'bg-yellow-50 border-yellow-300'
      }`}>
        <div className="flex items-center gap-3">
          {isOpen ? (
            <Unlock className="h-6 w-6 text-green-600" />
          ) : isClosed ? (
            <Lock className="h-6 w-6 text-gray-500" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isOpen ? 'Caixa Aberto' : isClosed ? 'Caixa Fechado' : 'Caixa Não Aberto'}
            </h2>
            <p className="text-sm text-gray-600">
              {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              {isOpen && todaySession?.opened_at && (
                <span className="ml-2 text-green-700">
                  • Aberto às {format(parseISO(todaySession.opened_at), 'HH:mm')}
                </span>
              )}
              {isClosed && todaySession?.closed_at && (
                <span className="ml-2 text-gray-500">
                  • Fechado às {format(parseISO(todaySession.closed_at), 'HH:mm')}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {noSession && (
            <Dialog open={openDialogVisible} onOpenChange={setOpenDialogVisible}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Unlock className="h-4 w-4 mr-2" />
                  Abrir Caixa
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white max-w-md">
                <DialogHeader>
                  <DialogTitle>Abrir Caixa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Saldo de Abertura (R$)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={`Sugestão: ${fmt(Number(previousClosingBalance))}`}
                      value={openingBalance}
                      onChange={e => setOpeningBalance(e.target.value)}
                      className="bg-white border-gray-300"
                    />
                    {previousClosingBalance > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Fechamento anterior: <strong>{fmt(Number(previousClosingBalance))}</strong>
                        <Button
                          variant="link"
                          className="text-xs p-0 ml-1 h-auto"
                          onClick={() => setOpeningBalance(String(previousClosingBalance))}
                        >
                          Usar este valor
                        </Button>
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenDialogVisible(false)}>Cancelar</Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => openMutation.mutate()}
                    disabled={openMutation.isPending}
                  >
                    {openMutation.isPending ? 'Abrindo...' : 'Confirmar Abertura'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {isOpen && (
            <Dialog open={closeDialogVisible} onOpenChange={setCloseDialogVisible}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Lock className="h-4 w-4 mr-2" />
                  Fechar Caixa
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white max-w-md">
                <DialogHeader>
                  <DialogTitle>Fechar Caixa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm border border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Abertura:</span>
                      <span className="font-medium">{fmt(Number(todaySession?.opening_balance || 0))}</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span>+ Entradas:</span>
                      <span className="font-medium">{fmt(todayMovements?.income || 0)}</span>
                    </div>
                    <div className="flex justify-between text-red-700">
                      <span>- Saídas:</span>
                      <span className="font-medium">{fmt(todayMovements?.expense || 0)}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
                      <span>Saldo Esperado:</span>
                      <span className={expectedBalance >= 0 ? 'text-blue-700' : 'text-red-700'}>{fmt(expectedBalance)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Saldo Real no Caixa (R$)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Conte o dinheiro e informe"
                      value={closingBalance}
                      onChange={e => setClosingBalance(e.target.value)}
                      className="bg-white border-gray-300"
                    />
                    {closingBalance && (
                      <p className={`text-xs mt-1 font-medium ${
                        parseFloat(closingBalance) - expectedBalance === 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        Diferença: {fmt(parseFloat(closingBalance) - expectedBalance)}
                        {parseFloat(closingBalance) - expectedBalance === 0 && ' ✅ Bateu!'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Observações (opcional)
                    </label>
                    <Textarea
                      placeholder="Anotações sobre o fechamento..."
                      value={closeNotes}
                      onChange={e => setCloseNotes(e.target.value)}
                      className="bg-white border-gray-300"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCloseDialogVisible(false)}>Cancelar</Button>
                  <Button
                    variant="destructive"
                    onClick={() => closeMutation.mutate()}
                    disabled={closeMutation.isPending || !closingBalance}
                  >
                    {closeMutation.isPending ? 'Fechando...' : 'Confirmar Fechamento'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Today's Summary - Only when open or closed */}
      {(isOpen || isClosed) && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Abertura</p>
              <p className="text-sm sm:text-lg font-bold text-gray-800">
                {fmt(Number(todaySession?.opening_balance || 0))}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] sm:text-xs text-green-600 font-medium">Entradas</p>
              <p className="text-sm sm:text-lg font-bold text-green-700">
                +{fmt(todayMovements?.income || 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] sm:text-xs text-red-600 font-medium">Saídas</p>
              <p className="text-sm sm:text-lg font-bold text-red-700">
                -{fmt(todayMovements?.expense || 0)}
              </p>
            </CardContent>
          </Card>
          <Card className={`border ${expectedBalance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-300'}`}>
            <CardContent className="p-3 text-center">
              <p className="text-[10px] sm:text-xs font-medium" style={{ color: expectedBalance >= 0 ? '#2563eb' : '#dc2626' }}>
                Saldo Esperado
              </p>
              <p className="text-sm sm:text-lg font-bold" style={{ color: expectedBalance >= 0 ? '#1d4ed8' : '#b91c1c' }}>
                {fmt(expectedBalance)}
              </p>
            </CardContent>
          </Card>
          {isClosed && (
            <Card className={`border ${(todaySession?.difference || 0) === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-300'}`}>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] sm:text-xs font-medium text-gray-600">Diferença</p>
                <p className={`text-sm sm:text-lg font-bold ${
                  (todaySession?.difference || 0) === 0 ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {fmt(Number(todaySession?.difference || 0))}
                  {(todaySession?.difference || 0) === 0 && ' ✅'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* History */}
      <Card className="bg-white border-gray-200 flex-1">
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base text-gray-800 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Histórico de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Data</th>
                  <th className="text-center py-2.5 px-3 font-semibold text-gray-700">Status</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Abertura</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-gray-700 hidden sm:table-cell">Entradas</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-gray-700 hidden sm:table-cell">Saídas</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Fechamento</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions && recentSessions.length > 0 ? (
                  recentSessions.map((s, idx) => {
                    const diff = Number(s.difference || 0);
                    const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';
                    return (
                      <tr key={s.id} className={`${rowBg} border-b border-gray-100 hover:bg-gray-100/80`}>
                        <td className="py-2 px-3 text-gray-700 whitespace-nowrap font-medium">
                          {format(parseISO(s.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            s.status === 'open'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {s.status === 'open' ? 'Aberto' : 'Fechado'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-gray-700">
                          {fmt(Number(s.opening_balance || 0))}
                        </td>
                        <td className="py-2 px-3 text-right text-green-700 hidden sm:table-cell">
                          +{fmt(Number(s.total_sales || 0))}
                        </td>
                        <td className="py-2 px-3 text-right text-red-700 hidden sm:table-cell">
                          -{fmt(Number(s.total_expenses || 0))}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-gray-800">
                          {s.status === 'closed' ? fmt(Number(s.closing_balance || 0)) : '-'}
                        </td>
                        <td className={`py-2 px-3 text-right font-bold whitespace-nowrap ${
                          s.status !== 'closed' ? 'text-gray-400' :
                          diff === 0 ? 'text-green-600' :
                          diff > 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {s.status === 'closed' ? (
                            <>
                              {fmt(diff)}
                              {diff === 0 && ' ✅'}
                            </>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-medium">Nenhum registro de caixa</p>
                      <p className="text-sm">Abra o caixa para iniciar</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashRegister;
