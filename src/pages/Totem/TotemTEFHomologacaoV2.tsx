/**
 * PDV de Homologação TEF v2.0
 * 
 * Implementação 100% conforme documentação oficial PayGo:
 * https://github.com/adminti2/mobile-integracao-uri
 * 
 * Fluxo de operações:
 * 1. TRANSAÇÃO: br.com.setis.payment.TRANSACTION (startActivity)
 * 2. CONFIRMAÇÃO: br.com.setis.confirmation.TRANSACTION (sendBroadcast)
 * 3. RESOLUÇÃO DE PENDÊNCIA: 2 URIs (pendingTransaction + confirmation)
 * 
 * Passos 33 e 34:
 * - Passo 33: R$ 1.005,60 → Venda aprovada → Enviar CNF (CONFIRMADO_MANUAL)
 * - Passo 34: R$ 1.005,61 → Erro -2599 (pendência) → DESFAZER
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Trash2,
  DollarSign,
  CreditCard,
  Smartphone,
  QrCode,
  Check,
  Undo2,
  Play,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import {
  isAndroidTEFAvailable,
  getLogsAndroid,
  limparLogsAndroid,
  confirmarTransacaoTEF,
  resolverPendenciaAndroid,
  getPendingInfoAndroid,
  iniciarAdministrativaAndroid,
  type TEFResultado
} from '@/lib/tef/tefAndroidBridge';
import { toast } from 'sonner';

// ============================================================================
// TIPOS E CONSTANTES
// ============================================================================

type PaymentMethod = 'debito' | 'credito' | 'pix';
type PDVState = 
  | 'idle'           // Aguardando input
  | 'processing'     // Transação em andamento
  | 'pending'        // Pendência detectada - aguarda resolução
  | 'confirming'     // Enviando confirmação
  | 'success'        // Transação finalizada com sucesso
  | 'error';         // Erro na transação

interface TransactionResult {
  status: 'aprovado' | 'negado' | 'cancelado' | 'erro';
  nsu?: string;
  autorizacao?: string;
  bandeira?: string;
  mensagem?: string;
  confirmationTransactionId?: string;
  requiresConfirmation?: boolean;
  pendingTransactionExists?: boolean;
  pendingData?: {
    providerName: string;
    merchantId: string;
    localNsu: string;
    transactionNsu: string;
    hostNsu: string;
  };
}

interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'pending';
  message: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function TotemTEFHomologacaoV2() {
  const navigate = useNavigate();
  
  // ========== ESTADO PRINCIPAL ==========
  const [pdvState, setPdvState] = useState<PDVState>('idle');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debito');
  const [installments, setInstallments] = useState(1);
  
  // ========== RESULTADO DA TRANSAÇÃO ==========
  const [lastResult, setLastResult] = useState<TransactionResult | null>(null);
  const [pendingInfo, setPendingInfo] = useState<{
    hasPending: boolean;
    confirmationId?: string;
    pendingData?: TransactionResult['pendingData'];
  } | null>(null);
  
  // ========== LOGS ==========
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // ========== ANDROID TEF ==========
  const [isAndroid, setIsAndroid] = useState(false);
  
  // Wrapper para onError que converte para o formato esperado pelo hook
  const handleTefError = useCallback((erro: string, resultadoCompleto?: TEFResultado) => {
    handlePaymentError(resultadoCompleto || { status: 'erro', mensagem: erro });
  }, []);
  
  const { iniciarPagamento, isProcessing: tefProcessing } = useTEFAndroid({
    onSuccess: handlePaymentSuccess,
    onError: handleTefError,
    onCancelled: handlePaymentCancelled
  });

  // ========== INICIALIZAÇÃO ==========
  useEffect(() => {
    const androidAvailable = isAndroidTEFAvailable();
    setIsAndroid(androidAvailable);
    addLog('info', `PDV iniciado. Android TEF: ${androidAvailable ? '✅ Disponível' : '❌ Não disponível'}`);
    
    // Verificar pendência ao iniciar
    checkPendingOnStart();
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ========== FUNÇÕES DE LOG ==========
  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      time: new Date().toLocaleTimeString('pt-BR'),
      type,
      message
    };
    setLogs(prev => [...prev.slice(-100), entry]); // Manter últimos 100 logs
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    limparLogsAndroid();
    addLog('info', 'Logs limpos');
  }, [addLog]);

  // ========== VERIFICAÇÃO DE PENDÊNCIA ==========
  const checkPendingOnStart = useCallback(async () => {
    if (!isAndroidTEFAvailable()) return;
    
    addLog('info', '🔍 Verificando pendências...');
    
    try {
      const info = await getPendingInfoAndroid();
      
      if (info?.hasPendingData || info?.lastConfirmationId) {
        addLog('pending', `⚠️ PENDÊNCIA DETECTADA!`);
        addLog('pending', `  ConfirmationId: ${info.lastConfirmationId || 'N/A'}`);
        
        setPendingInfo({
          hasPending: true,
          confirmationId: info.lastConfirmationId as string | undefined,
          pendingData: info.pendingData as TransactionResult['pendingData'] | undefined
        });
        setPdvState('pending');
      } else {
        addLog('success', '✅ Nenhuma pendência encontrada');
        setPendingInfo({ hasPending: false });
      }
    } catch (e) {
      addLog('error', `Erro ao verificar pendência: ${e}`);
    }
  }, [addLog]);

  // ========== HANDLERS DE PAGAMENTO ==========
  function handlePaymentSuccess(result: TEFResultado) {
    addLog('success', `✅ TRANSAÇÃO APROVADA!`);
    addLog('info', `  NSU: ${result.nsu || 'N/A'}`);
    addLog('info', `  Autorização: ${result.autorizacao || 'N/A'}`);
    addLog('info', `  Bandeira: ${result.bandeira || 'N/A'}`);
    
    const txResult: TransactionResult = {
      status: 'aprovado',
      nsu: result.nsu,
      autorizacao: result.autorizacao,
      bandeira: result.bandeira,
      mensagem: result.mensagem,
      confirmationTransactionId: result.confirmationTransactionId,
      requiresConfirmation: result.requiresConfirmation
    };
    
    setLastResult(txResult);
    
    // Se requer confirmação, guardar para enviar depois
    if (result.requiresConfirmation && result.confirmationTransactionId) {
      addLog('warning', `⚠️ Transação REQUER confirmação!`);
      addLog('info', `  ConfirmationId: ${result.confirmationTransactionId}`);
      setPendingInfo({
        hasPending: true,
        confirmationId: result.confirmationTransactionId
      });
      setPdvState('pending');
    } else {
      setPdvState('success');
    }
  }

  function handlePaymentError(error: TEFResultado) {
    addLog('error', `❌ ERRO NA TRANSAÇÃO`);
    addLog('error', `  Código: ${error.codigoErro || 'N/A'}`);
    addLog('error', `  Mensagem: ${error.mensagem || 'Erro desconhecido'}`);
    
    // Verificar se é erro de pendência (-2599)
    if (error.codigoErro === '-2599' || error.mensagem?.includes('pendente') || error.mensagem?.includes('pendência')) {
      addLog('pending', `⚠️ PENDÊNCIA DETECTADA (erro -2599)`);
      setPdvState('pending');
      checkPendingOnStart(); // Atualizar info de pendência
    } else {
      setLastResult({
        status: 'erro',
        mensagem: error.mensagem
      });
      setPdvState('error');
    }
  }

  function handlePaymentCancelled() {
    addLog('warning', '⚡ Transação cancelada pelo usuário');
    setLastResult({ status: 'cancelado' });
    setPdvState('idle');
  }

  // ========== EXECUTAR VENDA ==========
  const executePayment = useCallback(async () => {
    if (!amount || parseInt(amount) <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    const valorCentavos = parseInt(amount);
    const valorReais = (valorCentavos / 100).toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
    
    addLog('info', '════════════════════════════════════════');
    addLog('info', `🚀 INICIANDO VENDA`);
    addLog('info', `  Valor: ${valorReais} (${valorCentavos} centavos)`);
    addLog('info', `  Método: ${paymentMethod.toUpperCase()}`);
    if (paymentMethod === 'credito' && installments > 1) {
      addLog('info', `  Parcelas: ${installments}x`);
    }
    addLog('info', '════════════════════════════════════════');
    
    setPdvState('processing');
    setLastResult(null);
    
    if (!isAndroid) {
      // Simulação para ambiente web
      addLog('warning', '⚠️ Ambiente WEB - Simulando transação...');
      setTimeout(() => {
        // Simular aprovação
        handlePaymentSuccess({
          status: 'aprovado',
          nsu: '123456',
          autorizacao: 'ABC123',
          bandeira: 'VISA',
          mensagem: 'TRANSACAO APROVADA (SIMULADO)',
          confirmationTransactionId: 'SIMULATED-CONFIRM-ID',
          requiresConfirmation: true
        });
      }, 2000);
      return;
    }
    
    try {
      const ordemId = `HOMOLOG_${Date.now()}`;
      const tipo = paymentMethod === 'credito' ? 'credit' : paymentMethod === 'debito' ? 'debit' : 'pix';
      
      await iniciarPagamento({
        ordemId,
        valor: valorCentavos / 100, // O hook espera valor em reais
        tipo,
        parcelas: installments
      });
      
    } catch (e) {
      addLog('error', `Erro ao iniciar pagamento: ${e}`);
      setPdvState('error');
    }
  }, [amount, paymentMethod, installments, isAndroid, iniciarPagamento, addLog]);

  // ========== CONFIRMAR TRANSAÇÃO (PASSO 33) ==========
  const confirmTransaction = useCallback(async () => {
    if (!pendingInfo?.confirmationId) {
      toast.error('Nenhum confirmationId disponível');
      return;
    }
    
    addLog('info', '════════════════════════════════════════');
    addLog('info', `📤 ENVIANDO CONFIRMAÇÃO (PASSO 33)`);
    addLog('info', `  ConfirmationId: ${pendingInfo.confirmationId}`);
    addLog('info', `  Status: CONFIRMADO_MANUAL`);
    addLog('info', '════════════════════════════════════════');
    
    setPdvState('confirming');
    
    try {
      const result = await confirmarTransacaoTEF(pendingInfo.confirmationId, 'CONFIRMADO_MANUAL');
      
      addLog('success', '✅ Confirmação enviada!');
      addLog('info', `  Resposta: ${JSON.stringify(result)}`);
      
      setPendingInfo({ hasPending: false });
      setPdvState('success');
      toast.success('Transação confirmada com sucesso!');
      
    } catch (e) {
      addLog('error', `❌ Erro na confirmação: ${e}`);
      setPdvState('error');
      toast.error('Erro ao confirmar transação');
    }
  }, [pendingInfo, addLog]);

  // ========== DESFAZER TRANSAÇÃO (PASSO 34) ==========
  const undoTransaction = useCallback(async () => {
    addLog('info', '════════════════════════════════════════');
    addLog('info', `🔄 DESFAZENDO TRANSAÇÃO (PASSO 34)`);
    addLog('info', `  Status: DESFEITO_MANUAL`);
    addLog('info', '════════════════════════════════════════');
    
    setPdvState('confirming');
    
    try {
      const result = resolverPendenciaAndroid('desfazer');
      
      addLog('success', '✅ Desfazimento enviado!');
      addLog('info', `  Resultado: ${result}`);
      
      setPendingInfo({ hasPending: false });
      setPdvState('success');
      toast.success('Transação desfeita com sucesso!');
      
      // Verificar se realmente limpou
      setTimeout(() => checkPendingOnStart(), 2000);
      
    } catch (e) {
      addLog('error', `❌ Erro no desfazimento: ${e}`);
      setPdvState('error');
      toast.error('Erro ao desfazer transação');
    }
  }, [addLog, checkPendingOnStart]);

  // ========== ABRIR MENU ADMINISTRATIVO ==========
  const openAdminMenu = useCallback(async () => {
    addLog('info', '🔧 Abrindo menu administrativo PayGo...');
    try {
      await iniciarAdministrativaAndroid();
      addLog('success', 'Menu administrativo aberto');
    } catch (e) {
      addLog('error', `Erro: ${e}`);
    }
  }, [addLog]);

  // ========== NOVA TRANSAÇÃO ==========
  const resetForNewTransaction = useCallback(() => {
    setAmount('');
    setLastResult(null);
    setPdvState('idle');
    addLog('info', '🔄 Pronto para nova transação');
  }, [addLog]);

  // ========== HANDLERS DE INPUT ==========
  const handleDigit = (digit: string) => {
    if (amount.length < 10) {
      setAmount(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setAmount('');
  };

  // ========== VALORES FORMATADOS ==========
  const formattedAmount = (parseInt(amount || '0') / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  // ========== RENDER ==========
  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/totem')}
          className="text-gray-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <h1 className="text-lg font-bold">PDV Homologação TEF v2.0</h1>
        
        <Badge variant={isAndroid ? 'default' : 'secondary'}>
          {isAndroid ? '📱 Android TEF' : '🌐 Web (Simulado)'}
        </Badge>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input & Actions */}
        <div className="w-1/2 p-4 flex flex-col gap-4 border-r border-gray-700">
          
          {/* Status Banner */}
          {pdvState === 'pending' && (
            <Card className="bg-amber-900/50 border-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-amber-400" />
                  <div className="flex-1">
                    <p className="font-bold text-amber-300">⚠️ PENDÊNCIA DETECTADA</p>
                    <p className="text-sm text-amber-200/80">
                      Resolva a pendência antes de continuar
                    </p>
                    {pendingInfo?.confirmationId && (
                      <p className="text-xs text-amber-200/60 mt-1 font-mono">
                        ID: {pendingInfo.confirmationId.substring(0, 30)}...
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={confirmTransaction}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    CONFIRMAR (Passo 33)
                  </Button>
                  <Button
                    onClick={undoTransaction}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    DESFAZER (Passo 34)
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openAdminMenu}
                  className="w-full mt-2 border-amber-500 text-amber-300"
                >
                  🔧 Menu Administrativo PayGo
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Success/Error Banner */}
          {pdvState === 'success' && lastResult && (
            <Card className="bg-green-900/50 border-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="font-bold text-green-300">✅ TRANSAÇÃO FINALIZADA</p>
                    {lastResult.nsu && (
                      <p className="text-sm text-green-200/80">NSU: {lastResult.nsu}</p>
                    )}
                  </div>
                </div>
                <Button onClick={resetForNewTransaction} className="w-full">
                  Nova Transação
                </Button>
              </CardContent>
            </Card>
          )}

          {pdvState === 'error' && (
            <Card className="bg-red-900/50 border-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <XCircle className="h-8 w-8 text-red-400" />
                  <div>
                    <p className="font-bold text-red-300">❌ ERRO</p>
                    <p className="text-sm text-red-200/80">{lastResult?.mensagem || 'Erro desconhecido'}</p>
                  </div>
                </div>
                <Button onClick={resetForNewTransaction} variant="outline" className="w-full">
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Amount Display */}
          <Card className="bg-gray-800 border-gray-600">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">VALOR DA VENDA</p>
              <p className="text-4xl font-mono font-bold text-center text-amber-400">
                {formattedAmount}
              </p>
              <p className="text-xs text-gray-500 text-center mt-1">
                {amount || '0'} centavos
              </p>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={paymentMethod === 'debito' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('debito')}
              className={paymentMethod === 'debito' ? 'bg-blue-600' : ''}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Débito
            </Button>
            <Button
              variant={paymentMethod === 'credito' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('credito')}
              className={paymentMethod === 'credito' ? 'bg-purple-600' : ''}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Crédito
            </Button>
            <Button
              variant={paymentMethod === 'pix' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('pix')}
              className={paymentMethod === 'pix' ? 'bg-green-600' : ''}
            >
              <QrCode className="h-4 w-4 mr-2" />
              PIX
            </Button>
          </div>

          {/* Installments (only for credit) */}
          {paymentMethod === 'credito' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Parcelas:</span>
              <div className="flex gap-1 flex-wrap">
                {[1, 2, 3, 6, 12].map(n => (
                  <Button
                    key={n}
                    size="sm"
                    variant={installments === n ? 'default' : 'outline'}
                    onClick={() => setInstallments(n)}
                    className="w-10"
                  >
                    {n}x
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'].map(key => (
              <Button
                key={key}
                variant="outline"
                className="h-14 text-xl font-mono"
                onClick={() => {
                  if (key === '⌫') handleBackspace();
                  else handleDigit(key);
                }}
                disabled={pdvState === 'processing' || pdvState === 'confirming'}
              >
                {key}
              </Button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={pdvState === 'processing' || pdvState === 'confirming'}
              className="flex-1"
            >
              Limpar
            </Button>
            <Button
              onClick={executePayment}
              disabled={!amount || pdvState === 'processing' || pdvState === 'confirming' || pdvState === 'pending'}
              className="flex-2 bg-amber-600 hover:bg-amber-700 text-lg font-bold"
            >
              {pdvState === 'processing' ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  VENDER
                </>
              )}
            </Button>
          </div>

          {/* Quick Values for Testing */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs text-gray-400">⚡ Valores Rápidos (Homologação)</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setAmount('100560'); setPaymentMethod('debito'); }}
                  className="text-xs h-auto py-2"
                >
                  <div className="text-left">
                    <p className="font-bold text-green-400">Passo 33</p>
                    <p className="text-gray-400">R$ 1.005,60 - Confirmar</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setAmount('100561'); setPaymentMethod('debito'); }}
                  className="text-xs h-auto py-2"
                >
                  <div className="text-left">
                    <p className="font-bold text-amber-400">Passo 34</p>
                    <p className="text-gray-400">R$ 1.005,61 - Desfazer</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setAmount('5000'); setPaymentMethod('credito'); }}
                  className="text-xs"
                >
                  R$ 50,00 (Crédito)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setAmount('1'); setPaymentMethod('debito'); }}
                  className="text-xs"
                >
                  R$ 0,01 (Força Resolução)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Logs */}
        <div className="w-1/2 flex flex-col">
          <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="font-semibold">Logs em Tempo Real</span>
              <Badge variant="outline" className="text-xs">
                {logs.length} entradas
              </Badge>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={checkPendingOnStart}>
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={clearLogs}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 bg-gray-950">
            <div className="p-2 font-mono text-xs space-y-0.5">
              {logs.map(log => (
                <div
                  key={log.id}
                  className={`flex gap-2 ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    log.type === 'pending' ? 'text-amber-400' :
                    'text-gray-400'
                  }`}
                >
                  <span className="text-gray-600 shrink-0">{log.time}</span>
                  <span className="break-all">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </ScrollArea>

          {/* Documentation Card */}
          <Card className="m-2 bg-gray-800/50 border-gray-700">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs text-gray-400">📋 Roteiro PayGo - Passos 33/34</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 text-xs space-y-2">
              <div className="bg-green-900/30 border border-green-700/50 rounded p-2">
                <p className="font-bold text-green-400">✅ Passo 33 - Venda R$ 1.005,60</p>
                <ol className="text-green-300/80 list-decimal list-inside mt-1 space-y-0.5">
                  <li>Digite 100560 → Clique VENDER</li>
                  <li>Transação aprovada → Salva confirmationId</li>
                  <li>Clique "CONFIRMAR" para enviar CNF</li>
                </ol>
              </div>
              <div className="bg-amber-900/30 border border-amber-700/50 rounded p-2">
                <p className="font-bold text-amber-400">⚠️ Passo 34 - Venda R$ 1.005,61</p>
                <ol className="text-amber-300/80 list-decimal list-inside mt-1 space-y-0.5">
                  <li>Digite 100561 → Clique VENDER</li>
                  <li>PayGo retorna erro -2599 (pendência)</li>
                  <li>Clique "DESFAZER" para resolver</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
