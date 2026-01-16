/**
 * PDV TEF Homologação V3
 *
 * 100% BASEADO NA DOCUMENTAÇÃO OFICIAL PayGo:
 * https://github.com/adminti2/mobile-integracao-uri
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Smartphone, Wifi, WifiOff, CheckCircle, XCircle, AlertTriangle, 
         Clock, Trash2, Send, RefreshCw, Loader2, Menu, CreditCard, Banknote, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  
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
  
  // Modal de transação aprovada
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [approvedTransaction, setApprovedTransaction] = useState<PayGoTransactionResponse | null>(null);
  
  // Estado para oferecer micro-transação após falha na resolução
  const [showMicroTransactionOffer, setShowMicroTransactionOffer] = useState(false);
  const [resolutionAttempted, setResolutionAttempted] = useState(false);
  
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

    // Muitos retornos chegam via TEFResultado (hook/bridge), então cobrimos os aliases.
    const codeFromPayload =
      parseResultCode(raw?.transactionResult) ??
      parseResultCode(raw?.codigoResposta) ??
      parseResultCode(raw?.codigoErro) ??
      null;

    // Fallback: se o payload vier sem código, mas indicar aprovação.
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
      // NSU Local é o campo principal para a planilha PayGo
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
      
      // IMPORTANTE: Transação aprovada significa que o PayGo resolveu automaticamente 
      // qualquer pendência anterior. Limpar dados locais de pendência.
      if (pendingData) {
        addLog('success', '🧹 Pendência anterior resolvida automaticamente pelo PayGo');
        localStorage.removeItem('tef_pending_v3');
        setPendingData(null);
      }
      
      // Mostrar modal de sucesso com dados da transação
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
      // Mostrar modal com dados da pendência
      setApprovedTransaction(response);
      setShowSuccessModal(true);
      setStatus('pending_detected');
      return;
    }
    
    // Transação negada/erro
    addLog('error', `❌ Não aprovada: ${response.transactionResult}`);
    setApprovedTransaction(response);
    setShowSuccessModal(true);

    // REGRA DE OURO (homologação): após QUALQUER não-aprovação, checar o SDK imediatamente.
    // Isso evita o caso relatado: fecha o pop-up e não aparece o painel para resolver.
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

      // Fallback: se o texto indicar pendência, forçar painel mesmo que o SDK não reporte agora.
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

    // Marcar que tentamos resolver
    setResolutionAttempted(true);

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
              : '✅ RESULTADO: SDK reportou pendência removida');
          addLog('info', '══════════════════════════════════════════════════════════════════');

          // IMPORTANTE:
          // Em modo autoatendimento (unattended), o SDK pode reportar que não há pendência,
          // mas ainda assim bloquear a próxima transação com -2599.
          // Por isso, NÃO limpamos automaticamente a pendência local aqui.
          // A forma mais confiável de “destravar” é a micro-transação (R$ 0,01) ou uma venda aprovada.
          if (!stillPending) {
            addLog('warning', '⚠️ Se a próxima venda ainda falhar com -2599, use a MICRO-TRANSAÇÃO R$ 0,01 para forçar a resolução automática.');
            // Mantém status em pending_detected para deixar os botões visíveis
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
  // RENDER
  // ============================================================================
  
  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-2 md:p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            className={`${btnOutline} p-2`}
            type="button"
            onPointerDown={() => {
              if (showSuccessModal) {
                setShowSuccessModal(false);
                setApprovedTransaction(null);
                return;
              }
              const from = location.state?.from;
              if (from) {
                navigate(from);
                return;
              }
              navigate('/totem/tef-homologacao');
            }}
            onClick={() => {
              if (showSuccessModal) {
                setShowSuccessModal(false);
                setApprovedTransaction(null);
                return;
              }
              const from = location.state?.from;
              if (from) {
                navigate(from);
                return;
              }
              navigate('/totem/tef-homologacao');
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-base md:text-lg font-bold">PDV TEF V3</h1>
            <p className="text-[10px] md:text-xs text-gray-400">PayGo Homologação</p>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          {/* ATALHO RESOLVER PENDÊNCIA - SEMPRE VISÍVEL */}
          <Button 
            className={`${btnDanger} px-2 py-1 text-xs flex items-center gap-1`}
            onPointerDown={() => {
              // Força verificação de pendência no APK
              if (window.TEF?.hasPendingTransaction) {
                const hasPending = window.TEF.hasPendingTransaction();
                if (hasPending && window.TEF.getPendingTransactionInfo) {
                  try {
                    const info = window.TEF.getPendingTransactionInfo();
                    const parsed = JSON.parse(info);
                    addLog('info', '🔍 Pendência encontrada via atalho', parsed);
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
                  } catch (e) {
                    addLog('error', 'Erro ao parsear pendência', e);
                  }
                } else {
                  addLog('info', '✅ Nenhuma pendência detectada no SDK');
                  // Mostrar pendência local se existir
                  const saved = localStorage.getItem('tef_pending_v3');
                  if (saved) {
                    try {
                      const parsed = JSON.parse(saved);
                      addLog('warning', '📦 Pendência local encontrada', parsed);
                      setPendingData(parsed);
                      setStatus('pending_detected');
                    } catch (e) {}
                  } else {
                    // Forçar estado de pendência para mostrar botões
                    setStatus('pending_detected');
                    addLog('warning', '⚠️ Modo manual - use Menu PayGo para verificar');
                  }
                }
              } else {
                // Sem TEF disponível, forçar estado de pendência para mostrar opções
                setStatus('pending_detected');
                addLog('warning', '⚠️ TEF não disponível - Modo manual ativado');
              }
            }}
          >
            <AlertTriangle className="w-3 h-3" />
            <span className="hidden md:inline">RESOLVER</span>
            <span className="md:hidden">FIX</span>
          </Button>
          
          {status === 'processing' && (
            <Badge className="bg-blue-600 text-white text-xs">Processando...</Badge>
          )}
          {status === 'pending_detected' && (
            <Badge className="bg-red-600 text-white text-xs animate-pulse">PENDÊNCIA</Badge>
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
      
      {/* Main Content - Layout Unificado */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Panel - Controles (dividido em 2 seções) */}
        <div className="flex-1 md:w-1/2 flex flex-col overflow-hidden">
          
          {/* SEÇÃO SUPERIOR: Vendas */}
          <div className="flex-1 p-2 md:p-3 overflow-y-auto border-b border-gray-700">
            
            {/* Painel de Confirmação (Passo 33) */}
            {status === 'awaiting_confirmation' && lastTransaction && (
              <Card className="bg-yellow-900/50 border-yellow-500 mb-3">
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
                    className={`${btnPrimary} w-full h-10 text-sm`}
                    onPointerDown={confirmarTransacao}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    CONFIRMAR
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Sucesso rápido */}
            {status === 'success' && (
              <Card className="bg-green-900/50 border-green-500 mb-3">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 text-lg font-bold">CONCLUÍDA</p>
                  <Button 
                    className={`${btnSecondary} mt-2 h-8 text-xs`}
                    onPointerDown={() => setStatus('idle')}
                  >
                    Nova Transação
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Processing */}
            {status === 'processing' && (
              <Card className="bg-blue-900/50 border-blue-500 mb-3">
                <CardContent className="p-4 text-center">
                  <Loader2 className="w-10 h-10 text-blue-400 mx-auto mb-2 animate-spin" />
                  <p className="text-blue-400 text-lg font-bold">PROCESSANDO...</p>
                  <p className="text-gray-400 text-xs">Aguarde o pinpad</p>
                </CardContent>
              </Card>
            )}
            
            {/* Método de Pagamento e Teclado - sempre visível exceto quando processing */}
            {status !== 'processing' && (
              <div className="space-y-2">
                {/* Método de Pagamento compacto */}
                <div className="grid grid-cols-3 gap-1">
                  <Button 
                    className={`h-10 flex flex-col items-center justify-center gap-0.5 ${
                      paymentMethod === 'credit' 
                        ? 'bg-blue-600 text-white border-blue-400' 
                        : 'bg-gray-700 text-gray-300 border-gray-600'
                    } ${btnBase} border`}
                    onPointerDown={() => setPaymentMethod('credit')}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-[8px]">CRÉDITO</span>
                  </Button>
                  <Button 
                    className={`h-10 flex flex-col items-center justify-center gap-0.5 ${
                      paymentMethod === 'debit' 
                        ? 'bg-green-600 text-white border-green-400' 
                        : 'bg-gray-700 text-gray-300 border-gray-600'
                    } ${btnBase} border`}
                    onPointerDown={() => setPaymentMethod('debit')}
                  >
                    <Banknote className="w-4 h-4" />
                    <span className="text-[8px]">DÉBITO</span>
                  </Button>
                  <Button 
                    className={`h-10 flex flex-col items-center justify-center gap-0.5 ${
                      paymentMethod === 'pix' 
                        ? 'bg-teal-600 text-white border-teal-400' 
                        : 'bg-gray-700 text-gray-300 border-gray-600'
                    } ${btnBase} border`}
                    onPointerDown={() => setPaymentMethod('pix')}
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="text-[8px]">PIX</span>
                  </Button>
                </div>
                
                {/* Parcelas compacto - só crédito */}
                {paymentMethod === 'credit' && (
                  <div className="grid grid-cols-6 gap-0.5">
                    {PARCELAS_OPCOES.map(p => (
                      <Button 
                        key={p}
                        className={`h-6 text-[10px] ${
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
                
                {/* Valor */}
                <div className="text-2xl font-bold text-center py-2 bg-black/50 rounded border border-yellow-600/50">
                  <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">
                    {formatarValor(valorCentavos)}
                  </span>
                </div>
                
                {/* Atalhos homologação */}
                <div className="grid grid-cols-2 gap-1">
                  <Button 
                    className={`${btnOutline} text-yellow-400 border-yellow-500 text-[9px] h-6`}
                    onPointerDown={() => setValorCentavos(PASSOS_HOMOLOGACAO.PASSO_33.valor.toString())}
                  >
                    P33 (R$ 1.005,60)
                  </Button>
                  <Button 
                    className={`${btnOutline} text-orange-400 border-orange-500 text-[9px] h-6`}
                    onPointerDown={() => setValorCentavos(PASSOS_HOMOLOGACAO.PASSO_34.valor.toString())}
                  >
                    P34 (R$ 1.005,61)
                  </Button>
                </div>
                
                {/* Teclado compacto */}
                <div className="grid grid-cols-3 gap-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                    <Button 
                      key={d} 
                      className={`${btnSecondary} h-8 text-lg`}
                      onPointerDown={() => handleDigit(d)}
                    >
                      {d}
                    </Button>
                  ))}
                  <Button 
                    className={`${btnOutline} h-8 text-xs`}
                    onPointerDown={handleClear}
                  >
                    C
                  </Button>
                  <Button 
                    className={`${btnSecondary} h-8 text-lg`}
                    onPointerDown={() => handleDigit('0')}
                  >
                    0
                  </Button>
                  <Button 
                    className={`${btnOutline} h-8 text-sm`}
                    onPointerDown={handleBackspace}
                  >
                    ←
                  </Button>
                </div>
                
                {/* Botão de Venda */}
                <Button 
                  className={`${btnPrimary} w-full h-10 text-sm`}
                  onPointerDown={handleConfirm}
                  disabled={!valorCentavos || parseInt(valorCentavos) === 0 || status === 'pending_detected'}
                >
                  <Send className="w-4 h-4 mr-1" />
                  {status === 'pending_detected' ? 'RESOLVA PENDÊNCIA PRIMEIRO' : 'INICIAR VENDA'}
                </Button>
              </div>
            )}
          </div>
          
          {/* SEÇÃO INFERIOR: Painel de Resolução de Pendência - SEMPRE VISÍVEL */}
          <div className="h-48 md:h-56 p-2 md:p-3 overflow-y-auto bg-gray-800/50 flex-shrink-0">
            <div className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              RESOLUÇÃO DE PENDÊNCIA
              {(status === 'pending_detected' || pendingData) && <Badge className="bg-red-600 text-white text-[10px] ml-1 animate-pulse">ATIVA</Badge>}
            </div>
            
            {/* Pendência Detectada */}
            {status === 'pending_detected' || pendingData ? (
              <div className="space-y-2">
                {/* Dados da pendência */}
                {pendingData && (
                  <div className="text-[9px] text-gray-300 font-mono bg-black/30 p-1.5 rounded grid grid-cols-3 gap-1">
                    <p>Provider: {pendingData.providerName}</p>
                    <p>Merchant: {pendingData.merchantId}</p>
                    <p>NSU: {pendingData.transactionNsu}</p>
                  </div>
                )}
                
                {/* Botões de resolução - SEMPRE VISÍVEIS */}
                <div className="space-y-2">
                  {/* Linha 1: CONFIRMAR e DESFAZER */}
                  <div className="grid grid-cols-2 gap-1">
                    <Button 
                      className={`${btnPrimary} h-8 text-[10px]`}
                      onPointerDown={() => resolverPendencia('confirmar')}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      CONFIRMAR
                    </Button>
                    <Button 
                      className={`${btnDanger} h-8 text-[10px]`}
                      onPointerDown={() => resolverPendencia('desfazer')}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      DESFAZER
                    </Button>
                  </div>
                  
                  {/* Linha 2: MICRO-TRANSAÇÃO - SEMPRE VISÍVEL */}
                  <Button 
                    className={`${btnBase} bg-green-600 text-white w-full h-10 text-xs font-bold border-2 border-green-400`}
                    onPointerDown={() => {
                      setShowMicroTransactionOffer(false);
                      setResolutionAttempted(false);
                      clearPendingData();
                      iniciarVenda(1);
                    }}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    🚀 MICRO-TRANSAÇÃO R$ 0,01 (FORÇA RESOLUÇÃO)
                  </Button>
                </div>
                
                {/* Ações auxiliares */}
                <div className="flex gap-1">
                  <Button 
                    className={`${btnWarning} flex-1 h-7 text-[9px]`}
                    onPointerDown={abrirMenuAdministrativo}
                  >
                    <Menu className="w-3 h-3 mr-0.5" />
                    PayGo
                  </Button>
                  <Button 
                    className={`${btnOutline} flex-1 h-7 text-[9px]`}
                    onPointerDown={() => {
                      clearPendingData();
                      setShowMicroTransactionOffer(false);
                      setResolutionAttempted(false);
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-0.5" />
                    Limpar
                  </Button>
                  <Button 
                    className={`${btnSecondary} flex-1 h-7 text-[9px]`}
                    onPointerDown={checkForPendingTransaction}
                  >
                    <RefreshCw className="w-3 h-3 mr-0.5" />
                    Checar
                  </Button>
                </div>
              </div>
            ) : (
              /* Estado sem pendência */
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 text-green-500/50 mx-auto mb-2" />
                <p className="text-[10px] text-gray-500">Nenhuma pendência detectada</p>
                <div className="flex gap-1 justify-center mt-2">
                  <Button 
                    className={`${btnOutline} h-7 text-[9px]`}
                    onPointerDown={checkForPendingTransaction}
                  >
                    <RefreshCw className="w-3 h-3 mr-0.5" />
                    Verificar SDK
                  </Button>
                  <Button 
                    className={`${btnOutline} h-7 text-[9px]`}
                    onPointerDown={abrirMenuAdministrativo}
                  >
                    <Menu className="w-3 h-3 mr-0.5" />
                    Menu PayGo
                  </Button>
                  <Button 
                    className={`${btnWarning} h-7 text-[9px]`}
                    onPointerDown={() => {
                      // Forçar modo de pendência manual
                      setStatus('pending_detected');
                      addLog('warning', '⚠️ Modo manual ativado');
                    }}
                  >
                    <AlertTriangle className="w-3 h-3 mr-0.5" />
                    Forçar
                  </Button>
                </div>
              </div>
            )}
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
      
      {/* Modal de Resultado da Transação */}
      <TEFTransactionSuccessModal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);

          // Regra: se ainda há pendência no SDK (ou pendingData local), não deixar voltar para idle.
          // Isso evita o cenário: "UI mostra NEGADA", fecha modal, tenta nova venda, e estoura -2599.
          let hasPendingNow = false;
          try {
            hasPendingNow = !!window.TEF?.hasPendingTransaction?.();
          } catch {
            hasPendingNow = false;
          }

          const mustResolvePending = hasPendingNow || !!pendingData || approvedTransaction?.transactionResult === -2599;

          if (mustResolvePending) {
            addLog('warning', '⚠️ Modal fechado - pendência ainda existe (resolver antes de nova venda)');
            setStatus('pending_detected');
            // Navegar para o PDV garantindo que exibirá o painel de pendências
            navigate('/totem/tef-homologacao', { replace: true });
          } else {
            setStatus('idle');
            // Navegar de volta ao PDV inicial limpo
            navigate('/totem/tef-homologacao', { replace: true });
          }

          setApprovedTransaction(null);
        }}
        transaction={approvedTransaction}
        onPrintMerchant={() => addLog('info', '📄 Imprimindo via lojista...')}
        onPrintCustomer={() => addLog('info', '📄 Imprimindo via cliente...')}
      />
    </div>
  );
}
