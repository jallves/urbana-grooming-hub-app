/**
 * PDV TEF Homologação V3
 * 
 * 100% BASEADO NA DOCUMENTAÇÃO OFICIAL PayGo:
 * https://github.com/adminti2/mobile-integracao-uri
 * 
 * RESUMO DA SPEC:
 * 
 * 1. TRANSAÇÃO (tem UI, precisa de startActivity):
 *    - Action: br.com.setis.payment.TRANSACTION
 *    - URI: app://payment/input?operation=VENDA&amount=...&transactionId=...&currencyCode=986
 *    - Extras: DadosAutomacao, Personalizacao, package
 *    - Flags: FLAG_ACTIVITY_NEW_TASK | FLAG_ACTIVITY_CLEAR_TASK
 * 
 * 2. CONFIRMAÇÃO (background, sendBroadcast, SEM resposta):
 *    - Action: br.com.setis.confirmation.TRANSACTION
 *    - Extra "uri": app://confirmation/confirmation?confirmationTransactionId=XXX&transactionStatus=CONFIRMADO_AUTOMATICO
 *    - Flag: FLAG_INCLUDE_STOPPED_PACKAGES
 * 
 * 3. RESOLUÇÃO DE PENDÊNCIA (background, sendBroadcast, SEM resposta):
 *    - Action: br.com.setis.confirmation.TRANSACTION
 *    - Extra "uri": app://resolve/pendingTransaction?merchantId=X&providerName=X&hostNsu=X&localNsu=X&transactionNsu=X
 *    - Extra "Confirmacao": app://resolve/confirmation?transactionStatus=DESFEITO_MANUAL
 *    - Flag: FLAG_INCLUDE_STOPPED_PACKAGES
 * 
 * RESPOSTA DA TRANSAÇÃO:
 *    - Action: br.com.setis.interfaceautomacao.SERVICO
 *    - Campo pendingTransactionExists: indica se há pendência
 *    - Campo confirmationTransactionId: ID para confirmação
 *    - Campo requiresConfirmation: indica se precisa confirmar
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Smartphone, Wifi, WifiOff, CheckCircle, XCircle, AlertTriangle, 
         Clock, Trash2, Send, RefreshCw, Loader2, Menu, DollarSign, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { isAndroidTEFAvailable } from '@/lib/tef/tefAndroidBridge';

// ============================================================================
// TIPOS CONFORME DOCUMENTAÇÃO OFICIAL
// ============================================================================

interface PayGoTransactionResponse {
  // Campos obrigatórios (M)
  operation: string;
  transactionResult: number;
  requiresConfirmation: boolean;
  
  // Campos de confirmação (MC)
  confirmationTransactionId?: string;
  
  // Campos opcionais (O)
  amount?: number;
  currencyCode?: number;
  transactionNsu?: string;
  terminalNsu?: string;
  authorizationCode?: string;
  transactionId?: string;
  merchantId?: string;
  posId?: string;
  merchantName?: string;
  providerName?: string;
  cardName?: string;
  resultMessage?: string;
  
  // Campo crucial para pendência
  pendingTransactionExists?: boolean;
  
  // Comprovantes
  merchantReceipt?: string;
  cardholderReceipt?: string;
  fullReceipt?: string;
}

interface PendingTransactionData {
  providerName: string;    // M - Mandatório
  merchantId: string;      // M - Mandatório
  localNsu: string;        // M - Mandatório
  transactionNsu: string;  // M - Mandatório
  hostNsu: string;         // M - Mandatório
  timestamp?: number;
}

interface LogEntry {
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning' | 'debug';
  message: string;
  data?: unknown;
}

type PDVStatus = 'idle' | 'processing' | 'awaiting_confirmation' | 'awaiting_undo' | 'pending_detected' | 'success' | 'error';

// ============================================================================
// CONSTANTES CONFORME DOCUMENTAÇÃO
// ============================================================================

const STATUS_CONFIRMACAO = {
  CONFIRMADO_AUTOMATICO: 'CONFIRMADO_AUTOMATICO',
  CONFIRMADO_MANUAL: 'CONFIRMADO_MANUAL',
  DESFEITO_MANUAL: 'DESFEITO_MANUAL'
} as const;

const PASSOS_HOMOLOGACAO = {
  PASSO_33: { valor: 100560, descricao: 'Venda R$ 1.005,60 + CONFIRMAR' },
  PASSO_34: { valor: 100561, descricao: 'Venda R$ 1.005,61 + DESFAZER (gera pendência)' }
};

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
  
  // Dados da transação atual
  const [lastTransaction, setLastTransaction] = useState<PayGoTransactionResponse | null>(null);
  const [pendingData, setPendingData] = useState<PendingTransactionData | null>(null);
  
  // Refs para evitar duplicação
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
  
  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);
  
  // ============================================================================
  // INICIALIZAÇÃO
  // ============================================================================
  
  useEffect(() => {
    addLog('info', '═══════════════════════════════════════════════════════════');
    addLog('info', 'PDV TEF Homologação V3 - Baseado 100% na Spec PayGo');
    addLog('info', '═══════════════════════════════════════════════════════════');
    
    const androidAvailable = isAndroidTEFAvailable();
    setIsAndroid(androidAvailable);
    
    if (androidAvailable) {
      addLog('success', '✅ App Android detectado');
      checkPinpad();
      checkForPendingTransaction();
      setupGlobalResultHandler();
    } else {
      addLog('warning', '⚠️ App Android NÃO detectado - Modo simulação');
    }
    
    // Carregar pendência salva
    loadSavedPendingData();
  }, []);
  
  // ============================================================================
  // VERIFICAÇÃO DE PINPAD
  // ============================================================================
  
  const checkPinpad = useCallback(() => {
    if (!window.TEF?.verificarPinpad) return;
    
    try {
      const status = window.TEF.verificarPinpad();
      const parsed = JSON.parse(status);
      setIsPinpadConnected(parsed.conectado === true);
      addLog(parsed.conectado ? 'success' : 'warning', 
        parsed.conectado ? '✅ Pinpad conectado' : '⚠️ Pinpad desconectado',
        parsed
      );
    } catch (e) {
      addLog('error', 'Erro ao verificar pinpad', e);
    }
  }, [addLog]);
  
  // ============================================================================
  // HANDLER GLOBAL DE RESULTADO (conforme spec 3.4.1)
  // ============================================================================
  
  const setupGlobalResultHandler = useCallback(() => {
    addLog('debug', 'Registrando handler global onTefResultado');
    
    window.onTefResultado = (resultado: any) => {
      addLog('info', '═══════════════════════════════════════════════════════════');
      addLog('info', '📥 RESPOSTA DO PAYGO RECEBIDA');
      addLog('debug', 'Dados brutos:', resultado);
      
      handleTransactionResponse(resultado);
    };
  }, [addLog]);
  
  // ============================================================================
  // PROCESSAR RESPOSTA DA TRANSAÇÃO (conforme spec 3.3.2)
  // ============================================================================
  
  const handleTransactionResponse = useCallback((raw: any) => {
    processingRef.current = false;
    
    // Normalizar resultado
    const response: PayGoTransactionResponse = {
      operation: raw.operation || 'VENDA',
      transactionResult: typeof raw.transactionResult === 'number' ? raw.transactionResult : 
                         parseInt(raw.transactionResult || raw.codigoResposta || '-99', 10),
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
    addLog('debug', 'Resposta normalizada:', response);
    
    // ========================================================================
    // LÓGICA CONFORME SPEC:
    // 1. Se pendingTransactionExists = true → Há pendência (Passo 34)
    // 2. Se transactionResult = 0 e requiresConfirmation = true → Aprovado, aguarda confirmação (Passo 33)
    // 3. Se transactionResult = 0 e requiresConfirmation = false → Aprovado, já confirmado
    // 4. Se transactionResult != 0 → Erro/Negado
    // ========================================================================
    
    // CASO 1: Pendência detectada
    if (response.pendingTransactionExists) {
      addLog('warning', '⚠️ PENDÊNCIA DETECTADA - Precisa resolver antes de continuar');
      
      // Extrair dados da pendência conforme spec 3.3.4
      const pendingInfo: PendingTransactionData = {
        providerName: response.providerName || raw.providerName || 'DEMO',
        merchantId: response.merchantId || raw.merchantId || '',
        localNsu: response.terminalNsu || raw.terminalNsu || raw.localNsu || '',
        transactionNsu: response.transactionNsu || raw.transactionNsu || '',
        hostNsu: raw.hostNsu || response.transactionNsu || '',
        timestamp: Date.now()
      };
      
      // Aplicar fallbacks (campos obrigatórios)
      if (!pendingInfo.transactionNsu) pendingInfo.transactionNsu = pendingInfo.localNsu;
      if (!pendingInfo.hostNsu) pendingInfo.hostNsu = pendingInfo.transactionNsu;
      
      addLog('info', 'Dados da pendência:', pendingInfo);
      
      setPendingData(pendingInfo);
      savePendingDataToStorage(pendingInfo);
      setStatus('pending_detected');
      return;
    }
    
    // CASO 2: Transação aprovada
    if (response.transactionResult === 0) {
      addLog('success', '✅ TRANSAÇÃO APROVADA');
      
      if (response.requiresConfirmation && response.confirmationTransactionId) {
        addLog('info', `🔄 Requer confirmação. ID: ${response.confirmationTransactionId}`);
        setStatus('awaiting_confirmation');
      } else {
        addLog('success', '✅ Transação confirmada automaticamente');
        setStatus('success');
      }
      return;
    }
    
    // CASO 3: Erro -2599 (pendência não resolvida)
    if (response.transactionResult === -2599) {
      addLog('error', '❌ ERRO -2599: Existe transação pendente não resolvida');
      
      // Tentar extrair dados da pendência do erro
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
      
      addLog('info', 'Dados extraídos do erro -2599:', pendingFromError);
      
      setPendingData(pendingFromError);
      savePendingDataToStorage(pendingFromError);
      setStatus('pending_detected');
      return;
    }
    
    // CASO 4: Outros erros
    addLog('error', `❌ Transação negada/erro: ${response.transactionResult}`);
    setStatus('error');
  }, [addLog]);
  
  // ============================================================================
  // VERIFICAR PENDÊNCIA EXISTENTE (via APK)
  // ============================================================================
  
  const checkForPendingTransaction = useCallback(() => {
    if (!window.TEF?.hasPendingTransaction) return;
    
    try {
      const hasPending = window.TEF.hasPendingTransaction();
      addLog('debug', `hasPendingTransaction: ${hasPending}`);
      
      if (hasPending && window.TEF.getPendingTransactionInfo) {
        const info = window.TEF.getPendingTransactionInfo();
        const parsed = JSON.parse(info);
        addLog('warning', '⚠️ Pendência detectada no APK', parsed);
        
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
      addLog('debug', 'Erro ao verificar pendência no APK', e);
    }
  }, [addLog]);
  
  // ============================================================================
  // STORAGE LOCAL (backup dos dados de pendência)
  // ============================================================================
  
  const savePendingDataToStorage = (data: PendingTransactionData) => {
    try {
      localStorage.setItem('tef_pending_v3', JSON.stringify(data));
      addLog('debug', 'Dados de pendência salvos no localStorage');
    } catch (e) {
      addLog('error', 'Erro ao salvar pendência', e);
    }
  };
  
  const loadSavedPendingData = () => {
    try {
      const saved = localStorage.getItem('tef_pending_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verificar se não é muito antigo (30 min)
        if (parsed.timestamp && (Date.now() - parsed.timestamp) < 30 * 60 * 1000) {
          addLog('info', '📦 Pendência anterior encontrada no localStorage', parsed);
          setPendingData(parsed);
          setStatus('pending_detected');
        } else {
          localStorage.removeItem('tef_pending_v3');
        }
      }
    } catch (e) {
      addLog('debug', 'Erro ao carregar pendência salva', e);
    }
  };
  
  const clearPendingData = () => {
    localStorage.removeItem('tef_pending_v3');
    setPendingData(null);
    setStatus('idle');
    addLog('info', '🗑️ Dados de pendência limpos');
  };
  
  // ============================================================================
  // INICIAR VENDA (conforme spec 3.4.1)
  // ============================================================================
  
  const iniciarVenda = useCallback((valorEmCentavos: number) => {
    if (processingRef.current) {
      addLog('warning', 'Já existe uma transação em processamento');
      return;
    }
    
    if (status === 'pending_detected') {
      addLog('error', '❌ Existe pendência não resolvida. Resolva antes de continuar.');
      return;
    }
    
    processingRef.current = true;
    setStatus('processing');
    setLastTransaction(null);
    
    const transactionId = `TXN_${Date.now()}`;
    
    addLog('info', '═══════════════════════════════════════════════════════════');
    addLog('info', `💳 INICIANDO VENDA: R$ ${(valorEmCentavos / 100).toFixed(2)}`);
    addLog('info', `TransactionId: ${transactionId}`);
    addLog('info', '═══════════════════════════════════════════════════════════');
    
    if (!isAndroid) {
      addLog('warning', 'Modo simulação - TEF não disponível');
      setTimeout(() => {
        handleTransactionResponse({
          operation: 'VENDA',
          transactionResult: 0,
          requiresConfirmation: true,
          confirmationTransactionId: `SIMULATED_${Date.now()}`,
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
    
    // Chamar Android via bridge
    if (window.TEF?.iniciarPagamento) {
      const params = {
        ordemId: transactionId,
        valorCentavos: valorEmCentavos,
        metodo: 'credit' as const,
        parcelas: 1
      };
      
      addLog('debug', 'Chamando window.TEF.iniciarPagamento', params);
      window.TEF.iniciarPagamento(JSON.stringify(params));
    } else {
      addLog('error', '❌ window.TEF.iniciarPagamento não disponível');
      processingRef.current = false;
      setStatus('error');
    }
  }, [isAndroid, status, addLog, handleTransactionResponse]);
  
  // ============================================================================
  // CONFIRMAÇÃO (conforme spec 3.4.2)
  // URI: app://confirmation/confirmation?confirmationTransactionId=XXX&transactionStatus=XXX
  // ============================================================================
  
  const confirmarTransacao = useCallback(() => {
    if (!lastTransaction?.confirmationTransactionId) {
      addLog('error', '❌ Sem ID de confirmação');
      return;
    }
    
    const confirmId = lastTransaction.confirmationTransactionId;
    const statusConfirmacao = STATUS_CONFIRMACAO.CONFIRMADO_MANUAL;
    
    addLog('info', '═══════════════════════════════════════════════════════════');
    addLog('info', '✅ ENVIANDO CONFIRMAÇÃO (Passo 33)');
    addLog('info', `URI: app://confirmation/confirmation?confirmationTransactionId=${confirmId}&transactionStatus=${statusConfirmacao}`);
    addLog('info', '═══════════════════════════════════════════════════════════');
    
    if (!isAndroid) {
      addLog('success', '✅ [SIMULAÇÃO] Confirmação enviada');
      setStatus('success');
      return;
    }
    
    // Chamar o método do Android
    if (window.TEF?.confirmarTransacao) {
      window.TEF.confirmarTransacao(confirmId, statusConfirmacao);
      addLog('success', '✅ Confirmação enviada via bridge');
      setStatus('success');
    } else {
      addLog('error', '❌ window.TEF.confirmarTransacao não disponível');
    }
  }, [lastTransaction, isAndroid, addLog]);
  
  // ============================================================================
  // RESOLUÇÃO DE PENDÊNCIA (conforme spec 3.4.3)
  // 
  // FORMATO CORRETO:
  // Intent Action: br.com.setis.confirmation.TRANSACTION
  // Extra "uri": app://resolve/pendingTransaction?merchantId=X&providerName=X&hostNsu=X&localNsu=X&transactionNsu=X
  // Extra "Confirmacao": app://resolve/confirmation?transactionStatus=DESFEITO_MANUAL
  // Flag: FLAG_INCLUDE_STOPPED_PACKAGES
  // ============================================================================
  
  const resolverPendencia = useCallback((acao: 'confirmar' | 'desfazer') => {
    if (!pendingData) {
      addLog('error', '❌ Sem dados de pendência para resolver');
      return;
    }
    
    const statusResolucao = acao === 'confirmar' 
      ? STATUS_CONFIRMACAO.CONFIRMADO_MANUAL 
      : STATUS_CONFIRMACAO.DESFEITO_MANUAL;
    
    // Construir URIs conforme documentação oficial
    const uriPendencia = `app://resolve/pendingTransaction?` +
      `merchantId=${encodeURIComponent(pendingData.merchantId)}` +
      `&providerName=${encodeURIComponent(pendingData.providerName)}` +
      `&hostNsu=${encodeURIComponent(pendingData.hostNsu)}` +
      `&localNsu=${encodeURIComponent(pendingData.localNsu)}` +
      `&transactionNsu=${encodeURIComponent(pendingData.transactionNsu)}`;
    
    // CRÍTICO: A URI de confirmação para pendência é app://resolve/confirmation
    // NÃO é app://confirmation/confirmation
    const uriConfirmacao = `app://resolve/confirmation?transactionStatus=${statusResolucao}`;
    
    addLog('info', '═══════════════════════════════════════════════════════════');
    addLog('info', `🔄 RESOLUÇÃO DE PENDÊNCIA - ${acao.toUpperCase()}`);
    addLog('info', '───────────────────────────────────────────────────────────');
    addLog('info', 'Dados da pendência:');
    addLog('info', `  providerName: ${pendingData.providerName}`);
    addLog('info', `  merchantId: ${pendingData.merchantId}`);
    addLog('info', `  localNsu: ${pendingData.localNsu}`);
    addLog('info', `  transactionNsu: ${pendingData.transactionNsu}`);
    addLog('info', `  hostNsu: ${pendingData.hostNsu}`);
    addLog('info', '───────────────────────────────────────────────────────────');
    addLog('info', 'URIs conforme spec 3.4.3:');
    addLog('info', `  Extra "uri": ${uriPendencia}`);
    addLog('info', `  Extra "Confirmacao": ${uriConfirmacao}`);
    addLog('info', '═══════════════════════════════════════════════════════════');
    
    if (!isAndroid) {
      addLog('success', `✅ [SIMULAÇÃO] Pendência ${acao === 'confirmar' ? 'confirmada' : 'desfeita'}`);
      clearPendingData();
      return;
    }
    
    // Tentar usar o método mais específico do APK
    if (typeof (window.TEF as any)?.resolverPendenciaComDados === 'function') {
      addLog('debug', 'Usando resolverPendenciaComDados');
      const pendingDataJson = JSON.stringify({
        ...pendingData,
        // URIs para o APK montar o broadcast corretamente
        uriPendencia,
        uriConfirmacao,
        transactionStatus: statusResolucao
      });
      (window.TEF as any).resolverPendenciaComDados(pendingDataJson, statusResolucao);
      addLog('success', '✅ Resolução enviada via resolverPendenciaComDados');
    } else if (window.TEF?.resolvePendingTransaction) {
      addLog('debug', 'Usando resolvePendingTransaction');
      window.TEF.resolvePendingTransaction(acao === 'confirmar' ? 'CONFIRM' : 'UNDO');
      addLog('success', '✅ Resolução enviada via resolvePendingTransaction');
    } else if (window.TEF?.resolverPendencia) {
      addLog('debug', 'Usando resolverPendencia (fallback)');
      window.TEF.resolverPendencia(statusResolucao);
      addLog('success', '✅ Resolução enviada via resolverPendencia');
    } else {
      addLog('error', '❌ Nenhum método de resolução disponível no APK');
      return;
    }
    
    // Limpar após enviar (a validação será feita na próxima transação)
    setTimeout(() => {
      clearPendingData();
    }, 1000);
    
  }, [pendingData, isAndroid, addLog, clearPendingData]);
  
  // ============================================================================
  // ABRIR MENU ADMINISTRATIVO
  // ============================================================================
  
  const abrirMenuAdministrativo = useCallback(() => {
    addLog('info', '📋 Abrindo menu administrativo PayGo');
    
    if (window.TEF?.iniciarAdministrativa) {
      window.TEF.iniciarAdministrativa();
    } else {
      addLog('warning', 'iniciarAdministrativa não disponível');
    }
  }, [addLog]);
  
  // ============================================================================
  // FUNÇÕES DO TECLADO NUMÉRICO
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
  
  // ============================================================================
  // FORMATAÇÃO
  // ============================================================================
  
  const formatarValor = (centavos: string) => {
    const valor = parseInt(centavos || '0', 10);
    return `R$ ${(valor / 100).toFixed(2)}`;
  };
  
  const getStatusBadge = () => {
    switch (status) {
      case 'idle':
        return <Badge variant="outline" className="bg-gray-100">Aguardando</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500 text-white animate-pulse">Processando...</Badge>;
      case 'awaiting_confirmation':
        return <Badge className="bg-yellow-500 text-black">⚠️ Aguardando Confirmação</Badge>;
      case 'awaiting_undo':
        return <Badge className="bg-orange-500 text-white">⚠️ Aguardando Desfazer</Badge>;
      case 'pending_detected':
        return <Badge className="bg-red-600 text-white animate-pulse">🔴 PENDÊNCIA DETECTADA</Badge>;
      case 'success':
        return <Badge className="bg-green-500 text-white">✅ Sucesso</Badge>;
      case 'error':
        return <Badge className="bg-red-500 text-white">❌ Erro</Badge>;
    }
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/totem')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">PDV TEF Homologação V3</h1>
            <p className="text-xs text-gray-400">100% baseado na spec PayGo</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {isAndroid ? (
            <Badge className="bg-green-600">
              <Smartphone className="w-3 h-3 mr-1" />
              Android
            </Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
              Simulação
            </Badge>
          )}
          {isPinpadConnected ? (
            <Wifi className="w-5 h-5 text-green-400" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-400" />
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controles */}
        <div className="w-1/2 p-4 flex flex-col gap-4 overflow-y-auto">
          
          {/* Alerta de Pendência */}
          {status === 'pending_detected' && pendingData && (
            <Card className="bg-red-900/50 border-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  PENDÊNCIA DETECTADA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-300 font-mono bg-black/30 p-2 rounded">
                  <p>Provider: {pendingData.providerName}</p>
                  <p>Merchant: {pendingData.merchantId}</p>
                  <p>LocalNSU: {pendingData.localNsu}</p>
                  <p>TransactionNSU: {pendingData.transactionNsu}</p>
                  <p>HostNSU: {pendingData.hostNsu}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => resolverPendencia('confirmar')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    CONFIRMAR
                  </Button>
                  <Button 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => resolverPendencia('desfazer')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    DESFAZER (Passo 34)
                  </Button>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-yellow-400 border-yellow-400"
                  onClick={abrirMenuAdministrativo}
                >
                  <Menu className="w-4 h-4 mr-2" />
                  Menu Administrativo PayGo
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-gray-400"
                  onClick={clearPendingData}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar dados de pendência
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Painel de Confirmação (Passo 33) */}
          {status === 'awaiting_confirmation' && lastTransaction && (
            <Card className="bg-yellow-900/50 border-yellow-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-yellow-400 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  AGUARDANDO CONFIRMAÇÃO (Passo 33)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-300 font-mono bg-black/30 p-2 rounded">
                  <p>ConfirmationID: {lastTransaction.confirmationTransactionId}</p>
                  <p>Valor: R$ {((lastTransaction.amount || 0) / 100).toFixed(2)}</p>
                  <p>NSU: {lastTransaction.transactionNsu}</p>
                  <p>Autorização: {lastTransaction.authorizationCode}</p>
                </div>
                
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={confirmarTransacao}
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
              <CardContent className="pt-6 text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-green-400 text-xl font-bold">TRANSAÇÃO CONCLUÍDA</p>
                <Button className="mt-4" onClick={() => setStatus('idle')}>
                  Nova Transação
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Teclado Numérico */}
          {!['pending_detected', 'processing'].includes(status) && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Valor da Venda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center py-4 bg-black/30 rounded mb-4">
                  {formatarValor(valorCentavos)}
                </div>
                
                {/* Atalhos de teste */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Button 
                    variant="outline" 
                    className="text-yellow-400 border-yellow-400"
                    onClick={() => {
                      setValorCentavos(PASSOS_HOMOLOGACAO.PASSO_33.valor.toString());
                    }}
                  >
                    Passo 33 (R$ 1.005,60)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-orange-400 border-orange-400"
                    onClick={() => {
                      setValorCentavos(PASSOS_HOMOLOGACAO.PASSO_34.valor.toString());
                    }}
                  >
                    Passo 34 (R$ 1.005,61)
                  </Button>
                </div>
                
                {/* Teclado */}
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                    <Button 
                      key={d} 
                      variant="outline" 
                      className="h-12 text-xl"
                      onClick={() => handleDigit(d)}
                    >
                      {d}
                    </Button>
                  ))}
                  <Button variant="outline" className="h-12" onClick={handleClear}>
                    C
                  </Button>
                  <Button variant="outline" className="h-12 text-xl" onClick={() => handleDigit('0')}>
                    0
                  </Button>
                  <Button variant="outline" className="h-12" onClick={handleBackspace}>
                    ←
                  </Button>
                </div>
                
                <Button 
                  className="w-full mt-4 h-14 text-lg bg-green-600 hover:bg-green-700"
                  onClick={handleConfirm}
                  disabled={!valorCentavos || parseInt(valorCentavos) === 0}
                >
                  {['processing'].includes(status) ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      INICIAR VENDA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Ações adicionais */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={checkPinpad}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Pinpad
            </Button>
            <Button variant="outline" size="sm" onClick={abrirMenuAdministrativo}>
              <Menu className="w-4 h-4 mr-1" />
              Admin PayGo
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              <Trash2 className="w-4 h-4 mr-1" />
              Limpar Logs
            </Button>
          </div>
        </div>
        
        {/* Right Panel - Logs */}
        <div className="w-1/2 border-l border-gray-700 flex flex-col">
          <div className="bg-gray-800 p-2 border-b border-gray-700">
            <h3 className="text-sm font-bold">📋 Logs em Tempo Real</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 font-mono text-xs bg-black/50">
            {logs.map((log, i) => (
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
                  <pre className="text-[10px] text-gray-500 ml-4 overflow-x-auto">
                    {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
      
      {/* Footer - Documentação */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 text-xs text-gray-400">
        <strong>Spec PayGo 3.4.3:</strong>{' '}
        Resolução de Pendência usa Action <code>br.com.setis.confirmation.TRANSACTION</code>,{' '}
        Extra "uri": <code>app://resolve/pendingTransaction?...</code>,{' '}
        Extra "Confirmacao": <code>app://resolve/confirmation?transactionStatus=DESFEITO_MANUAL</code>
      </div>
    </div>
  );
}
