/**
 * PDV TEF Homologação V3
 * 
 * 100% BASEADO NA DOCUMENTAÇÃO OFICIAL PayGo:
 * https://github.com/adminti2/mobile-integracao-uri
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Smartphone, Wifi, WifiOff, CheckCircle, XCircle, AlertTriangle, 
         Clock, Trash2, Send, RefreshCw, Loader2, Menu, CreditCard, Banknote, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { isAndroidTEFAvailable } from '@/lib/tef/tefAndroidBridge';

// ============================================================================
// TIPOS
// ============================================================================

interface PayGoTransactionResponse {
  operation: string;
  transactionResult: number;
  requiresConfirmation: boolean;
  confirmationTransactionId?: string;
  amount?: number;
  transactionNsu?: string;
  terminalNsu?: string;
  authorizationCode?: string;
  merchantId?: string;
  providerName?: string;
  cardName?: string;
  resultMessage?: string;
  pendingTransactionExists?: boolean;
  merchantReceipt?: string;
  cardholderReceipt?: string;
}

interface PendingTransactionData {
  providerName: string;
  merchantId: string;
  localNsu: string;
  transactionNsu: string;
  hostNsu: string;
  timestamp?: number;
}

interface LogEntry {
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning' | 'debug';
  message: string;
  data?: unknown;
}

type PDVStatus = 'idle' | 'processing' | 'awaiting_confirmation' | 'pending_detected' | 'success' | 'error';
type PaymentMethod = 'credit' | 'debit' | 'pix';

// ============================================================================
// CONSTANTES
// ============================================================================

const STATUS_CONFIRMACAO = {
  CONFIRMADO_AUTOMATICO: 'CONFIRMADO_AUTOMATICO',
  CONFIRMADO_MANUAL: 'CONFIRMADO_MANUAL',
  DESFEITO_MANUAL: 'DESFEITO_MANUAL'
} as const;

const PARCELAS_OPCOES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const PASSOS_HOMOLOGACAO = {
  PASSO_33: { valor: 100560, descricao: 'Venda R$ 1.005,60 + CONFIRMAR' },
  PASSO_34: { valor: 100561, descricao: 'Venda R$ 1.005,61 + DESFAZER' }
};

// ============================================================================
// ESTILOS SEM EFEITOS
// ============================================================================

const btnBase = "transition-none active:opacity-100 hover:opacity-100 focus:ring-0 focus:outline-none select-none touch-manipulation";
const btnPrimary = `${btnBase} bg-green-600 text-white border-0`;
const btnSecondary = `${btnBase} bg-gray-700 text-white border border-gray-600`;
const btnOutline = `${btnBase} bg-transparent border border-gray-500 text-gray-300`;
const btnDanger = `${btnBase} bg-red-600 text-white border-0`;
const btnWarning = `${btnBase} bg-yellow-600 text-black border-0`;

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function TotemTEFHomologacaoV3() {
  const navigate = useNavigate();
  
  // Estado principal
  const [status, setStatus] = useState<PDVStatus>('idle');
  const [valorCentavos, setValorCentavos] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isPinpadConnected, setIsPinpadConnected] = useState(false);
  
  // Método de pagamento e parcelas
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit');
  const [parcelas, setParcelas] = useState<number>(1);
  
  // Dados da transação atual
  const [lastTransaction, setLastTransaction] = useState<PayGoTransactionResponse | null>(null);
  const [pendingData, setPendingData] = useState<PendingTransactionData | null>(null);
  
  // Refs
  const processingRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // ============================================================================
  // FUNÇÕES DE LOG
  // ============================================================================
  
  const addLog = useCallback((type: LogEntry['type'], message: string, data?: unknown) => {
    const entry: LogEntry = { timestamp: new Date(), type, message, data };
    setLogs(prev => [...prev.slice(-99), entry]);
    console.log(`[PDV-V3] [${type.toUpperCase()}] ${message}`, data || '');
  }, []);
  
  const clearLogs = useCallback(() => {
    setLogs([]);
    addLog('info', 'Logs limpos');
  }, [addLog]);
  
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);
  
  // ============================================================================
  // INICIALIZAÇÃO
  // ============================================================================
  
  useEffect(() => {
    addLog('info', '═══════════════════════════════════════');
    addLog('info', 'PDV TEF Homologação V3 Iniciado');
    addLog('info', '═══════════════════════════════════════');
    
    const androidAvailable = isAndroidTEFAvailable();
    setIsAndroid(androidAvailable);
    
    if (androidAvailable) {
      addLog('success', '✅ Android TEF disponível');
      checkPinpad();
      checkForPendingTransaction();
      setupGlobalResultHandler();
    } else {
      addLog('warning', '⚠️ Modo simulação (sem Android)');
    }
    
    loadSavedPendingData();
  }, []);
  
  // ============================================================================
  // VERIFICAÇÕES
  // ============================================================================
  
  const checkPinpad = useCallback(() => {
    if (!window.TEF?.verificarPinpad) return;
    try {
      const status = window.TEF.verificarPinpad();
      const parsed = JSON.parse(status);
      setIsPinpadConnected(parsed.conectado === true);
      addLog(parsed.conectado ? 'success' : 'warning', 
        parsed.conectado ? '✅ Pinpad OK' : '⚠️ Pinpad desconectado', parsed);
    } catch (e) {
      addLog('error', 'Erro pinpad', e);
    }
  }, [addLog]);
  
  const setupGlobalResultHandler = useCallback(() => {
    window.onTefResultado = (resultado: any) => {
      addLog('info', '📥 RESPOSTA PAYGO:', resultado);
      handleTransactionResponse(resultado);
    };
  }, [addLog]);
  
  // ============================================================================
  // PROCESSAR RESPOSTA
  // ============================================================================
  
  const handleTransactionResponse = useCallback((raw: any) => {
    processingRef.current = false;
    
    const response: PayGoTransactionResponse = {
      operation: raw.operation || 'VENDA',
      transactionResult: parseInt(raw.transactionResult || raw.codigoResposta || '-99', 10),
      requiresConfirmation: raw.requiresConfirmation === true || raw.requiresConfirmation === 'true',
      confirmationTransactionId: raw.confirmationTransactionId || '',
      amount: raw.amount || raw.valor,
      transactionNsu: raw.transactionNsu || raw.nsu || '',
      terminalNsu: raw.terminalNsu || raw.localNsu || '',
      authorizationCode: raw.authorizationCode || raw.autorizacao || '',
      merchantId: raw.merchantId || '',
      providerName: raw.providerName || '',
      cardName: raw.cardName || raw.bandeira || '',
      resultMessage: raw.resultMessage || raw.mensagem || '',
      pendingTransactionExists: raw.pendingTransactionExists === true || raw.pendingTransactionExists === 'true',
      merchantReceipt: raw.merchantReceipt || raw.comprovanteLojista || '',
      cardholderReceipt: raw.cardholderReceipt || raw.comprovanteCliente || ''
    };
    
    setLastTransaction(response);
    addLog('info', `Resultado: ${response.transactionResult} - ${response.resultMessage}`);
    
    // Pendência detectada
    if (response.pendingTransactionExists) {
      addLog('warning', '⚠️ PENDÊNCIA DETECTADA');
      const pendingInfo: PendingTransactionData = {
        providerName: response.providerName || raw.providerName || 'DEMO',
        merchantId: response.merchantId || raw.merchantId || '',
        localNsu: response.terminalNsu || raw.terminalNsu || raw.localNsu || '',
        transactionNsu: response.transactionNsu || raw.transactionNsu || '',
        hostNsu: raw.hostNsu || response.transactionNsu || '',
        timestamp: Date.now()
      };
      if (!pendingInfo.transactionNsu) pendingInfo.transactionNsu = pendingInfo.localNsu;
      if (!pendingInfo.hostNsu) pendingInfo.hostNsu = pendingInfo.transactionNsu;
      setPendingData(pendingInfo);
      savePendingDataToStorage(pendingInfo);
      setStatus('pending_detected');
      return;
    }
    
    // Aprovado
    if (response.transactionResult === 0) {
      addLog('success', '✅ APROVADA');
      if (response.requiresConfirmation && response.confirmationTransactionId) {
        addLog('info', `Aguardando confirmação: ${response.confirmationTransactionId}`);
        setStatus('awaiting_confirmation');
      } else {
        setStatus('success');
      }
      return;
    }
    
    // Erro -2599
    if (response.transactionResult === -2599) {
      addLog('error', '❌ ERRO -2599: Pendência não resolvida');
      const pendingFromError: PendingTransactionData = {
        providerName: raw.providerName || 'DEMO',
        merchantId: raw.merchantId || '',
        localNsu: raw.localNsu || raw.terminalNsu || '',
        transactionNsu: raw.transactionNsu || raw.localNsu || '',
        hostNsu: raw.hostNsu || raw.transactionNsu || raw.localNsu || '',
        timestamp: Date.now()
      };
      if (!pendingFromError.transactionNsu) pendingFromError.transactionNsu = pendingFromError.localNsu;
      if (!pendingFromError.hostNsu) pendingFromError.hostNsu = pendingFromError.transactionNsu;
      setPendingData(pendingFromError);
      savePendingDataToStorage(pendingFromError);
      setStatus('pending_detected');
      return;
    }
    
    addLog('error', `❌ Negada: ${response.transactionResult}`);
    setStatus('error');
  }, [addLog]);
  
  // ============================================================================
  // PENDÊNCIA
  // ============================================================================
  
  const checkForPendingTransaction = useCallback(() => {
    if (!window.TEF?.hasPendingTransaction) return;
    try {
      const hasPending = window.TEF.hasPendingTransaction();
      if (hasPending && window.TEF.getPendingTransactionInfo) {
        const info = window.TEF.getPendingTransactionInfo();
        const parsed = JSON.parse(info);
        addLog('warning', '⚠️ Pendência no APK', parsed);
        const pendingInfo: PendingTransactionData = {
          providerName: parsed.providerName || 'DEMO',
          merchantId: parsed.merchantId || '',
          localNsu: parsed.localNsu || '',
          transactionNsu: parsed.transactionNsu || parsed.localNsu || '',
          hostNsu: parsed.hostNsu || parsed.transactionNsu || parsed.localNsu || '',
          timestamp: Date.now()
        };
        setPendingData(pendingInfo);
        setStatus('pending_detected');
      }
    } catch (e) {
      addLog('debug', 'Erro ao verificar pendência', e);
    }
  }, [addLog]);
  
  const savePendingDataToStorage = (data: PendingTransactionData) => {
    localStorage.setItem('tef_pending_v3', JSON.stringify(data));
  };
  
  const loadSavedPendingData = () => {
    try {
      const saved = localStorage.getItem('tef_pending_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timestamp && (Date.now() - parsed.timestamp) < 30 * 60 * 1000) {
          addLog('info', '📦 Pendência salva encontrada', parsed);
          setPendingData(parsed);
          setStatus('pending_detected');
        } else {
          localStorage.removeItem('tef_pending_v3');
        }
      }
    } catch (e) {}
  };
  
  const clearPendingData = () => {
    localStorage.removeItem('tef_pending_v3');
    setPendingData(null);
    setStatus('idle');
    addLog('info', '🗑️ Pendência limpa');
  };
  
  // ============================================================================
  // INICIAR VENDA
  // ============================================================================
  
  const iniciarVenda = useCallback((valorEmCentavos: number) => {
    if (processingRef.current) {
      addLog('warning', 'Já processando');
      return;
    }
    
    if (status === 'pending_detected') {
      addLog('error', '❌ Resolva a pendência primeiro');
      return;
    }
    
    processingRef.current = true;
    setStatus('processing');
    setLastTransaction(null);
    
    const transactionId = `TXN_${Date.now()}`;
    
    addLog('info', '═══════════════════════════════════════');
    addLog('info', `💳 VENDA: R$ ${(valorEmCentavos / 100).toFixed(2)}`);
    addLog('info', `Método: ${paymentMethod.toUpperCase()} | Parcelas: ${parcelas}`);
    addLog('info', '═══════════════════════════════════════');
    
    if (!isAndroid) {
      addLog('warning', 'Modo simulação');
      setTimeout(() => {
        handleTransactionResponse({
          operation: 'VENDA',
          transactionResult: 0,
          requiresConfirmation: true,
          confirmationTransactionId: `SIM_${Date.now()}`,
          amount: valorEmCentavos,
          transactionNsu: '123456',
          terminalNsu: '654321',
          authorizationCode: '999999',
          merchantId: '12345',
          providerName: 'SIMULATED',
          pendingTransactionExists: false
        });
      }, 2000);
      return;
    }
    
    if (window.TEF?.iniciarPagamento) {
      const params = {
        ordemId: transactionId,
        valorCentavos: valorEmCentavos,
        metodo: paymentMethod,
        parcelas: paymentMethod === 'credit' ? parcelas : 1
      };
      addLog('debug', 'Params:', params);
      window.TEF.iniciarPagamento(JSON.stringify(params));
    } else {
      addLog('error', '❌ TEF.iniciarPagamento indisponível');
      processingRef.current = false;
      setStatus('error');
    }
  }, [isAndroid, status, paymentMethod, parcelas, addLog, handleTransactionResponse]);
  
  // ============================================================================
  // CONFIRMAÇÃO (Passo 33)
  // ============================================================================
  
  const confirmarTransacao = useCallback(() => {
    if (!lastTransaction?.confirmationTransactionId) {
      addLog('error', '❌ Sem ID de confirmação');
      return;
    }
    
    const confirmId = lastTransaction.confirmationTransactionId;
    addLog('info', `✅ CONFIRMANDO: ${confirmId}`);
    
    if (!isAndroid) {
      addLog('success', '✅ [SIM] Confirmado');
      setStatus('success');
      return;
    }
    
    if (window.TEF?.confirmarTransacao) {
      window.TEF.confirmarTransacao(confirmId, STATUS_CONFIRMACAO.CONFIRMADO_MANUAL);
      addLog('success', '✅ Confirmação enviada');
      setStatus('success');
    } else {
      addLog('error', '❌ confirmarTransacao indisponível');
    }
  }, [lastTransaction, isAndroid, addLog]);
  
  // ============================================================================
  // RESOLUÇÃO DE PENDÊNCIA (Passo 34)
  // ============================================================================
  
  const resolverPendencia = useCallback((acao: 'confirmar' | 'desfazer') => {
    if (!pendingData) {
      addLog('error', '❌ Sem dados de pendência');
      return;
    }
    
    const statusResolucao = acao === 'confirmar' 
      ? STATUS_CONFIRMACAO.CONFIRMADO_MANUAL 
      : STATUS_CONFIRMACAO.DESFEITO_MANUAL;
    
    const uriPendencia = `app://resolve/pendingTransaction?` +
      `merchantId=${encodeURIComponent(pendingData.merchantId)}` +
      `&providerName=${encodeURIComponent(pendingData.providerName)}` +
      `&hostNsu=${encodeURIComponent(pendingData.hostNsu)}` +
      `&localNsu=${encodeURIComponent(pendingData.localNsu)}` +
      `&transactionNsu=${encodeURIComponent(pendingData.transactionNsu)}`;
    
    const uriConfirmacao = `app://resolve/confirmation?transactionStatus=${statusResolucao}`;
    
    // =========================================================================
    // LOG DETALHADO PARA SUPORTE PAYGO - EXATAMENTE O QUE ESTÁ SENDO ENVIADO
    // =========================================================================
    addLog('info', '══════════════════════════════════════════════════════════════════');
    addLog('info', '📤 ENVIANDO RESOLUÇÃO DE PENDÊNCIA AO SDK PAYGO');
    addLog('info', '══════════════════════════════════════════════════════════════════');
    addLog('info', `⏰ Timestamp: ${new Date().toISOString()}`);
    addLog('info', `📋 Ação Solicitada: ${acao.toUpperCase()}`);
    addLog('info', '');
    addLog('info', '🔹 BROADCAST ACTION:');
    addLog('info', '   br.com.setis.confirmation.TRANSACTION');
    addLog('info', '');
    addLog('info', '🔹 EXTRA "uri" (dados da transação):');
    addLog('info', `   ${uriPendencia}`);
    addLog('info', '');
    addLog('info', '🔹 EXTRA "Confirmacao" (status resolução):');
    addLog('info', `   ${uriConfirmacao}`);
    addLog('info', '');
    addLog('info', '🔹 PARÂMETROS INDIVIDUAIS:');
    addLog('info', `   merchantId: ${pendingData.merchantId}`);
    addLog('info', `   providerName: ${pendingData.providerName}`);
    addLog('info', `   hostNsu: ${pendingData.hostNsu}`);
    addLog('info', `   localNsu: ${pendingData.localNsu}`);
    addLog('info', `   transactionNsu: ${pendingData.transactionNsu}`);
    addLog('info', `   transactionStatus: ${statusResolucao}`);
    addLog('info', '══════════════════════════════════════════════════════════════════');
    
    if (!isAndroid) {
      addLog('success', `✅ [SIMULAÇÃO] ${acao === 'confirmar' ? 'Confirmado' : 'Desfeito'}`);
      clearPendingData();
      return;
    }
    
    if (typeof (window.TEF as any)?.resolverPendenciaComDados === 'function') {
      const pendingDataJson = JSON.stringify({
        ...pendingData,
        uriPendencia,
        uriConfirmacao,
        transactionStatus: statusResolucao,
      });
      
      addLog('info', '');
      addLog('info', '🔹 JSON ENVIADO AO APK (resolverPendenciaComDados):');
      addLog('info', pendingDataJson);
      addLog('info', '');
      
      (window.TEF as any).resolverPendenciaComDados(pendingDataJson, statusResolucao);
      
      addLog('success', '✅ sendBroadcast() executado pelo APK');
      addLog('warning', '');
      addLog('warning', '⚠️ IMPORTANTE PARA SUPORTE PAYGO:');
      addLog('warning', '   O SDK PayGo NÃO retorna resposta para broadcasts de resolução.');
      addLog('warning', '   O broadcast foi enviado conforme documentação PayGo URI/Intent.');
      addLog('warning', '   Qualquer resposta abaixo é do APK local, NÃO do SDK PayGo.');
      addLog('warning', '');
    } else if (window.TEF?.resolvePendingTransaction) {
      addLog('info', `🔹 Método alternativo: resolvePendingTransaction("${acao === 'confirmar' ? 'CONFIRMAR' : 'DESFAZER'}")`);
      window.TEF.resolvePendingTransaction(acao === 'confirmar' ? 'CONFIRMAR' : 'DESFAZER');
      addLog('success', '✅ Resolução enviada (resolvePendingTransaction)');
    } else if (window.TEF?.resolverPendencia) {
      addLog('info', `🔹 Método alternativo: resolverPendencia("${statusResolucao}")`);
      window.TEF.resolverPendencia(statusResolucao);
      addLog('success', '✅ Resolução enviada (resolverPendencia)');
    } else {
      addLog('error', '❌ Nenhum método de resolução disponível no APK');
      return;
    }

    // Validar se a pendência realmente saiu do SDK
    addLog('info', '');
    addLog('info', '⏳ Aguardando 1.5s para verificar se SDK removeu pendência...');

    setTimeout(() => {
      try {
        if (window.TEF?.hasPendingTransaction) {
          const stillPending = window.TEF.hasPendingTransaction();
          addLog('info', '');
          addLog('info', '══════════════════════════════════════════════════════════════════');
          addLog('info', '📥 VERIFICAÇÃO PÓS-RESOLUÇÃO');
          addLog('info', '══════════════════════════════════════════════════════════════════');
          addLog('info', `⏰ Timestamp: ${new Date().toISOString()}`);
          addLog('info', `🔹 hasPendingTransaction(): ${stillPending}`);
          addLog(stillPending ? 'error' : 'success',
            stillPending
              ? '❌ RESULTADO: Pendência AINDA existe no SDK PayGo'
              : '✅ RESULTADO: Pendência removida do SDK PayGo');
          addLog('info', '══════════════════════════════════════════════════════════════════');

          if (!stillPending) {
            if (typeof (window.TEF as any)?.limparPendingData === 'function') {
              (window.TEF as any).limparPendingData();
            }
            clearPendingData();
          }
          return;
        }
      } catch (e) {
        addLog('debug', 'Erro ao validar pendência no APK', e);
      }

      clearPendingData();
    }, 1500);
  }, [pendingData, isAndroid, addLog, clearPendingData]);
  
  const abrirMenuAdministrativo = useCallback(() => {
    addLog('info', '📋 Abrindo menu PayGo');
    if (window.TEF?.iniciarAdministrativa) {
      window.TEF.iniciarAdministrativa();
    }
  }, [addLog]);
  
  // ============================================================================
  // TECLADO NUMÉRICO
  // ============================================================================
  
  const handleDigit = (digit: string) => {
    if (valorCentavos.length < 8) {
      setValorCentavos(prev => prev + digit);
    }
  };
  
  const handleClear = () => setValorCentavos('');
  const handleBackspace = () => setValorCentavos(prev => prev.slice(0, -1));
  
  const handleConfirm = () => {
    const valor = parseInt(valorCentavos || '0', 10);
    if (valor > 0) {
      iniciarVenda(valor);
    }
  };
  
  const formatarValor = (centavos: string) => {
    const valor = parseInt(centavos || '0', 10);
    return `R$ ${(valor / 100).toFixed(2)}`;
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-2 md:p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <Button 
            className={`${btnOutline} p-2`}
            onPointerDown={() => navigate('/totem')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-base md:text-lg font-bold">PDV TEF V3</h1>
            <p className="text-[10px] md:text-xs text-gray-400">PayGo Homologação</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2">
          {status === 'processing' && (
            <Badge className="bg-blue-600 text-white text-xs">Processando...</Badge>
          )}
          {status === 'pending_detected' && (
            <Badge className="bg-red-600 text-white text-xs">PENDÊNCIA</Badge>
          )}
          {status === 'success' && (
            <Badge className="bg-green-600 text-white text-xs">✅ OK</Badge>
          )}
          {isAndroid ? (
            <Smartphone className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
          ) : (
            <span className="text-[10px] text-yellow-400">SIM</span>
          )}
          {isPinpadConnected ? (
            <Wifi className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Panel - Controles */}
        <div className="flex-1 md:w-1/2 p-2 md:p-4 flex flex-col gap-3 overflow-y-auto">
          
          {/* Alerta de Pendência */}
          {status === 'pending_detected' && pendingData && (
            <Card className="bg-red-900/50 border-red-500">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-red-400 flex items-center gap-2 text-sm md:text-base">
                  <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
                  PENDÊNCIA DETECTADA
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                <div className="text-[10px] md:text-xs text-gray-300 font-mono bg-black/30 p-2 rounded">
                  <p>Provider: {pendingData.providerName}</p>
                  <p>Merchant: {pendingData.merchantId}</p>
                  <p>NSU: {pendingData.transactionNsu}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    className={`${btnPrimary} h-10 md:h-12 text-xs md:text-sm`}
                    onPointerDown={() => resolverPendencia('confirmar')}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    CONFIRMAR
                  </Button>
                  <Button 
                    className={`${btnDanger} h-10 md:h-12 text-xs md:text-sm`}
                    onPointerDown={() => resolverPendencia('desfazer')}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    DESFAZER
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className={`${btnWarning} flex-1 h-8 text-xs`}
                    onPointerDown={abrirMenuAdministrativo}
                  >
                    <Menu className="w-3 h-3 mr-1" />
                    Menu PayGo
                  </Button>
                  <Button 
                    className={`${btnOutline} flex-1 h-8 text-xs`}
                    onPointerDown={clearPendingData}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Painel de Confirmação (Passo 33) */}
          {status === 'awaiting_confirmation' && lastTransaction && (
            <Card className="bg-yellow-900/50 border-yellow-500">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-yellow-400 flex items-center gap-2 text-sm md:text-base">
                  <Clock className="w-4 h-4 md:w-5 md:h-5" />
                  AGUARDANDO CONFIRMAÇÃO
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                <div className="text-[10px] md:text-xs text-gray-300 font-mono bg-black/30 p-2 rounded">
                  <p>ID: {lastTransaction.confirmationTransactionId}</p>
                  <p>Valor: R$ {((lastTransaction.amount || 0) / 100).toFixed(2)}</p>
                  <p>NSU: {lastTransaction.transactionNsu}</p>
                </div>
                
                <Button 
                  className={`${btnPrimary} w-full h-12 text-sm md:text-base`}
                  onPointerDown={confirmarTransacao}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  CONFIRMAR TRANSAÇÃO
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Sucesso */}
          {status === 'success' && (
            <Card className="bg-green-900/50 border-green-500">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-green-400 mx-auto mb-3" />
                <p className="text-green-400 text-lg md:text-xl font-bold">TRANSAÇÃO CONCLUÍDA</p>
                <Button 
                  className={`${btnSecondary} mt-4`}
                  onPointerDown={() => setStatus('idle')}
                >
                  Nova Transação
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Processing */}
          {status === 'processing' && (
            <Card className="bg-blue-900/50 border-blue-500">
              <CardContent className="p-6 text-center">
                <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-blue-400 mx-auto mb-3 animate-spin" />
                <p className="text-blue-400 text-lg md:text-xl font-bold">PROCESSANDO...</p>
                <p className="text-gray-400 text-sm mt-2">Aguarde a resposta do pinpad</p>
              </CardContent>
            </Card>
          )}
          
          {/* Teclado e Método de Pagamento */}
          {!['pending_detected', 'processing', 'awaiting_confirmation', 'success'].includes(status) && (
            <>
              {/* Método de Pagamento */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-white text-sm md:text-base">Método de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      className={`h-12 md:h-14 flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === 'credit' 
                          ? 'bg-blue-600 text-white border-blue-400' 
                          : 'bg-gray-700 text-gray-300 border-gray-600'
                      } ${btnBase} border`}
                      onPointerDown={() => setPaymentMethod('credit')}
                    >
                      <CreditCard className="w-5 h-5 md:w-6 md:h-6" />
                      <span className="text-[10px] md:text-xs">CRÉDITO</span>
                    </Button>
                    <Button 
                      className={`h-12 md:h-14 flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === 'debit' 
                          ? 'bg-green-600 text-white border-green-400' 
                          : 'bg-gray-700 text-gray-300 border-gray-600'
                      } ${btnBase} border`}
                      onPointerDown={() => setPaymentMethod('debit')}
                    >
                      <Banknote className="w-5 h-5 md:w-6 md:h-6" />
                      <span className="text-[10px] md:text-xs">DÉBITO</span>
                    </Button>
                    <Button 
                      className={`h-12 md:h-14 flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === 'pix' 
                          ? 'bg-teal-600 text-white border-teal-400' 
                          : 'bg-gray-700 text-gray-300 border-gray-600'
                      } ${btnBase} border`}
                      onPointerDown={() => setPaymentMethod('pix')}
                    >
                      <QrCode className="w-5 h-5 md:w-6 md:h-6" />
                      <span className="text-[10px] md:text-xs">PIX</span>
                    </Button>
                  </div>
                  
                  {/* Parcelas - só para crédito */}
                  {paymentMethod === 'credit' && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Parcelas:</p>
                      <div className="grid grid-cols-6 gap-1">
                        {PARCELAS_OPCOES.map(p => (
                          <Button 
                            key={p}
                            className={`h-8 md:h-10 text-xs md:text-sm ${
                              parcelas === p 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-700 text-gray-300'
                            } ${btnBase}`}
                            onPointerDown={() => setParcelas(p)}
                          >
                            {p}x
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Valor e Teclado */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-white text-sm md:text-base">Valor da Venda</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-3xl md:text-4xl font-bold text-center py-4 bg-black/50 rounded-lg mb-3 border border-yellow-600/50">
                    <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">
                      {formatarValor(valorCentavos)}
                    </span>
                  </div>
                  
                  {/* Atalhos */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Button 
                      className={`${btnOutline} text-yellow-400 border-yellow-500 text-[10px] md:text-xs h-8`}
                      onPointerDown={() => setValorCentavos(PASSOS_HOMOLOGACAO.PASSO_33.valor.toString())}
                    >
                      Passo 33 (R$ 1.005,60)
                    </Button>
                    <Button 
                      className={`${btnOutline} text-orange-400 border-orange-500 text-[10px] md:text-xs h-8`}
                      onPointerDown={() => setValorCentavos(PASSOS_HOMOLOGACAO.PASSO_34.valor.toString())}
                    >
                      Passo 34 (R$ 1.005,61)
                    </Button>
                  </div>
                  
                  {/* Teclado */}
                  <div className="grid grid-cols-3 gap-1 md:gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                      <Button 
                        key={d} 
                        className={`${btnSecondary} h-10 md:h-12 text-lg md:text-xl`}
                        onPointerDown={() => handleDigit(d)}
                      >
                        {d}
                      </Button>
                    ))}
                    <Button 
                      className={`${btnOutline} h-10 md:h-12 text-sm`}
                      onPointerDown={handleClear}
                    >
                      C
                    </Button>
                    <Button 
                      className={`${btnSecondary} h-10 md:h-12 text-lg md:text-xl`}
                      onPointerDown={() => handleDigit('0')}
                    >
                      0
                    </Button>
                    <Button 
                      className={`${btnOutline} h-10 md:h-12 text-lg`}
                      onPointerDown={handleBackspace}
                    >
                      ←
                    </Button>
                  </div>
                  
                  <Button 
                    className={`${btnPrimary} w-full mt-3 h-12 md:h-14 text-base md:text-lg`}
                    onPointerDown={handleConfirm}
                    disabled={!valorCentavos || parseInt(valorCentavos) === 0}
                  >
                    <Send className="w-5 h-5 mr-2" />
                    INICIAR VENDA
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
          
          {/* Ações rápidas */}
          <div className="flex gap-2 flex-wrap">
            <Button className={`${btnOutline} h-8 text-xs`} onPointerDown={checkPinpad}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Pinpad
            </Button>
            <Button className={`${btnOutline} h-8 text-xs`} onPointerDown={abrirMenuAdministrativo}>
              <Menu className="w-3 h-3 mr-1" />
              Admin
            </Button>
            <Button className={`${btnOutline} h-8 text-xs`} onPointerDown={clearLogs}>
              <Trash2 className="w-3 h-3 mr-1" />
              Logs
            </Button>
          </div>
        </div>
        
        {/* Right Panel - Logs */}
        <div className="h-40 md:h-auto md:flex-1 border-t md:border-t-0 md:border-l border-gray-700 flex flex-col">
          <div className="bg-gray-800 p-2 border-b border-gray-700 flex-shrink-0">
            <h3 className="text-xs md:text-sm font-bold">📋 Logs</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] md:text-xs bg-black/50">
            {logs.map((log, i) => (
              <div 
                key={i} 
                className={`py-0.5 border-b border-gray-800 ${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'warning' ? 'text-yellow-400' :
                  log.type === 'debug' ? 'text-gray-500' :
                  'text-gray-300'
                }`}
              >
                <span className="text-gray-500">[{log.timestamp.toLocaleTimeString()}]</span>{' '}
                {log.message}
                {log.data && (
                  <pre className="text-[8px] md:text-[10px] text-gray-500 ml-2 overflow-x-auto">
                    {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
