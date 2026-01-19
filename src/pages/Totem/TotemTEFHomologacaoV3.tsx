/**
 * PDV TEF Homologação V3
 * 
 * 100% Responsivo para Tablet
 * Sem efeitos hover
 * Navegação clara
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Smartphone, Wifi, WifiOff, CheckCircle, XCircle, AlertTriangle, 
         Clock, Trash2, Send, RefreshCw, Loader2, Menu, CreditCard, Banknote, QrCode, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { isAndroidTEFAvailable } from '@/lib/tef/tefAndroidBridge';
import TEFTransactionSuccessModal from '@/components/admin/tef/TEFTransactionSuccessModal';

// ============================================================================
// TIPOS
// ============================================================================

interface PayGoTransactionResponse {
  operation: string;
  transactionResult: number;
  requiresConfirmation: boolean;
  confirmationTransactionId?: string;
  amount?: number;
  localNsu?: string;
  transactionNsu?: string;
  terminalNsu?: string;
  hostNsu?: string;
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
type ViewMode = 'pdv' | 'logs';

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
// ESTILOS SEM EFEITOS HOVER
// ============================================================================

const btnBase = "transition-none hover:opacity-100 hover:bg-inherit hover:text-inherit hover:border-inherit hover:shadow-none hover:scale-100 active:opacity-100 focus:ring-0 focus:outline-none select-none touch-manipulation cursor-default";
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
  
  // View mode - PDV ou Logs
  const [viewMode, setViewMode] = useState<ViewMode>('pdv');
  
  // Método de pagamento e parcelas
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit');
  const [parcelas, setParcelas] = useState<number>(1);
  
  // Dados da transação atual
  const [lastTransaction, setLastTransaction] = useState<PayGoTransactionResponse | null>(null);
  const [pendingData, setPendingData] = useState<PendingTransactionData | null>(null);
  
  // Modal de transação aprovada
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [approvedTransaction, setApprovedTransaction] = useState<PayGoTransactionResponse | null>(null);
  
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
    if (viewMode === 'logs') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, viewMode]);
  
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
    
    const parseResultCode = (value: unknown): number | null => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const n = Number.parseInt(trimmed, 10);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    };

    const rawMessage = (raw?.resultMessage || raw?.mensagem || '') as string;

    const codeFromPayload =
      parseResultCode(raw?.transactionResult) ??
      parseResultCode(raw?.codigoResposta) ??
      parseResultCode(raw?.codigoErro) ??
      null;

    const looksApproved =
      raw?.status === 'aprovado' ||
      raw?.requiresConfirmation === true ||
      raw?.requiresConfirmation === 'true' ||
      !!raw?.confirmationTransactionId ||
      /autorizad/i.test(rawMessage);

    const normalizedTransactionResult = codeFromPayload ?? (looksApproved ? 0 : -99);

    const response: PayGoTransactionResponse = {
      operation: raw?.operation || 'VENDA',
      transactionResult: normalizedTransactionResult,
      requiresConfirmation: raw?.requiresConfirmation === true || raw?.requiresConfirmation === 'true',
      confirmationTransactionId: raw?.confirmationTransactionId || '',
      amount: raw?.amount ?? raw?.valor,
      localNsu: raw?.localNsu || raw?.terminalNsu || '',
      transactionNsu: raw?.transactionNsu || raw?.nsu || '',
      terminalNsu: raw?.terminalNsu || raw?.localNsu || '',
      hostNsu: raw?.hostNsu || '',
      authorizationCode: raw?.authorizationCode || raw?.autorizacao || '',
      merchantId: raw?.merchantId || '',
      providerName: raw?.providerName || '',
      cardName: raw?.cardName || raw?.bandeira || '',
      resultMessage: rawMessage,
      pendingTransactionExists:
        raw?.pendingTransactionExists === true ||
        raw?.pendingTransactionExists === 'true' ||
        raw?.hasPendingData === true ||
        raw?.hasPendingTransaction === true,
      merchantReceipt: raw?.merchantReceipt || raw?.comprovanteLojista || '',
      cardholderReceipt: raw?.cardholderReceipt || raw?.comprovanteCliente || ''
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
      
      if (pendingData) {
        addLog('success', '🧹 Pendência anterior resolvida automaticamente pelo PayGo');
        localStorage.removeItem('tef_pending_v3');
        setPendingData(null);
      }
      
      setApprovedTransaction(response);
      setShowSuccessModal(true);
      
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
      setApprovedTransaction(response);
      setShowSuccessModal(true);
      setStatus('pending_detected');
      return;
    }
    
    // Transação negada/erro
    addLog('error', `❌ Não aprovada: ${response.transactionResult}`);
    setApprovedTransaction(response);
    setShowSuccessModal(true);

    try {
      const hasPendingNow = !!window.TEF?.hasPendingTransaction?.();
      if (hasPendingNow && window.TEF?.getPendingTransactionInfo) {
        const info = window.TEF.getPendingTransactionInfo();
        const parsed = JSON.parse(info);
        addLog('warning', '⚠️ Pendência detectada após retorno não-aprovado', parsed);

        const pendingInfo: PendingTransactionData = {
          providerName: parsed.providerName || raw.providerName || 'DEMO',
          merchantId: parsed.merchantId || raw.merchantId || '',
          localNsu: parsed.localNsu || raw.localNsu || raw.terminalNsu || '',
          transactionNsu:
            parsed.transactionNsu || raw.transactionNsu || parsed.localNsu || raw.localNsu || '',
          hostNsu:
            parsed.hostNsu || raw.hostNsu || parsed.transactionNsu || raw.transactionNsu || parsed.localNsu || raw.localNsu || '',
          timestamp: Date.now(),
        };

        setPendingData(pendingInfo);
        savePendingDataToStorage(pendingInfo);
        setStatus('pending_detected');
        return;
      }

      if (/pendent/i.test(response.resultMessage || '') || response.transactionResult === -2599) {
        addLog('warning', '⚠️ Mensagem/código indica pendência; painel de resolução ativado.');
        setStatus('pending_detected');
        return;
      }
    } catch (e) {
      addLog('debug', 'Erro ao checar pendência após não-aprovação', e);
    }

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
      // Mapear método de pagamento para formato esperado pelo APK PayGo
      // credit -> credito, debit -> debito, pix -> pix
      const metodoPayGo = paymentMethod === 'credit' 
        ? (parcelas > 1 ? 'credito_parcelado' : 'credito')
        : paymentMethod === 'debit' 
          ? 'debito' 
          : 'pix';
      
      const params = {
        ordemId: transactionId,
        valorCentavos: valorEmCentavos,
        metodo: metodoPayGo,
        parcelas: paymentMethod === 'credit' ? parcelas : 1
      };
      addLog('debug', 'Params:', params);
      addLog('info', `📤 Enviando para PayGo: ${metodoPayGo.toUpperCase()}`);
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
    
    addLog('info', '══════════════════════════════════════════════════════════════════');
    addLog('info', '📤 ENVIANDO RESOLUÇÃO DE PENDÊNCIA AO SDK PAYGO');
    addLog('info', '══════════════════════════════════════════════════════════════════');
    addLog('info', `⏰ Timestamp: ${new Date().toISOString()}`);
    addLog('info', `📋 Ação Solicitada: ${acao.toUpperCase()}`);
    addLog('info', `🔹 BROADCAST: br.com.setis.confirmation.TRANSACTION`);
    addLog('info', `🔹 uri: ${uriPendencia}`);
    addLog('info', `🔹 Confirmacao: ${uriConfirmacao}`);
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
      
      (window.TEF as any).resolverPendenciaComDados(pendingDataJson, statusResolucao);
      addLog('success', '✅ sendBroadcast() executado pelo APK');
    } else if (window.TEF?.resolvePendingTransaction) {
      window.TEF.resolvePendingTransaction(acao === 'confirmar' ? 'CONFIRMAR' : 'DESFAZER');
      addLog('success', '✅ Resolução enviada (resolvePendingTransaction)');
    } else if (window.TEF?.resolverPendencia) {
      window.TEF.resolverPendencia(statusResolucao);
      addLog('success', '✅ Resolução enviada (resolverPendencia)');
    } else {
      addLog('error', '❌ Nenhum método de resolução disponível no APK');
      return;
    }

    addLog('info', '⏳ Aguardando 1.5s para verificar se SDK removeu pendência...');

    setTimeout(() => {
      try {
        if (window.TEF?.hasPendingTransaction) {
          const stillPending = window.TEF.hasPendingTransaction();
          addLog('info', '══════════════════════════════════════════════════════════════════');
          addLog('info', '📥 VERIFICAÇÃO PÓS-RESOLUÇÃO');
          addLog('info', `🔹 hasPendingTransaction(): ${stillPending}`);
          addLog(stillPending ? 'error' : 'success',
            stillPending
              ? '❌ Pendência AINDA existe no SDK PayGo'
              : '✅ SDK reportou pendência removida');
          addLog('info', '══════════════════════════════════════════════════════════════════');

          if (!stillPending) {
            addLog('warning', '⚠️ Se a próxima venda falhar com -2599, use MICRO-TRANSAÇÃO R$ 0,01');
            setStatus('pending_detected');
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
  // NAVEGAÇÃO - VOLTAR AO TOTEM
  // ============================================================================

  const handleBack = useCallback(() => {
    if (showSuccessModal) {
      setShowSuccessModal(false);
      setApprovedTransaction(null);
      return;
    }
    // Voltar para a home do totem
    navigate('/totem', { replace: true });
  }, [showSuccessModal, navigate]);

  // ============================================================================
  // FECHAR MODAL - LÓGICA DE NAVEGAÇÃO
  // ============================================================================

  const handleCloseModal = useCallback(() => {
    setShowSuccessModal(false);

    // Verificar se há pendência
    let hasPendingNow = false;
    try {
      hasPendingNow = !!window.TEF?.hasPendingTransaction?.();
    } catch {
      hasPendingNow = false;
    }

    const mustResolvePending = hasPendingNow || !!pendingData || approvedTransaction?.transactionResult === -2599;

    if (mustResolvePending) {
      addLog('warning', '⚠️ Modal fechado - pendência existe (resolver antes de nova venda)');
      setStatus('pending_detected');
    } else {
      setStatus('idle');
    }

    setApprovedTransaction(null);
    // Manter na mesma tela (PDV) - não navegar
    setViewMode('pdv');
  }, [pendingData, approvedTransaction, addLog]);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col overflow-hidden select-none">
      
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <header className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Botão Voltar ao Totem */}
          <Button
            className={`${btnOutline} p-2 h-10 w-10`}
            type="button"
            onPointerDown={handleBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">PDV TEF V3</h1>
            <p className="text-xs text-gray-400">Homologação PayGo</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Toggle PDV / Logs */}
          <div className="flex border border-gray-600 rounded overflow-hidden">
            <Button 
              className={`${btnBase} px-3 py-1 text-xs rounded-none ${viewMode === 'pdv' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              onPointerDown={() => setViewMode('pdv')}
            >
              PDV
            </Button>
            <Button 
              className={`${btnBase} px-3 py-1 text-xs rounded-none ${viewMode === 'logs' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              onPointerDown={() => setViewMode('logs')}
            >
              <FileText className="w-3 h-3 mr-1" />
              Logs
            </Button>
          </div>

          {/* Status badges */}
          {status === 'processing' && (
            <Badge className="bg-blue-600 text-white text-xs">Processando...</Badge>
          )}
          {status === 'pending_detected' && (
            <Badge className="bg-red-600 text-white text-xs animate-pulse">PENDÊNCIA</Badge>
          )}
          {status === 'success' && (
            <Badge className="bg-green-600 text-white text-xs">✅ OK</Badge>
          )}
          
          {/* Indicadores de conexão */}
          {isAndroid ? (
            <Smartphone className="w-5 h-5 text-green-400" />
          ) : (
            <span className="text-xs text-yellow-400 bg-yellow-900/50 px-2 py-0.5 rounded">SIM</span>
          )}
          {isPinpadConnected ? (
            <Wifi className="w-5 h-5 text-green-400" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-400" />
          )}
        </div>
      </header>
      
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* CONTEÚDO PRINCIPAL */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-hidden">
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW: PDV */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {viewMode === 'pdv' && (
          <div className="h-full flex flex-col lg:flex-row overflow-hidden">
            
            {/* Coluna Esquerda - Vendas */}
            <div className="flex-1 p-4 overflow-y-auto">
              
              {/* Processing */}
              {status === 'processing' && (
                <Card className="bg-blue-900/50 border-blue-500 mb-4">
                  <CardContent className="p-6 text-center">
                    <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-3 animate-spin" />
                    <p className="text-blue-400 text-xl font-bold">PROCESSANDO...</p>
                    <p className="text-gray-400 text-sm mt-1">Aguarde o pinpad</p>
                  </CardContent>
                </Card>
              )}

              {/* Sucesso rápido */}
              {status === 'success' && (
                <Card className="bg-green-900/50 border-green-500 mb-4">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-green-400 text-xl font-bold">CONCLUÍDA</p>
                    <Button 
                      className={`${btnSecondary} mt-3 h-10`}
                      onPointerDown={() => setStatus('idle')}
                    >
                      Nova Transação
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Aguardando Confirmação (Passo 33) */}
              {status === 'awaiting_confirmation' && lastTransaction && (
                <Card className="bg-yellow-900/50 border-yellow-500 mb-4">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-yellow-400 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      AGUARDANDO CONFIRMAÇÃO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="text-xs text-gray-300 font-mono bg-black/30 p-3 rounded space-y-1">
                      <p>ID: {lastTransaction.confirmationTransactionId}</p>
                      <p>Valor: R$ {((lastTransaction.amount || 0) / 100).toFixed(2)}</p>
                      <p>NSU: {lastTransaction.transactionNsu}</p>
                    </div>
                    <Button 
                      className={`${btnPrimary} w-full h-12 text-base`}
                      onPointerDown={confirmarTransacao}
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      CONFIRMAR TRANSAÇÃO
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Painel de vendas - quando não está processando */}
              {status !== 'processing' && (
                <div className="space-y-4">
                  
                  {/* Método de Pagamento */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      className={`h-14 flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === 'credit' 
                          ? 'bg-blue-600 text-white border-2 border-blue-400' 
                          : 'bg-gray-700 text-gray-300 border border-gray-600'
                      } ${btnBase}`}
                      onPointerDown={() => setPaymentMethod('credit')}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span className="text-xs">CRÉDITO</span>
                    </Button>
                    <Button 
                      className={`h-14 flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === 'debit' 
                          ? 'bg-green-600 text-white border-2 border-green-400' 
                          : 'bg-gray-700 text-gray-300 border border-gray-600'
                      } ${btnBase}`}
                      onPointerDown={() => setPaymentMethod('debit')}
                    >
                      <Banknote className="w-5 h-5" />
                      <span className="text-xs">DÉBITO</span>
                    </Button>
                    <Button 
                      className={`h-14 flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === 'pix' 
                          ? 'bg-teal-600 text-white border-2 border-teal-400' 
                          : 'bg-gray-700 text-gray-300 border border-gray-600'
                      } ${btnBase}`}
                      onPointerDown={() => setPaymentMethod('pix')}
                    >
                      <QrCode className="w-5 h-5" />
                      <span className="text-xs">PIX</span>
                    </Button>
                  </div>
                  
                  {/* Parcelas - só crédito */}
                  {paymentMethod === 'credit' && (
                    <div className="grid grid-cols-6 gap-1">
                      {PARCELAS_OPCOES.map(p => (
                        <Button 
                          key={p}
                          className={`h-8 text-xs ${
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
                  )}
                  
                  {/* Valor Display */}
                  <div className="text-3xl font-bold text-center py-4 bg-black/50 rounded-lg border-2 border-yellow-600/50">
                    <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">
                      {formatarValor(valorCentavos)}
                    </span>
                  </div>
                  
                  {/* Atalhos Homologação */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      className={`${btnOutline} text-yellow-400 border-yellow-500 h-10 text-sm`}
                      onPointerDown={() => setValorCentavos(PASSOS_HOMOLOGACAO.PASSO_33.valor.toString())}
                    >
                      P33 (R$ 1.005,60)
                    </Button>
                    <Button 
                      className={`${btnOutline} text-orange-400 border-orange-500 h-10 text-sm`}
                      onPointerDown={() => setValorCentavos(PASSOS_HOMOLOGACAO.PASSO_34.valor.toString())}
                    >
                      P34 (R$ 1.005,61)
                    </Button>
                  </div>
                  
                  {/* Teclado Numérico */}
                  <div className="grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                      <Button 
                        key={d} 
                        className={`${btnSecondary} h-12 text-xl font-bold`}
                        onPointerDown={() => handleDigit(d)}
                      >
                        {d}
                      </Button>
                    ))}
                    <Button 
                      className={`${btnOutline} h-12 text-sm`}
                      onPointerDown={handleClear}
                    >
                      LIMPAR
                    </Button>
                    <Button 
                      className={`${btnSecondary} h-12 text-xl font-bold`}
                      onPointerDown={() => handleDigit('0')}
                    >
                      0
                    </Button>
                    <Button 
                      className={`${btnOutline} h-12 text-lg`}
                      onPointerDown={handleBackspace}
                    >
                      ←
                    </Button>
                  </div>
                  
                  {/* Botão de Venda */}
                  <Button 
                    className={`${btnPrimary} w-full h-14 text-lg font-bold`}
                    onPointerDown={handleConfirm}
                    disabled={!valorCentavos || parseInt(valorCentavos) === 0 || status === 'pending_detected'}
                  >
                    <Send className="w-5 h-5 mr-2" />
                    {status === 'pending_detected' ? 'RESOLVA PENDÊNCIA PRIMEIRO' : 'INICIAR VENDA'}
                  </Button>
                </div>
              )}
            </div>
            
            {/* Coluna Direita - Painel de Pendências */}
            <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-700 bg-gray-800/50 p-4 overflow-y-auto flex-shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <h3 className="text-sm font-bold text-gray-300">RESOLUÇÃO DE PENDÊNCIA</h3>
                {(status === 'pending_detected' || pendingData) && (
                  <Badge className="bg-red-600 text-white text-xs animate-pulse">ATIVA</Badge>
                )}
              </div>
              
              {status === 'pending_detected' || pendingData ? (
                <div className="space-y-3">
                  {/* Dados da pendência */}
                  {pendingData && (
                    <div className="text-xs text-gray-300 font-mono bg-black/30 p-3 rounded space-y-1">
                      <p>Provider: {pendingData.providerName}</p>
                      <p>Merchant: {pendingData.merchantId}</p>
                      <p>NSU: {pendingData.transactionNsu}</p>
                    </div>
                  )}
                  
                  {/* Botões de resolução */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      className={`${btnPrimary} h-10 text-xs`}
                      onPointerDown={() => resolverPendencia('confirmar')}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      CONFIRMAR
                    </Button>
                    <Button 
                      className={`${btnDanger} h-10 text-xs`}
                      onPointerDown={() => resolverPendencia('desfazer')}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      DESFAZER
                    </Button>
                  </div>
                  
                  {/* Micro-transação */}
                  <Button 
                    className={`${btnBase} bg-green-600 text-white w-full h-12 text-sm font-bold border-2 border-green-400`}
                    onPointerDown={() => {
                      clearPendingData();
                      iniciarVenda(1);
                    }}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    🚀 MICRO-TRANSAÇÃO R$ 0,01
                  </Button>
                  
                  {/* Ações auxiliares */}
                  <div className="grid grid-cols-3 gap-1">
                    <Button 
                      className={`${btnWarning} h-9 text-xs`}
                      onPointerDown={abrirMenuAdministrativo}
                    >
                      <Menu className="w-3 h-3 mr-0.5" />
                      PayGo
                    </Button>
                    <Button 
                      className={`${btnOutline} h-9 text-xs`}
                      onPointerDown={() => clearPendingData()}
                    >
                      <Trash2 className="w-3 h-3 mr-0.5" />
                      Limpar
                    </Button>
                    <Button 
                      className={`${btnSecondary} h-9 text-xs`}
                      onPointerDown={checkForPendingTransaction}
                    >
                      <RefreshCw className="w-3 h-3 mr-0.5" />
                      Checar
                    </Button>
                  </div>
                </div>
              ) : (
                /* Estado sem pendência */
                <div className="text-center py-6">
                  <CheckCircle className="w-10 h-10 text-green-500/50 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-4">Nenhuma pendência detectada</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      className={`${btnOutline} h-9 text-xs`}
                      onPointerDown={checkForPendingTransaction}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Verificar SDK
                    </Button>
                    <Button 
                      className={`${btnOutline} h-9 text-xs`}
                      onPointerDown={abrirMenuAdministrativo}
                    >
                      <Menu className="w-3 h-3 mr-1" />
                      Menu PayGo
                    </Button>
                  </div>
                  <Button 
                    className={`${btnWarning} w-full h-9 text-xs mt-2`}
                    onPointerDown={() => {
                      setStatus('pending_detected');
                      addLog('warning', '⚠️ Modo manual ativado');
                    }}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Forçar Modo Pendência
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW: LOGS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {viewMode === 'logs' && (
          <div className="h-full flex flex-col">
            <div className="bg-gray-800 p-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-bold">📋 Logs de Transação</h3>
              <Button 
                className={`${btnOutline} h-8 text-xs`}
                onPointerDown={clearLogs}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Limpar Logs
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-black/50">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum log registrado</p>
              ) : (
                logs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`py-1 border-b border-gray-800 ${
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
                      <pre className="text-[10px] text-gray-500 ml-4 mt-1 overflow-x-auto">
                        {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </main>
      
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL DE RESULTADO */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <TEFTransactionSuccessModal
        open={showSuccessModal}
        onClose={handleCloseModal}
        transaction={approvedTransaction}
        onPrintMerchant={() => addLog('info', '📄 Imprimindo via lojista...')}
        onPrintCustomer={() => addLog('info', '📄 Imprimindo via cliente...')}
      />
    </div>
  );
}
