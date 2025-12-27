import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  Smartphone, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Download,
  Trash2,
  ArrowLeft,
  Wifi,
  WifiOff,
  Loader2,
  Copy,
  DollarSign,
  Banknote,
  QrCode,
  Delete,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import { 
  isAndroidTEFAvailable, 
  getLogsAndroid, 
  setModoDebug,
  limparLogsAndroid,
  confirmarTransacaoTEF
} from '@/lib/tef/tefAndroidBridge';
import { toast } from 'sonner';

type PaymentMethod = 'debito' | 'credito' | 'pix';

interface TransactionLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'transaction';
  message: string;
  data?: Record<string, unknown>;
}

export default function TotemTEFHomologacao() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('debito');
  const [installments, setInstallments] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([]);
  const [androidLogs, setAndroidLogs] = useState<string[]>([]);
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Dados da última transação para confirmação manual
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    confirmationId: string;
    nsu: string;
    autorizacao: string;
  } | null>(null);

  const { 
    isAndroidAvailable, 
    isPinpadConnected, 
    pinpadStatus,
    androidVersion,
    iniciarPagamento,
    verificarConexao
  } = useTEFAndroid({
    onSuccess: (resultado) => {
      setIsProcessing(false);
      
      addLog('success', `✅ TRANSAÇÃO APROVADA`, {
        nsu: resultado.nsu,
        autorizacao: resultado.autorizacao,
        bandeira: resultado.bandeira,
        valor: resultado.valor,
        requiresConfirmation: resultado.requiresConfirmation,
        confirmationId: resultado.confirmationTransactionId
      });
      
      // Se requer confirmação, salvar para confirmar manualmente
      if (resultado.requiresConfirmation && resultado.confirmationTransactionId) {
        setPendingConfirmation({
          confirmationId: resultado.confirmationTransactionId,
          nsu: resultado.nsu || '',
          autorizacao: resultado.autorizacao || ''
        });
        addLog('warning', '⚠️ Transação aguardando confirmação manual');
      } else {
        // Confirmar automaticamente para homologação
        if (resultado.confirmationTransactionId) {
          const confirmed = confirmarTransacaoTEF(resultado.confirmationTransactionId, 'CONFIRMADO_AUTOMATICO');
          addLog('info', confirmed ? '✅ Confirmação automática enviada' : '❌ Erro na confirmação automática');
        }
      }
      
      toast.success('Transação aprovada!', {
        description: `NSU: ${resultado.nsu} | Auth: ${resultado.autorizacao}`
      });
      
      refreshAndroidLogs();
    },
    onError: (erro) => {
      setIsProcessing(false);
      addLog('error', `❌ ERRO NA TRANSAÇÃO: ${erro}`);
      toast.error('Erro na transação', { description: erro });
      refreshAndroidLogs();
    },
    onCancelled: () => {
      setIsProcessing(false);
      addLog('warning', '⚠️ Transação cancelada pelo usuário');
      toast.info('Transação cancelada');
      refreshAndroidLogs();
    }
  });

  // Adicionar log
  const addLog = useCallback((type: TransactionLog['type'], message: string, data?: Record<string, unknown>) => {
    const log: TransactionLog = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    };
    setTransactionLogs(prev => [...prev, log]);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transactionLogs, androidLogs]);

  // Auto-refresh Android logs
  useEffect(() => {
    if (!autoRefreshLogs) return;
    
    const interval = setInterval(() => {
      refreshAndroidLogs();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [autoRefreshLogs]);

  // Ativar modo debug ao abrir
  useEffect(() => {
    if (isAndroidTEFAvailable()) {
      setModoDebug(true);
      addLog('info', '🔧 Modo debug ativado');
    }
    refreshAndroidLogs();
  }, []);

  const refreshAndroidLogs = () => {
    if (isAndroidTEFAvailable()) {
      const logs = getLogsAndroid();
      setAndroidLogs(logs);
    }
  };

  // Teclado numérico
  const handleNumberClick = (num: string) => {
    if (amount.length < 10) {
      setAmount(prev => prev + num);
    }
  };

  const handleClear = () => {
    setAmount('');
  };

  const handleBackspace = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  // Formatar valor para exibição
  const formatCurrency = (value: string): string => {
    if (!value) return 'R$ 0,00';
    const numValue = parseInt(value, 10) / 100;
    return numValue.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  // Iniciar transação
  const handleStartTransaction = async () => {
    if (!amount || parseInt(amount) === 0) {
      toast.error('Digite um valor');
      return;
    }

    if (!isAndroidAvailable) {
      toast.error('TEF Android não disponível');
      return;
    }

    if (!isPinpadConnected) {
      toast.error('Pinpad não conectado');
      return;
    }

    setIsProcessing(true);
    const valorReais = parseInt(amount, 10) / 100;
    const orderId = `HOMOLOG_${Date.now()}`;

    addLog('transaction', `🚀 INICIANDO TRANSAÇÃO`, {
      orderId,
      valor: valorReais,
      metodo: selectedMethod,
      parcelas: selectedMethod === 'credito' ? installments : 1
    });

    const tipo = selectedMethod === 'debito' ? 'debit' : 
                 selectedMethod === 'credito' ? 'credit' : 'pix';

    await iniciarPagamento({
      ordemId: orderId,
      valor: valorReais,
      tipo,
      parcelas: selectedMethod === 'credito' ? installments : 1
    });
  };

  // Confirmar transação pendente
  const handleConfirmTransaction = () => {
    if (!pendingConfirmation) return;
    
    const confirmed = confirmarTransacaoTEF(pendingConfirmation.confirmationId, 'CONFIRMADO_MANUAL');
    if (confirmed) {
      addLog('success', '✅ Transação confirmada manualmente');
      toast.success('Transação confirmada');
    } else {
      addLog('error', '❌ Erro ao confirmar transação');
      toast.error('Erro ao confirmar');
    }
    setPendingConfirmation(null);
  };

  // Desfazer transação pendente
  const handleUndoTransaction = () => {
    if (!pendingConfirmation) return;
    
    const undone = confirmarTransacaoTEF(pendingConfirmation.confirmationId, 'DESFEITO_MANUAL');
    if (undone) {
      addLog('warning', '⚠️ Transação desfeita manualmente');
      toast.info('Transação desfeita');
    } else {
      addLog('error', '❌ Erro ao desfazer transação');
      toast.error('Erro ao desfazer');
    }
    setPendingConfirmation(null);
  };

  // Limpar logs
  const handleClearLogs = () => {
    setTransactionLogs([]);
    limparLogsAndroid();
    setAndroidLogs([]);
    toast.success('Logs limpos');
  };

  // Exportar logs
  const handleExportLogs = () => {
    const allLogs = [
      '=== LOGS DE HOMOLOGAÇÃO PAYGO ===',
      `Data: ${new Date().toISOString()}`,
      `Versão Android: ${androidVersion || 'N/A'}`,
      `Pinpad: ${pinpadStatus?.modelo || 'N/A'}`,
      '',
      '=== TRANSAÇÕES ===',
      ...transactionLogs.map(log => 
        `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}${log.data ? '\n  ' + JSON.stringify(log.data, null, 2) : ''}`
      ),
      '',
      '=== LOGS ANDROID TEF ===',
      ...androidLogs
    ].join('\n');

    const blob = new Blob([allLogs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homologacao-paygo-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Logs exportados');
  };

  // Copiar logs
  const handleCopyLogs = () => {
    const allLogs = [
      ...transactionLogs.map(log => 
        `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}${log.data ? ' | ' + JSON.stringify(log.data) : ''}`
      ),
      ...androidLogs
    ].join('\n');

    navigator.clipboard.writeText(allLogs);
    toast.success('Logs copiados');
  };

  const getLogColor = (type: TransactionLog['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'transaction': return 'text-blue-400';
      default: return 'text-gray-300';
    }
  };

  const getAndroidLogColor = (log: string) => {
    if (log.includes('✅') || log.includes('APROVADO') || log.includes('sucesso')) return 'text-green-400';
    if (log.includes('❌') || log.includes('ERRO') || log.includes('erro')) return 'text-red-400';
    if (log.includes('⚠️') || log.includes('WARN')) return 'text-yellow-400';
    if (log.includes('[TXN]') || log.includes('[RESP]')) return 'text-blue-400';
    if (log.includes('[PINPAD]') || log.includes('[USB]')) return 'text-cyan-400';
    if (log.includes('[PAYGO]')) return 'text-orange-400';
    return 'text-gray-300';
  };

  return (
    <div className="min-h-screen bg-urbana-black text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/totem')}
            className="text-urbana-gold hover:bg-urbana-gold/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-urbana-gold">Homologação PayGo</h1>
            <p className="text-sm text-urbana-light/60">PDV para testes de integração TEF</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status indicators */}
          <Badge 
            variant="outline" 
            className={isAndroidAvailable ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}
          >
            <Smartphone className="h-3 w-3 mr-1" />
            {isAndroidAvailable ? 'TEF OK' : 'TEF OFF'}
          </Badge>
          <Badge 
            variant="outline" 
            className={isPinpadConnected ? 'border-green-500 text-green-400' : 'border-yellow-500 text-yellow-400'}
          >
            {isPinpadConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
            {isPinpadConnected ? 'Pinpad' : 'Desconectado'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column - PDV */}
        <div className="space-y-4">
          {/* Valor Display */}
          <Card className="bg-urbana-black-soft border-urbana-gold/30">
            <CardContent className="p-6">
              <p className="text-sm text-urbana-light/60 mb-2">Valor da transação</p>
              <div className="text-4xl font-bold text-urbana-gold text-center py-4">
                {formatCurrency(amount)}
              </div>
            </CardContent>
          </Card>

          {/* Método de Pagamento */}
          <Card className="bg-urbana-black-soft border-urbana-gold/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-urbana-gold">Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={selectedMethod === 'debito' ? 'default' : 'outline'}
                  onClick={() => setSelectedMethod('debito')}
                  className={selectedMethod === 'debito' 
                    ? 'bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90' 
                    : 'border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10'}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Débito
                </Button>
                <Button
                  variant={selectedMethod === 'credito' ? 'default' : 'outline'}
                  onClick={() => setSelectedMethod('credito')}
                  className={selectedMethod === 'credito' 
                    ? 'bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90' 
                    : 'border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10'}
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Crédito
                </Button>
                <Button
                  variant={selectedMethod === 'pix' ? 'default' : 'outline'}
                  onClick={() => setSelectedMethod('pix')}
                  className={selectedMethod === 'pix' 
                    ? 'bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90' 
                    : 'border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10'}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  PIX
                </Button>
              </div>

              {/* Parcelas - apenas para crédito */}
              {selectedMethod === 'credito' && (
                <div className="mt-3">
                  <p className="text-xs text-urbana-light/60 mb-2">Parcelas</p>
                  <div className="grid grid-cols-6 gap-1">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <Button
                        key={n}
                        size="sm"
                        variant={installments === n ? 'default' : 'outline'}
                        onClick={() => setInstallments(n)}
                        className={installments === n 
                          ? 'bg-urbana-gold text-urbana-black text-xs' 
                          : 'border-urbana-gold/30 text-urbana-gold text-xs hover:bg-urbana-gold/10'}
                      >
                        {n}x
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-6 gap-1 mt-1">
                    {[7, 8, 9, 10, 11, 12].map((n) => (
                      <Button
                        key={n}
                        size="sm"
                        variant={installments === n ? 'default' : 'outline'}
                        onClick={() => setInstallments(n)}
                        className={installments === n 
                          ? 'bg-urbana-gold text-urbana-black text-xs' 
                          : 'border-urbana-gold/30 text-urbana-gold text-xs hover:bg-urbana-gold/10'}
                      >
                        {n}x
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teclado Numérico */}
          <Card className="bg-urbana-black-soft border-urbana-gold/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <Button
                    key={num}
                    size="lg"
                    variant="outline"
                    onClick={() => handleNumberClick(num)}
                    disabled={isProcessing}
                    className="h-14 text-xl border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10"
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="h-14 border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <X className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleNumberClick('0')}
                  disabled={isProcessing}
                  className="h-14 text-xl border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10"
                >
                  0
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleBackspace}
                  disabled={isProcessing}
                  className="h-14 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                >
                  <Delete className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Botão de Pagamento */}
          <Button
            size="lg"
            onClick={handleStartTransaction}
            disabled={isProcessing || !amount || !isAndroidAvailable || !isPinpadConnected}
            className="w-full h-16 text-xl bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <DollarSign className="h-6 w-6 mr-2" />
                PAGAR {formatCurrency(amount)}
              </>
            )}
          </Button>

          {/* Confirmação Pendente */}
          {pendingConfirmation && (
            <Card className="bg-yellow-500/10 border-yellow-500/50">
              <CardContent className="p-4">
                <p className="text-yellow-400 font-medium mb-2">⚠️ Transação aguardando confirmação</p>
                <p className="text-sm text-yellow-300/70 mb-3">
                  NSU: {pendingConfirmation.nsu} | Auth: {pendingConfirmation.autorizacao}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleConfirmTransaction}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirmar
                  </Button>
                  <Button
                    onClick={handleUndoTransaction}
                    variant="outline"
                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Desfazer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aviso se não conectado */}
          {(!isAndroidAvailable || !isPinpadConnected) && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-400">
                {!isAndroidAvailable 
                  ? '⚠️ TEF Android não detectado. Execute no dispositivo Android.'
                  : '⚠️ Pinpad não conectado. Verifique a conexão USB.'}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Logs */}
        <div className="space-y-4">
          {/* Controles de Log */}
          <Card className="bg-urbana-black-soft border-urbana-gold/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-urbana-gold">Logs de Transação</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={autoRefreshLogs ? 'border-green-500 text-green-400 animate-pulse' : 'border-gray-500 text-gray-400'}
                    onClick={() => setAutoRefreshLogs(!autoRefreshLogs)}
                    style={{ cursor: 'pointer' }}
                  >
                    {autoRefreshLogs ? 'AO VIVO' : 'PAUSADO'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLogs}
                  className="border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportLogs}
                  className="border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearLogs}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    verificarConexao();
                    refreshAndroidLogs();
                  }}
                  className="border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Atualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs de Transação */}
          <Card className="bg-urbana-black-soft border-urbana-gold/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-urbana-light/60">Transações ({transactionLogs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-40 rounded border border-urbana-gold/10 bg-urbana-black p-2">
                {transactionLogs.length === 0 ? (
                  <p className="text-sm text-urbana-light/40 text-center py-4">
                    Nenhuma transação registrada
                  </p>
                ) : (
                  <div className="space-y-1 font-mono text-xs">
                    {transactionLogs.map((log, i) => (
                      <div key={i} className={getLogColor(log.type)}>
                        <span className="text-urbana-light/40">[{log.timestamp.split('T')[1].slice(0, 8)}]</span>{' '}
                        {log.message}
                        {log.data && (
                          <div className="ml-4 text-urbana-light/50 text-[10px]">
                            {JSON.stringify(log.data)}
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Logs Android TEF */}
          <Card className="bg-urbana-black-soft border-urbana-gold/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-urbana-light/60">Logs Android TEF ({androidLogs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 rounded border border-urbana-gold/10 bg-urbana-black p-2">
                {androidLogs.length === 0 ? (
                  <p className="text-sm text-urbana-light/40 text-center py-4">
                    {isAndroidAvailable 
                      ? 'Nenhum log disponível' 
                      : 'TEF Android não detectado'}
                  </p>
                ) : (
                  <div className="space-y-0.5 font-mono text-[10px]">
                    {androidLogs.map((log, i) => (
                      <div key={i} className={getAndroidLogColor(log)}>
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Info Técnica */}
          <Card className="bg-urbana-black-soft border-urbana-gold/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-urbana-light/60">Informações Técnicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-urbana-black/50 rounded">
                  <p className="text-urbana-light/50">App Version</p>
                  <p className="text-urbana-light font-mono">{androidVersion || 'N/A'}</p>
                </div>
                <div className="p-2 bg-urbana-black/50 rounded">
                  <p className="text-urbana-light/50">Pinpad</p>
                  <p className="text-urbana-light font-mono">{pinpadStatus?.modelo || 'N/A'}</p>
                </div>
                <div className="p-2 bg-urbana-black/50 rounded">
                  <p className="text-urbana-light/50">window.TEF</p>
                  <p className="text-urbana-light font-mono">{isAndroidAvailable ? 'OK' : 'null'}</p>
                </div>
                <div className="p-2 bg-urbana-black/50 rounded">
                  <p className="text-urbana-light/50">Conexão</p>
                  <p className="text-urbana-light font-mono">{isPinpadConnected ? 'Conectado' : 'Offline'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
