import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Banknote, CreditCard, DollarSign, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import barbershopBg from '@/assets/barbershop-background.jpg';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import { useTEFPaymentResult } from '@/hooks/useTEFPaymentResult';
import { useInternetHealth } from '@/hooks/useInternetHealth';

type SplitMethod = 'cash' | 'debit' | 'credit' | 'pix';
type SplitStatus = 'pending' | 'processing' | 'paid' | 'failed';

interface SplitPart {
  id: string;
  method: SplitMethod;
  amount: number;
  status: SplitStatus;
  transaction_id?: string | null;
  error?: string | null;
}

const METHOD_LABELS: Record<SplitMethod, string> = {
  cash: 'Dinheiro',
  debit: 'Débito',
  credit: 'Crédito',
  pix: 'PIX',
};

const METHOD_ICONS: Record<SplitMethod, React.ComponentType<{ className?: string }>> = {
  cash: Banknote,
  debit: CreditCard,
  credit: CreditCard,
  pix: DollarSign,
};

/**
 * Formata reais a partir de dígitos: cada dígito acrescenta 1 centavo à direita.
 * 123 → 1,23 | 12345 → 123,45
 */
function formatFromDigits(raw: string): { display: string; value: number } {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 8);
  const cents = parseInt(digits || '0', 10);
  const value = cents / 100;
  return { display: value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), value };
}

function newId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const TotemSplitPayment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as any;

  // Modo: 'service' (checkout de agendamento) ou 'product' (checkout de produto)
  const mode: 'service' | 'product' = state.mode || 'service';
  const total: number = Number(state.total || 0);

  // Dados para serviço
  const { venda_id, session_id, appointment, client, tipAmount = 0, comboDiscount = 0, comboName = null, resumo, extraServices, selectedProducts } = state;

  // Dados para produto
  const { sale, cart, barber, subscriptionPlan } = state;

  const [parts, setParts] = useState<SplitPart[]>([]);

  // Painel de adicionar parcela
  const [addOpen, setAddOpen] = useState(true);
  const [newMethod, setNewMethod] = useState<SplitMethod>('cash');
  const [amountInput, setAmountInput] = useState('0,00');
  const [amountValue, setAmountValue] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Refs para orquestrar 1 parcela de cada vez com PayGo
  const activePartRef = useRef<SplitPart | null>(null);
  const partResolverRef = useRef<((res: any) => void) | null>(null);
  const [tefEnabled, setTefEnabled] = useState(false);

  const {
    isAndroidAvailable,
    isPinpadConnected,
    iniciarPagamento: iniciarPagamentoTEF,
    cancelarPagamento: cancelarPagamentoTEF,
    verificarConexao,
  } = useTEFAndroid({});
  const { online: internetOnline } = useInternetHealth();

  useTEFPaymentResult({
    enabled: tefEnabled,
    pollingInterval: 500,
    maxWaitTime: 180000,
    onResult: (r) => {
      const resolver = partResolverRef.current;
      partResolverRef.current = null;
      setTefEnabled(false);
      if (resolver) resolver(r);
    },
  });

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    if (!total || total <= 0 || (mode === 'service' && !venda_id) || (mode === 'product' && !sale?.id)) {
      toast.error('Dados de pagamento incompletos');
      navigate('/totem/home');
    }
    return () => document.documentElement.classList.remove('totem-mode');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paidTotal = useMemo(
    () => parts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    [parts]
  );
  const plannedTotal = useMemo(() => parts.reduce((s, p) => s + p.amount, 0), [parts]);
  const remaining = useMemo(() => Math.max(0, Number((total - paidTotal).toFixed(2))), [total, paidTotal]);
  const remainingPlanned = useMemo(() => Math.max(0, Number((total - plannedTotal).toFixed(2))), [total, plannedTotal]);
  const allPaid = remaining <= 0 && parts.length > 0 && parts.every((p) => p.status === 'paid');

  const handleAmountChange = (raw: string) => {
    const { display, value } = formatFromDigits(raw);
    setAmountInput(display);
    setAmountValue(value);
  };

  const quickFill = (portion: 'half' | 'rest') => {
    const v = portion === 'half'
      ? Number((remainingPlanned / 2).toFixed(2))
      : remainingPlanned;
    const cents = Math.round(v * 100).toString();
    handleAmountChange(cents);
  };

  const handleAddPart = () => {
    if (amountValue <= 0) {
      toast.error('Informe o valor da parcela');
      return;
    }
    if (amountValue > remainingPlanned + 0.001) {
      toast.error(`Valor excede o restante (R$ ${remainingPlanned.toFixed(2)})`);
      return;
    }
    setParts((prev) => [
      ...prev,
      { id: newId(), method: newMethod, amount: Number(amountValue.toFixed(2)), status: 'pending' },
    ]);
    setAmountInput('0,00');
    setAmountValue(0);
  };

  const removePart = (id: string) => {
    setParts((prev) => prev.filter((p) => p.id !== id || p.status === 'paid'));
  };

  /**
   * Executa 1 parcela. Para cartão/PIX chamamos o PayGo TEF nativo se
   * disponível; caso contrário, simulação (mesma prática dos fluxos atuais
   * quando a bridge não está presente).
   */
  const runPart = async (part: SplitPart) => {
    setParts((prev) => prev.map((p) => (p.id === part.id ? { ...p, status: 'processing', error: null } : p)));

    try {
      if (part.method === 'cash') {
        await new Promise((r) => setTimeout(r, 400));
        markPaid(part.id, `CASH-${Date.now()}`);
        return;
      }

      // Cartão / PIX: SEMPRE chamar PayGo TEF nativo. Nunca simular
      // pagamentos com cartão/PIX — cobrança real é obrigatória.
      const hasNativeBridge = typeof window !== 'undefined' && typeof (window as any).TEF !== 'undefined';
      if (!hasNativeBridge || !isAndroidAvailable) {
        throw new Error('Terminal PayGo indisponível. Abra o app do Totem para pagar com cartão/PIX ou troque a parcela para Dinheiro.');
      }

      if (!internetOnline) {
        throw new Error('Sem internet no totem. Verifique o Wi-Fi.');
      }

      const status = verificarConexao();
      if (!status?.conectado) {
        throw new Error('Pinpad não conectado.');
      }

      // Prepara promessa que será resolvida por useTEFPaymentResult.onResult
      activePartRef.current = part;
      const resultPromise = new Promise<any>((resolve, reject) => {
        partResolverRef.current = resolve;
        // Timeout de segurança (3 min)
        setTimeout(() => {
          if (partResolverRef.current === resolve) {
            partResolverRef.current = null;
            setTefEnabled(false);
            reject(new Error('Tempo esgotado aguardando pagamento'));
          }
        }, 180_000);
      });

      setTefEnabled(true);
      const ordemId = `SPLIT_${part.id}`;
      const ok = await iniciarPagamentoTEF({
        ordemId,
        valor: part.amount,
        tipo: part.method as 'credit' | 'debit' | 'pix',
        parcelas: 1,
      });

      if (!ok) {
        setTefEnabled(false);
        partResolverRef.current = null;
        throw new Error('A bridge TEF retornou falha ao iniciar a transação.');
      }

      const result = await resultPromise;
      if (result?.status === 'aprovado') {
        markPaid(part.id, result.nsu || result.autorizacao || `TEF-${Date.now()}`);
      } else if (result?.status === 'cancelado') {
        throw new Error(result?.mensagem || 'Pagamento cancelado');
      } else {
        throw new Error(result?.mensagem || 'Pagamento recusado');
      }
    } catch (err: any) {
      const msg = err?.message || 'Erro ao processar pagamento';
      setParts((prev) => prev.map((p) => (p.id === part.id ? { ...p, status: 'failed', error: msg } : p)));
      toast.error(`Falha na parcela: ${msg}`);
    }
  };

  const markPaid = (id: string, transactionId: string) => {
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'paid', transaction_id: transactionId } : p)));
  };

  const retryPart = (id: string) => {
    const p = parts.find((x) => x.id === id);
    if (p) runPart(p);
  };

  const runNextPending = async () => {
    const next = parts.find((p) => p.status === 'pending');
    if (!next) return;
    await runPart(next);
  };

  const finalize = async () => {
    if (!allPaid) {
      toast.error('Ainda há parcelas pendentes');
      return;
    }
    setProcessing(true);

    const payments = parts
      .filter((p) => p.status === 'paid')
      .map((p) => ({
        method: p.method,
        amount: p.amount,
        transaction_id: p.transaction_id || null,
      }));

    try {
      if (mode === 'service') {
        // Atualiza a venda com o breakdown e finaliza via edge function
        await supabase.from('vendas').update({
          gorjeta: tipAmount,
          valor_total: total,
          forma_pagamento: 'MULTIPLO',
          payment_breakdown: payments,
        }).eq('id', venda_id);

        const { data, error } = await supabase.functions.invoke('totem-checkout', {
          body: {
            action: 'finish',
            venda_id,
            session_id,
            agendamento_id: appointment?.id,
            payment_method: 'multiple',
            payments,
            tipAmount,
            extras: (extraServices || []).map((s: any) => ({ id: s.id, nome: s.nome, preco: s.preco, tipo: 'SERVICO_EXTRA' })),
            products: (selectedProducts || []).map((p: any) => ({ id: p.id, nome: p.nome, preco: p.preco, quantidade: p.quantidade })),
            combo_discount: comboDiscount,
            combo_name: comboName,
          },
        });
        if (error) throw error;
        if (data?.success === false) throw new Error(data?.error || 'Erro ao finalizar');

        navigate('/totem/payment-success', {
          state: {
            appointment, client, total,
            paymentMethod: 'multiple',
            paymentBreakdown: payments,
            isDirect: false,
            selectedProducts, extraServices, resumo,
            tipAmount,
          },
        });
      } else {
        // PRODUTO
        await supabase.from('vendas').update({
          valor_total: total,
          forma_pagamento: 'MULTIPLO',
          payment_breakdown: payments,
        }).eq('id', sale.id);

        const { data, error } = await supabase.functions.invoke('totem-direct-sale', {
          body: {
            action: 'finish',
            venda_id: sale.id,
            payment_method: 'multiple',
            payments,
            transaction_data: { nsu: payments[0]?.transaction_id },
          },
        });
        if (error) throw error;
        if (data?.success === false) throw new Error(data?.error || 'Erro ao finalizar');

        navigate('/totem/product-payment-success', {
          state: {
            sale, client, cart, barber, subscriptionPlan,
            paymentMethod: 'multiple',
            paymentBreakdown: payments,
            total,
          },
        });
      }
    } catch (err: any) {
      console.error('[SPLIT] Erro ao finalizar:', err);
      toast.error(err?.message || 'Erro ao finalizar');
    } finally {
      setProcessing(false);
    }
  };

  const anyProcessing = parts.some((p) => p.status === 'processing');

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] flex flex-col p-4 font-poppins overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={barbershopBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/90 via-urbana-black/85 to-urbana-brown/80" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3 z-10">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="h-11 px-3 text-urbana-light active:text-urbana-gold active:bg-urbana-gold/20"
        >
          <ArrowLeft className="w-5 h-5 mr-1" /> Voltar
        </Button>
        <h1 className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light">
          Pagamento Múltiplo
        </h1>
        <div className="w-16" />
      </div>

      {/* Totals + progress */}
      <div className="z-10 grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        <Card className="p-3 bg-urbana-black-soft/60 border-2 border-urbana-gold/30 text-center">
          <p className="text-[10px] sm:text-xs text-urbana-light/60 uppercase">Total</p>
          <p className="text-lg sm:text-2xl font-black text-urbana-light">R$ {total.toFixed(2)}</p>
        </Card>
        <Card className="p-3 bg-emerald-900/40 border-2 border-emerald-500/40 text-center">
          <p className="text-[10px] sm:text-xs text-emerald-300/80 uppercase">Já pago</p>
          <p className="text-lg sm:text-2xl font-black text-emerald-300">R$ {paidTotal.toFixed(2)}</p>
        </Card>
        <Card className="p-3 col-span-2 sm:col-span-1 bg-urbana-gold/15 border-2 border-urbana-gold/60 text-center">
          <p className="text-[10px] sm:text-xs text-urbana-gold/80 uppercase">Restante</p>
          <p className="text-lg sm:text-2xl font-black text-urbana-gold">R$ {remaining.toFixed(2)}</p>
        </Card>
      </div>

      {/* Content */}
      <div className="flex-1 z-10 overflow-y-auto space-y-3 pb-4">
        {/* Parcelas */}
        {parts.length > 0 && (
          <Card className="p-3 sm:p-4 bg-urbana-black-soft/60 border-2 border-urbana-gold/30 space-y-2">
            <h2 className="text-sm font-bold text-urbana-light">Parcelas</h2>
            {parts.map((p, idx) => {
              const Icon = METHOD_ICONS[p.method];
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
                    p.status === 'paid'
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : p.status === 'processing'
                        ? 'bg-blue-500/10 border-blue-400/50'
                        : p.status === 'failed'
                          ? 'bg-red-500/10 border-red-400/50'
                          : 'bg-urbana-black/40 border-urbana-gold/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-urbana-gold/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-urbana-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-urbana-light">
                      Parcela {idx + 1} — {METHOD_LABELS[p.method]}
                    </p>
                    <p className="text-xs text-urbana-light/70">
                      {p.status === 'paid' && `Aprovado${p.transaction_id ? ` • ${p.transaction_id}` : ''}`}
                      {p.status === 'processing' && 'Processando…'}
                      {p.status === 'pending' && 'Aguardando pagamento'}
                      {p.status === 'failed' && (p.error || 'Falhou')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-black text-urbana-gold">R$ {p.amount.toFixed(2)}</p>
                  </div>
                  {p.status === 'paid' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : p.status === 'processing' ? (
                    <Loader2 className="w-5 h-5 text-blue-300 animate-spin" />
                  ) : (
                    <div className="flex flex-col gap-1">
                      {p.status === 'failed' && (
                        <Button
                          onClick={() => retryPart(p.id)}
                          size="sm"
                          className="h-8 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                        >
                          Tentar novamente
                        </Button>
                      )}
                      <Button
                        onClick={() => removePart(p.id)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-300 hover:text-red-200 hover:bg-red-500/20"
                        aria-label="Remover parcela"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        )}

        {/* Adicionar parcela */}
        {remainingPlanned > 0.001 && (
          <Card className="p-3 sm:p-4 bg-urbana-black-soft/60 border-2 border-urbana-gold/30 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-urbana-light">Adicionar forma de pagamento</h2>
              <span className="text-xs text-urbana-light/60">
                Falta: R$ {remainingPlanned.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {(['cash', 'debit', 'credit', 'pix'] as SplitMethod[]).map((m) => {
                const Icon = METHOD_ICONS[m];
                const isSelected = newMethod === m;
                return (
                  <button
                    key={m}
                    onClick={() => setNewMethod(m)}
                    className={`flex flex-col items-center justify-center gap-1 h-16 sm:h-20 rounded-xl border-2 transition-colors ${
                      isSelected
                        ? 'bg-urbana-gold/25 border-urbana-gold text-urbana-gold'
                        : 'bg-urbana-black/40 border-urbana-gold/20 text-urbana-light active:bg-urbana-gold/10'
                    }`}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-xs sm:text-sm font-bold">{METHOD_LABELS[m]}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-urbana-light/70">Valor</label>
              <div className="flex items-center gap-2">
                <span className="text-urbana-gold font-bold">R$</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={amountInput}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="flex-1 h-12 text-right text-lg font-bold bg-urbana-black/60 border-urbana-gold/30 text-urbana-light"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => quickFill('half')}
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9 border-urbana-gold/40 text-urbana-gold hover:bg-urbana-gold/10"
                >
                  50% do restante
                </Button>
                <Button
                  onClick={() => quickFill('rest')}
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9 border-urbana-gold/40 text-urbana-gold hover:bg-urbana-gold/10"
                >
                  Restante ({`R$ ${remainingPlanned.toFixed(2)}`})
                </Button>
              </div>
            </div>

            <Button
              onClick={handleAddPart}
              className="w-full h-12 bg-urbana-gold/20 border-2 border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold/30 font-bold"
            >
              <Plus className="w-5 h-5 mr-2" /> Adicionar parcela
            </Button>
          </Card>
        )}

        {/* Explicação */}
        <Card className="p-3 bg-urbana-black-soft/40 border border-urbana-gold/20">
          <p className="text-xs text-urbana-light/70 leading-relaxed">
            Divida o valor entre até 4 formas de pagamento. Toque em <b>Cobrar próxima parcela</b>
            {' '}para processar cada uma na ordem. Quando o restante chegar a <b>R$ 0,00</b>, o botão
            <b> Finalizar</b> conclui o atendimento no ERP com o detalhamento correto.
          </p>
        </Card>
      </div>

      {/* Action bar */}
      <div className="z-10 sticky bottom-0 -mx-4 px-4 py-3 bg-urbana-black/85 border-t-2 border-urbana-gold/30 flex gap-2">
        {parts.some((p) => p.status === 'pending') && !anyProcessing && (
          <Button
            onClick={runNextPending}
            className="flex-1 h-14 text-base font-black bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            Cobrar próxima parcela
          </Button>
        )}
        <Button
          onClick={finalize}
          disabled={!allPaid || processing || anyProcessing}
          className="flex-1 h-14 text-base font-black bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold text-urbana-black hover:from-urbana-gold hover:to-urbana-gold-vibrant disabled:opacity-40"
        >
          {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Finalizar (R$ {total.toFixed(2)})</>}
        </Button>
      </div>
    </div>
  );
};

export default TotemSplitPayment;