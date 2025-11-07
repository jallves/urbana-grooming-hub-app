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
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

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
}

const TEFHomologacao: React.FC = () => {
  const [transactions, setTransactions] = useState<TEFTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tef_mock_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

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
        reference: transaction.reference
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      processing: { label: 'Processando', color: 'bg-blue-500', icon: Clock },
      approved: { label: 'Aprovado', color: 'bg-green-500', icon: CheckCircle },
      declined: { label: 'Recusado', color: 'bg-red-500', icon: XCircle },
      canceled: { label: 'Cancelado', color: 'bg-gray-500', icon: AlertCircle },
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-black">Painel de Simulação TEF</h3>
          <p className="text-sm text-gray-600">
            Simule aprovações, recusas e outros cenários de pagamento
          </p>
        </div>
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
          {transactions.map((transaction) => (
            <Card key={transaction.id} className="bg-white border-gray-200">
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
                  {getStatusBadge(transaction.status)}
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

                {transaction.status === 'processing' && (
                  <div className="flex gap-2 pt-2">
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
          ))}
        </div>
      )}
    </div>
  );
};

export default TEFHomologacao;