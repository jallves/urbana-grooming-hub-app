import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  CreditCard,
  RefreshCw,
  AlertTriangle,
  Undo2,
  CheckSquare,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  resolverPendenciaAndroid, 
  confirmarTransacaoTEF, 
  isAndroidTEFAvailable 
} from '@/lib/tef/tefAndroidBridge';

interface TEFTransaction {
  id: string;
  payment_id: string;
  terminal_id: string;
  amount: number;
  payment_type: string;
  installments: number;
  reference: string | null;
  status: 'processing' | 'approved' | 'declined' | 'canceled' | 'expired';
  authorization_code: string | null;
  nsu: string | null;
  card_brand: string | null;
  created_at: string;
  updated_at: string;
  // Campos para resolução de pendência
  requires_confirmation?: boolean;
  confirmation_transaction_id?: string;
  pending_transaction_exists?: boolean;
}

const TEFHomologacao: React.FC = () => {
  const [transactions, setTransactions] = useState<TEFTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsAndroid(isAndroidTEFAvailable());
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tef_mock_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      toast.error('Erro ao carregar transações');
      console.error(error);
    } else {
      setTransactions((data || []) as TEFTransaction[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTransactions();

    // Subscrever para atualizações em tempo real
    const channel = supabase
      .channel('tef-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tef_mock_transactions'
        },
        () => {
          loadTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const simulateResponse = async (
    paymentId: string, 
    status: 'approved' | 'declined' | 'expired',
    authCode?: string
  ) => {
    try {
      const transaction = transactions.find(t => t.payment_id === paymentId);
      if (!transaction) {
        toast.error('Transação não encontrada');
        return;
      }

      // Enviar webhook
      const webhookPayload = {
        paymentId: paymentId,
        status: status,
        authorizationCode: authCode || `${Math.floor(100000 + Math.random() * 900000)}`,
        nsu: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        cardBrand: transaction.payment_type === 'credit' || transaction.payment_type === 'debit' 
          ? ['Visa', 'Mastercard', 'Elo'][Math.floor(Math.random() * 3)]
          : 'PIX',
        amount: transaction.amount,
        reference: transaction.reference,
        // Adicionar flags de pendência para simular cenários
        requiresConfirmation: true,
        confirmationTransactionId: `${paymentId}_CONF_${Date.now()}`,
        pendingTransactionExists: false
      };

      const response = await supabase.functions.invoke('tef-webhook', {
        body: webhookPayload
      });

      if (response.error) {
        throw response.error;
      }

      toast.success(`Transação ${status === 'approved' ? 'aprovada' : status === 'declined' ? 'recusada' : 'expirada'}`);
      await loadTransactions();
    } catch (error) {
      console.error('Erro ao simular resposta:', error);
      toast.error('Erro ao processar simulação');
    }
  };

  /**
   * PASSO 33/34: Simula criação de pendência (transação não confirmada)
   * Após segunda venda, a pendência deve ser tratada com desfazimento manual
   */
  const simulatePendingTransaction = async (paymentId: string) => {
    try {
      setPendingAction(paymentId);
      
      const transaction = transactions.find(t => t.payment_id === paymentId);
      if (!transaction) {
        toast.error('Transação não encontrada');
        return;
      }

      // Aprovar a transação MAS marcar como pendente (requer confirmação)
      const webhookPayload = {
        paymentId: paymentId,
        status: 'approved',
        authorizationCode: `${Math.floor(100000 + Math.random() * 900000)}`,
        nsu: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        cardBrand: ['Visa', 'Mastercard', 'Elo'][Math.floor(Math.random() * 3)],
        amount: transaction.amount,
        reference: transaction.reference,
        // IMPORTANTE: Marcar que requer confirmação e existe pendência
        requiresConfirmation: true,
        confirmationTransactionId: `${paymentId}_PENDING_${Date.now()}`,
        pendingTransactionExists: true
      };

      const response = await supabase.functions.invoke('tef-webhook', {
        body: webhookPayload
      });

      if (response.error) throw response.error;

      // Atualizar no banco para marcar como pendente
      await supabase
        .from('tef_mock_transactions')
        .update({
          requires_confirmation: true,
          confirmation_transaction_id: webhookPayload.confirmationTransactionId,
          pending_transaction_exists: true
        } as any)
        .eq('payment_id', paymentId);

      toast.warning('⚠️ Transação aprovada com PENDÊNCIA - Requer confirmação ou desfazimento', {
        duration: 5000
      });
      
      await loadTransactions();
    } catch (error) {
      console.error('Erro ao simular pendência:', error);
      toast.error('Erro ao criar pendência');
    } finally {
      setPendingAction(null);
    }
  };

  /**
   * PASSO 33/34: Enviar DESFAZIMENTO MANUAL para resolver pendência
   * Conforme documentação: transactionStatus=DESFEITO_MANUAL
   */
  const sendManualUndo = async (paymentId: string, confirmationId?: string) => {
    try {
      setPendingAction(paymentId);
      
      console.log('[TEFHomologacao] Enviando DESFAZIMENTO MANUAL');
      console.log('[TEFHomologacao] paymentId:', paymentId);
      console.log('[TEFHomologacao] confirmationId:', confirmationId);
      
      // Se estamos no Android, usar o bridge real
      if (isAndroid && confirmationId) {
        const success = confirmarTransacaoTEF(confirmationId, 'DESFEITO_MANUAL');
        if (success) {
          toast.success('✅ DESFEITO_MANUAL enviado via Android');
        } else {
          toast.error('Erro ao enviar desfazimento via Android');
          return;
        }
      }
      
      // Atualizar no banco: marcar transação como desfeita
      const { error } = await supabase
        .from('tef_mock_transactions')
        .update({
          status: 'canceled',
          requires_confirmation: false,
          pending_transaction_exists: false,
          updated_at: new Date().toISOString()
        } as any)
        .eq('payment_id', paymentId);

      if (error) throw error;

      // Simular webhook de resposta do desfazimento
      await supabase.functions.invoke('tef-webhook', {
        body: {
          paymentId,
          status: 'canceled',
          message: 'Transação desfeita manualmente (DESFEITO_MANUAL)'
        }
      });

      toast.success('✅ DESFEITO_MANUAL - Pendência resolvida!', {
        description: 'A transação foi desfeita conforme passos 33/34 da homologação',
        duration: 5000
      });
      
      await loadTransactions();
    } catch (error) {
      console.error('Erro ao enviar desfazimento:', error);
      toast.error('Erro ao enviar desfazimento manual');
    } finally {
      setPendingAction(null);
    }
  };

  /**
   * Enviar CONFIRMADO_MANUAL para resolver pendência
   */
  const sendManualConfirmation = async (paymentId: string, confirmationId?: string) => {
    try {
      setPendingAction(paymentId);
      
      console.log('[TEFHomologacao] Enviando CONFIRMADO_MANUAL');
      console.log('[TEFHomologacao] paymentId:', paymentId);
      console.log('[TEFHomologacao] confirmationId:', confirmationId);
      
      // Se estamos no Android, usar o bridge real
      if (isAndroid && confirmationId) {
        const success = confirmarTransacaoTEF(confirmationId, 'CONFIRMADO_MANUAL');
        if (success) {
          toast.success('✅ CONFIRMADO_MANUAL enviado via Android');
        } else {
          toast.error('Erro ao enviar confirmação via Android');
          return;
        }
      }
      
      // Atualizar no banco: marcar transação como confirmada
      const { error } = await supabase
        .from('tef_mock_transactions')
        .update({
          requires_confirmation: false,
          pending_transaction_exists: false,
          updated_at: new Date().toISOString()
        } as any)
        .eq('payment_id', paymentId);

      if (error) throw error;

      toast.success('✅ CONFIRMADO_MANUAL - Transação confirmada!', {
        duration: 5000
      });
      
      await loadTransactions();
    } catch (error) {
      console.error('Erro ao enviar confirmação:', error);
      toast.error('Erro ao enviar confirmação manual');
    } finally {
      setPendingAction(null);
    }
  };

  /**
   * Resolver pendência via Android (usa resolverPendencia do PayGo)
   */
  const resolvePendingViaAndroid = async (action: 'confirmar' | 'desfazer') => {
    if (!isAndroid) {
      toast.error('Função disponível apenas no dispositivo Android');
      return;
    }

    try {
      setPendingAction('android-resolve');
      
      const success = resolverPendenciaAndroid(action);
      
      if (success) {
        toast.success(`✅ Resolução de pendência (${action === 'confirmar' ? 'CONFIRMAR' : 'DESFAZER'}) enviada!`, {
          description: 'Aguardando resposta do PayGo...',
          duration: 5000
        });
      } else {
        toast.error('Erro ao resolver pendência');
      }
    } catch (error) {
      console.error('Erro ao resolver pendência:', error);
      toast.error('Erro ao resolver pendência');
    } finally {
      setPendingAction(null);
    }
  };

  const getStatusBadge = (status: string, hasPending?: boolean) => {
    const statusConfig = {
      processing: { label: 'Processando', color: 'bg-blue-500', icon: Clock },
      approved: { label: hasPending ? 'Aprovado (PENDENTE)' : 'Aprovado', color: hasPending ? 'bg-yellow-500' : 'bg-green-500', icon: hasPending ? AlertTriangle : CheckCircle },
      declined: { label: 'Recusado', color: 'bg-red-500', icon: XCircle },
      canceled: { label: 'Cancelado/Desfeito', color: 'bg-gray-500', icon: AlertCircle },
      expired: { label: 'Expirado', color: 'bg-orange-500', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  // Verificar se há transações pendentes
  const pendingTransactions = transactions.filter(t => 
    (t.requires_confirmation || t.pending_transaction_exists) && t.status === 'approved'
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-black">Painel de Homologação TEF PayGo</h3>
          <p className="text-sm text-gray-600">
            Simule transações, pendências e resoluções (Passos 33/34)
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className={isAndroid ? 'border-green-500 text-green-600' : 'border-gray-300 text-gray-500'}>
            {isAndroid ? '✅ Android' : '🌐 Web'}
          </Badge>
          <Button
            onClick={loadTransactions}
            variant="outline"
            size="sm"
            className="border-gray-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alerta de Pendências - Passos 33/34 */}
      {pendingTransactions.length > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Transações Pendentes Detectadas!</AlertTitle>
          <AlertDescription className="text-yellow-700">
            <p className="mb-2">
              Existem {pendingTransactions.length} transação(ões) aguardando confirmação/desfazimento.
            </p>
            <p className="text-sm">
              <strong>Passos 33/34:</strong> Antes de iniciar nova venda, resolva as pendências 
              enviando <code className="bg-yellow-200 px-1 rounded">DESFEITO_MANUAL</code> ou <code className="bg-yellow-200 px-1 rounded">CONFIRMADO_MANUAL</code>.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Botões de Resolução Android */}
      {isAndroid && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
              <History className="h-4 w-4" />
              Resolução de Pendência (Android PayGo)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              onClick={() => resolvePendingViaAndroid('desfazer')}
              size="sm"
              variant="destructive"
              disabled={pendingAction === 'android-resolve'}
            >
              <Undo2 className="h-4 w-4 mr-1" />
              DESFAZER Pendência
            </Button>
            <Button
              onClick={() => resolvePendingViaAndroid('confirmar')}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              disabled={pendingAction === 'android-resolve'}
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              CONFIRMAR Pendência
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">
          <Clock className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Carregando transações...</p>
        </div>
      ) : transactions.length === 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhuma transação pendente</p>
            <p className="text-sm text-gray-400 mt-2">
              Inicie um pagamento no Totem para testar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => {
            const hasPending = transaction.requires_confirmation || transaction.pending_transaction_exists;
            const confirmationId = transaction.confirmation_transaction_id;
            
            return (
              <Card 
                key={transaction.id} 
                className={`bg-white border-gray-200 ${hasPending && transaction.status === 'approved' ? 'ring-2 ring-yellow-400' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base text-black">
                        {transaction.payment_id}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Terminal: {transaction.terminal_id}
                      </CardDescription>
                    </div>
                    {getStatusBadge(transaction.status, hasPending && transaction.status === 'approved')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Valor</p>
                      <p className="font-semibold text-black">
                        {formatAmount(transaction.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tipo</p>
                      <p className="font-semibold text-black capitalize">
                        {transaction.payment_type}
                        {transaction.installments > 1 && ` (${transaction.installments}x)`}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Criado em</p>
                      <p className="text-black">{formatDate(transaction.created_at)}</p>
                    </div>
                    {transaction.reference && (
                      <div>
                        <p className="text-gray-500">Referência</p>
                        <p className="text-black">{transaction.reference}</p>
                      </div>
                    )}
                  </div>

                  {/* Botões para transações em processamento */}
                  {transaction.status === 'processing' && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-medium">Simulação Normal:</p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => simulateResponse(transaction.payment_id, 'approved')}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            onClick={() => simulateResponse(transaction.payment_id, 'declined')}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Recusar
                          </Button>
                          <Button
                            onClick={() => simulateResponse(transaction.payment_id, 'expired')}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Expirar
                          </Button>
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <p className="text-xs text-gray-500 font-medium">Simulação Passos 33/34 (Criar Pendência):</p>
                        <Button
                          onClick={() => simulatePendingTransaction(transaction.payment_id)}
                          size="sm"
                          variant="outline"
                          className="w-full border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                          disabled={pendingAction === transaction.payment_id}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Aprovar COM PENDÊNCIA (requer confirmação)
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Botões para transações PENDENTES (Passos 33/34) */}
                  {hasPending && transaction.status === 'approved' && (
                    <>
                      <Separator />
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <p className="text-xs text-yellow-800 font-semibold mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          TRANSAÇÃO PENDENTE - Passos 33/34
                        </p>
                        {confirmationId && (
                          <p className="text-xs text-gray-500 mb-2 font-mono break-all">
                            ID: {confirmationId}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => sendManualUndo(transaction.payment_id, confirmationId)}
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            disabled={pendingAction === transaction.payment_id}
                          >
                            <Undo2 className="h-4 w-4 mr-1" />
                            DESFEITO_MANUAL
                          </Button>
                          <Button
                            onClick={() => sendManualConfirmation(transaction.payment_id, confirmationId)}
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={pendingAction === transaction.payment_id}
                          >
                            <CheckSquare className="h-4 w-4 mr-1" />
                            CONFIRMADO_MANUAL
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {transaction.authorization_code && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Código Auth.</p>
                          <p className="font-mono text-black">{transaction.authorization_code}</p>
                        </div>
                        {transaction.nsu && (
                          <div>
                            <p className="text-gray-500">NSU</p>
                            <p className="font-mono text-black">{transaction.nsu}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Documentação dos Passos 33/34 */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-700">📖 Documentação: Passos 33 e 34</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-600 space-y-2">
          <p>
            <strong>Transação Pendente:</strong> Após realizar uma transação, é necessário verificar 
            se essa transação exige confirmação. Em caso positivo, deve ser enviada uma confirmação 
            ou desfazimento.
          </p>
          <p>
            <strong>Problema:</strong> Se a transação não for confirmada ou desfeita, ela ficará pendente. 
            Não será possível realizar nenhuma outra venda até que a pendência seja resolvida.
          </p>
          <p>
            <strong>Solução (Passos 33/34):</strong> Após a segunda venda, enviar 
            <code className="bg-gray-200 px-1 mx-1 rounded">DESFEITO_MANUAL</code> 
            para resolver a pendência e liberar o sistema para novas transações.
          </p>
          <div className="bg-gray-100 p-2 rounded mt-2 font-mono text-xs">
            <p>// Código de confirmação/desfazimento:</p>
            <p>transactionStatus: "DESFEITO_MANUAL" ou "CONFIRMADO_MANUAL"</p>
            <p>confirmationTransactionId: "[ID recebido na resposta]"</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TEFHomologacao;