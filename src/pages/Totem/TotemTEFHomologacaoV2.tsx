/**
 * PDV de Homologação TEF v2.0 - COMPLETO
 * 
 * Implementação 100% conforme documentação oficial PayGo:
 * https://github.com/adminti2/mobile-integracao-uri
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * FLUXO PASSOS 33 E 34 (OBRIGATÓRIO PAYGO):
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PASSO 33 - Venda com Confirmação:
 * 1. Enviar CRT (Venda R$ 1.005,60)
 * 2. Receber aprovação (campo 009-000 = 0)
 * 3. Imprimir comprovante
 * 4. Enviar CNF (Confirmação)
 * 
 * PASSO 34 - Venda com Pendência:
 * 1. Enviar CRT (Venda R$ 1.005,61)
 * 2. PayGo retorna erro -2599 (existe pendência)
 * 3. Clicar DESFAZER para resolver pendência
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * URIs PayGo (Integração via Android):
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 1. TRANSAÇÃO: br.com.setis.payment.TRANSACTION (startActivity)
 *    - operation: VENDA, CANCELAMENTO, REIMPRESSAO, ADMINISTRATIVA
 * 
 * 2. CONFIRMAÇÃO: br.com.setis.confirmation.TRANSACTION (sendBroadcast)
 *    - transactionStatus: CONFIRMADO_MANUAL, DESFEITO_MANUAL
 * 
 * 3. PENDÊNCIA: Combina pendingTransaction + confirmation
 *    - pendingTransaction: providerName, merchantId, localNsu, transactionNsu, hostNsu
 *    - confirmation: transactionStatus
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Trash2,
  CreditCard,
  QrCode,
  Check,
  Undo2,
  Play,
  FileText,
  Settings,
  Info,
  Wifi,
  WifiOff,
  Download,
  Copy
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
  salvarConfirmationIdAndroid,
  clearSavedPendingData,
  limparPendingDataCompleto,
  canStartNewTransaction,
  hasPendingTransactionAndroid,
  type TEFResultado
} from '@/lib/tef/tefAndroidBridge';
import { toast } from 'sonner';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

type PaymentMethod = 'debito' | 'credito' | 'pix';

type PDVState = 
  | 'idle'           // Aguardando input do operador
  | 'checking'       // Verificando pendências
  | 'processing'     // Transação em andamento no PayGo
  | 'approved'       // Transação aprovada - aguardando confirmação
  | 'confirming'     // Enviando confirmação/resolução
  | 'pending'        // Pendência detectada - precisa resolver
  | 'success'        // Fluxo finalizado com sucesso
  | 'error';         // Erro no processo

interface TransactionData {
  // Dados básicos da transação
  status: 'aprovado' | 'negado' | 'cancelado' | 'erro' | 'pendente';
  valor?: number;
  nsu?: string;
  autorizacao?: string;
  bandeira?: string;
  mensagem?: string;
  
  // Dados para confirmação (Passo 33)
  confirmationTransactionId?: string;
  requiresConfirmation?: boolean;
  
  // Dados para resolução de pendência (Passo 34)
  pendingData?: {
    providerName: string;
    merchantId: string;
    localNsu: string;
    transactionNsu: string;
    hostNsu: string;
  };
  
  // Código de erro
  codigoErro?: string;
}

interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'pending' | 'debug';
  message: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function TotemTEFHomologacaoV2() {
  const navigate = useNavigate();
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADOS PRINCIPAIS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [pdvState, setPdvState] = useState<PDVState>('idle');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debito');
  const [installments, setInstallments] = useState(1);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DADOS DA TRANSAÇÃO ATUAL
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LOGS E DIAGNÓSTICO
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADO DO ANDROID TEF
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [isAndroid, setIsAndroid] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HOOK TEF ANDROID
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleTefSuccess = useCallback((result: TEFResultado) => {
    handlePaymentApproved(result);
  }, []);
  
  const handleTefError = useCallback((erro: string, resultadoCompleto?: TEFResultado) => {
    handlePaymentError(resultadoCompleto || { status: 'erro', mensagem: erro });
  }, []);
  
  const handleTefCancelled = useCallback(() => {
    handlePaymentCancelled();
  }, []);
  
  const { 
    iniciarPagamento, 
    isProcessing: tefProcessing,
    isPinpadConnected,
    isAndroidAvailable,
    verificarConexao
  } = useTEFAndroid({
    onSuccess: handleTefSuccess,
    onError: handleTefError,
    onCancelled: handleTefCancelled
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNÇÕES DE LOG
  // ═══════════════════════════════════════════════════════════════════════════
  
  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      time: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
      type,
      message
    };
    setLogs(prev => [...prev.slice(-150), entry]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    limparLogsAndroid();
    addLog('info', '🗑️ Logs limpos');
  }, [addLog]);

  const copyLogs = useCallback(() => {
    const logText = logs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(logText);
    toast.success('Logs copiados!');
  }, [logs]);

  const downloadLogs = useCallback(() => {
    const logText = logs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tef-homologacao-logs-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ═══════════════════════════════════════════════════════════════════════════
  // INICIALIZAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    const androidAvailable = isAndroidTEFAvailable();
    setIsAndroid(androidAvailable);
    
    addLog('info', '╔═══════════════════════════════════════════════════════════╗');
    addLog('info', '║         PDV HOMOLOGAÇÃO TEF v2.0 - INICIADO              ║');
    addLog('info', '╠═══════════════════════════════════════════════════════════╣');
    addLog('info', `║ Android TEF: ${androidAvailable ? '✅ DISPONÍVEL' : '❌ NÃO DISPONÍVEL'}`);
    addLog('info', '╚═══════════════════════════════════════════════════════════╝');
    
    // Verificar pendências ao iniciar
    if (androidAvailable) {
      setTimeout(() => checkPendingTransactions(), 500);
    }
  }, [addLog]);

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICAÇÃO DE PENDÊNCIAS (OBRIGATÓRIO PAYGO)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const checkPendingTransactions = useCallback(async () => {
    addLog('info', '🔍 Verificando pendências PayGo...');
    setPdvState('checking');
    
    try {
      // 1. Verificar via função do SDK
      const hasPendingSDK = hasPendingTransactionAndroid();
      addLog('debug', `  hasPendingTransaction (SDK): ${hasPendingSDK}`);
      
      // 2. Verificar via getPendingInfo
      const pendingInfo = await getPendingInfoAndroid();
      addLog('debug', `  getPendingInfo: ${JSON.stringify(pendingInfo)}`);
      
      // 3. Verificar localStorage
      const savedPendingData = localStorage.getItem('tef_pending_data');
      const hasLocalPending = !!savedPendingData;
      addLog('debug', `  localStorage tef_pending_data: ${hasLocalPending ? 'SIM' : 'NÃO'}`);
      
      // 4. Determinar se há pendência
      const hasPending = hasPendingSDK || 
                         pendingInfo?.hasPendingData || 
                         hasLocalPending ||
                         !!pendingInfo?.lastConfirmationId;
      
      if (hasPending) {
        addLog('pending', '⚠️ PENDÊNCIA DETECTADA!');
        
        // Montar dados da pendência
        let pendingData: TransactionData['pendingData'] | undefined;
        
        if (savedPendingData) {
          try {
            const parsed = JSON.parse(savedPendingData);
            pendingData = {
              providerName: parsed.providerName || '',
              merchantId: parsed.merchantId || '',
              localNsu: parsed.localNsu || '',
              transactionNsu: parsed.transactionNsu || parsed.localNsu || '',
              hostNsu: parsed.hostNsu || parsed.transactionNsu || parsed.localNsu || '',
            };
            addLog('debug', `  Dados: providerName=${pendingData.providerName}, merchantId=${pendingData.merchantId}`);
            addLog('debug', `  NSUs: local=${pendingData.localNsu}, tx=${pendingData.transactionNsu}, host=${pendingData.hostNsu}`);
          } catch (e) {
            addLog('error', `  Erro ao parsear dados de pendência: ${e}`);
          }
        }
        
        setTransactionData({
          status: 'pendente',
          confirmationTransactionId: pendingInfo?.lastConfirmationId as string,
          pendingData
        });
        
        setPdvState('pending');
      } else {
        addLog('success', '✅ Nenhuma pendência encontrada');
        setPdvState('idle');
      }
    } catch (error) {
      addLog('error', `❌ Erro ao verificar pendências: ${error}`);
      setPdvState('idle');
    }
  }, [addLog]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS DE PAGAMENTO
  // ═══════════════════════════════════════════════════════════════════════════
  
  function handlePaymentApproved(result: TEFResultado) {
    addLog('success', '════════════════════════════════════════════════════════');
    addLog('success', '║               ✅ TRANSAÇÃO APROVADA!                   ║');
    addLog('success', '════════════════════════════════════════════════════════');
    addLog('info', `  NSU: ${result.nsu || 'N/A'}`);
    addLog('info', `  Autorização: ${result.autorizacao || 'N/A'}`);
    addLog('info', `  Bandeira: ${result.bandeira || 'N/A'}`);
    addLog('info', `  ConfirmationId: ${result.confirmationTransactionId || 'N/A'}`);
    addLog('info', `  Requer Confirmação: ${result.requiresConfirmation ? 'SIM' : 'NÃO'}`);
    
    // Salvar dados para confirmação posterior
    if (result.confirmationTransactionId) {
      salvarConfirmationIdAndroid(
        result.confirmationTransactionId,
        result.nsu || '',
        result.autorizacao || ''
      );
      addLog('debug', '  💾 ConfirmationId salvo para confirmação posterior');
    }
    
    setTransactionData({
      status: 'aprovado',
      valor: result.valor,
      nsu: result.nsu,
      autorizacao: result.autorizacao,
      bandeira: result.bandeira,
      mensagem: result.mensagem,
      confirmationTransactionId: result.confirmationTransactionId,
      requiresConfirmation: result.requiresConfirmation
    });
    
    // Se requer confirmação, ir para estado approved
    if (result.requiresConfirmation) {
      addLog('warning', '⚠️ ATENÇÃO: Transação requer CONFIRMAÇÃO!');
      addLog('warning', '   Clique em CONFIRMAR para finalizar (Passo 33)');
      setPdvState('approved');
    } else {
      // Já confirmado automaticamente
      setPdvState('success');
    }
  }

  function handlePaymentError(error: TEFResultado) {
    addLog('error', '════════════════════════════════════════════════════════');
    addLog('error', '║                   ❌ ERRO NA TRANSAÇÃO                  ║');
    addLog('error', '════════════════════════════════════════════════════════');
    addLog('error', `  Código: ${error.codigoErro || error.codigoResposta || 'N/A'}`);
    addLog('error', `  Mensagem: ${error.mensagem || 'Erro desconhecido'}`);
    
    // Verificar se é erro de pendência (-2599)
    const isPendingError = 
      error.codigoErro === '-2599' || 
      error.codigoResposta === '-2599' ||
      error.mensagem?.toLowerCase().includes('pendente') ||
      error.mensagem?.toLowerCase().includes('pendência');
    
    if (isPendingError) {
      addLog('pending', '════════════════════════════════════════════════════════');
      addLog('pending', '║        ⚠️ ERRO -2599: TRANSAÇÃO PENDENTE!             ║');
      addLog('pending', '║        Clique em DESFAZER para resolver (Passo 34)    ║');
      addLog('pending', '════════════════════════════════════════════════════════');
      
      setTransactionData({
        status: 'pendente',
        codigoErro: '-2599',
        mensagem: error.mensagem
      });
      
      // Verificar se há dados de pendência salvos
      checkPendingTransactions();
    } else {
      setTransactionData({
        status: 'erro',
        mensagem: error.mensagem,
        codigoErro: error.codigoErro
      });
      setPdvState('error');
    }
  }

  function handlePaymentCancelled() {
    addLog('warning', '════════════════════════════════════════════════════════');
    addLog('warning', '║            ⚡ TRANSAÇÃO CANCELADA PELO USUÁRIO         ║');
    addLog('warning', '════════════════════════════════════════════════════════');
    
    setTransactionData({
      status: 'cancelado',
      mensagem: 'Cancelado pelo usuário'
    });
    setPdvState('idle');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXECUTAR VENDA
  // ═══════════════════════════════════════════════════════════════════════════
  
  const executePayment = useCallback(async () => {
    if (!amount || parseInt(amount) <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    const valorCentavos = parseInt(amount);
    const valorReais = valorCentavos / 100;
    const valorFormatado = valorReais.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
    
    addLog('info', '════════════════════════════════════════════════════════');
    addLog('info', '║                 🚀 INICIANDO VENDA                     ║');
    addLog('info', '════════════════════════════════════════════════════════');
    addLog('info', `  Valor: ${valorFormatado} (${valorCentavos} centavos)`);
    addLog('info', `  Método: ${paymentMethod.toUpperCase()}`);
    if (paymentMethod === 'credito' && installments > 1) {
      addLog('info', `  Parcelas: ${installments}x`);
    }
    
    // Verificar se pode iniciar nova transação
    if (isAndroid) {
      const canStart = canStartNewTransaction();
      addLog('debug', `  canStartNewTransaction: ${canStart}`);
      
      if (!canStart) {
        addLog('error', '❌ Não é possível iniciar nova transação - resolva a pendência primeiro!');
        toast.error('Resolva a pendência antes de iniciar nova venda');
        checkPendingTransactions();
        return;
      }
    }
    
    setPdvState('processing');
    setTransactionData(null);
    
    // Detectar passo da homologação
    if (valorCentavos === 100560) {
      addLog('info', '📋 PASSO 33 DETECTADO: Venda R$ 1.005,60');
      addLog('info', '   → Após aprovação, clicar CONFIRMAR');
    } else if (valorCentavos === 100561) {
      addLog('info', '📋 PASSO 34 DETECTADO: Venda R$ 1.005,61');
      addLog('info', '   → PayGo retornará erro -2599 (pendência)');
      addLog('info', '   → Clicar DESFAZER para resolver');
    }
    
    if (!isAndroid) {
      // Simulação para ambiente web
      addLog('warning', '⚠️ Ambiente WEB - Simulando transação...');
      setTimeout(() => {
        if (valorCentavos === 100561) {
          // Simular erro de pendência
          handlePaymentError({
            status: 'erro',
            codigoErro: '-2599',
            mensagem: 'Existe transação pendente'
          });
        } else {
          // Simular aprovação
          handlePaymentApproved({
            status: 'aprovado',
            nsu: `SIM${Date.now().toString().slice(-6)}`,
            autorizacao: `AUT${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
            bandeira: 'VISA',
            valor: valorReais,
            mensagem: 'TRANSAÇÃO APROVADA (SIMULADO)',
            confirmationTransactionId: `CONF-${Date.now()}`,
            requiresConfirmation: true
          });
        }
      }, 2000);
      return;
    }
    
    try {
      const ordemId = `HOMOLOG_${Date.now()}`;
      const tipo = paymentMethod === 'credito' ? 'credit' : paymentMethod === 'debito' ? 'debit' : 'pix';
      
      addLog('debug', `  Chamando iniciarPagamento...`);
      addLog('debug', `  ordemId: ${ordemId}`);
      addLog('debug', `  tipo: ${tipo}`);
      
      await iniciarPagamento({
        ordemId,
        valor: valorReais,
        tipo,
        parcelas: installments
      });
      
    } catch (e) {
      addLog('error', `Erro ao iniciar pagamento: ${e}`);
      setPdvState('error');
    }
  }, [amount, paymentMethod, installments, isAndroid, iniciarPagamento, addLog, checkPendingTransactions]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIRMAR TRANSAÇÃO (PASSO 33)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const confirmTransaction = useCallback(async () => {
    if (!transactionData?.confirmationTransactionId) {
      toast.error('Nenhum confirmationId disponível');
      addLog('error', '❌ Não foi possível confirmar: confirmationId não encontrado');
      return;
    }
    
    addLog('info', '════════════════════════════════════════════════════════');
    addLog('info', '║         📤 ENVIANDO CONFIRMAÇÃO (PASSO 33)            ║');
    addLog('info', '════════════════════════════════════════════════════════');
    addLog('info', `  ConfirmationId: ${transactionData.confirmationTransactionId}`);
    addLog('info', `  Status: CONFIRMADO_MANUAL`);
    
    setPdvState('confirming');
    
    try {
      const result = confirmarTransacaoTEF(
        transactionData.confirmationTransactionId, 
        'CONFIRMADO_MANUAL'
      );
      
      if (result) {
        addLog('success', '✅ Confirmação enviada com sucesso!');
        
        // Limpar dados de pendência
        clearSavedPendingData();
        addLog('debug', '  Dados de pendência limpos');
        
        // Atualizar estado
        setPdvState('success');
        toast.success('Transação confirmada!');
      } else {
        addLog('error', '❌ Falha ao enviar confirmação');
        toast.error('Erro ao confirmar');
      }
    } catch (e) {
      addLog('error', `❌ Erro na confirmação: ${e}`);
      setPdvState('error');
      toast.error('Erro ao confirmar transação');
    }
  }, [transactionData, addLog]);

  // ═══════════════════════════════════════════════════════════════════════════
  // DESFAZER TRANSAÇÃO (PASSO 34)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const undoTransaction = useCallback(async () => {
    addLog('info', '════════════════════════════════════════════════════════');
    addLog('info', '║          🔄 DESFAZENDO TRANSAÇÃO (PASSO 34)           ║');
    addLog('info', '════════════════════════════════════════════════════════');
    addLog('info', `  Status: DESFEITO_MANUAL`);
    
    if (transactionData?.pendingData) {
      addLog('debug', `  providerName: ${transactionData.pendingData.providerName}`);
      addLog('debug', `  merchantId: ${transactionData.pendingData.merchantId}`);
      addLog('debug', `  localNsu: ${transactionData.pendingData.localNsu}`);
      addLog('debug', `  transactionNsu: ${transactionData.pendingData.transactionNsu}`);
      addLog('debug', `  hostNsu: ${transactionData.pendingData.hostNsu}`);
    }
    
    setPdvState('confirming');
    
    try {
      const result = resolverPendenciaAndroid(
        'desfazer',
        transactionData?.confirmationTransactionId,
        transactionData?.pendingData as Record<string, unknown> | undefined
      );
      
      if (result) {
        addLog('success', '✅ Comando de desfazimento enviado!');
        
        // Limpar dados de pendência
        limparPendingDataCompleto();
        addLog('debug', '  Todos os dados de pendência limpos');
        
        // Aguardar um pouco e verificar se resolveu
        addLog('info', '  Aguardando confirmação do PayGo...');
        
        setTimeout(async () => {
          await checkPendingTransactions();
          
          // Se não há mais pendência, sucesso
          const stillPending = hasPendingTransactionAndroid();
          if (!stillPending) {
            addLog('success', '✅ Pendência resolvida com sucesso!');
            setPdvState('success');
            toast.success('Pendência resolvida!');
          } else {
            addLog('warning', '⚠️ Ainda pode haver pendência - verifique');
          }
        }, 2000);
        
      } else {
        addLog('error', '❌ Falha ao enviar desfazimento');
        toast.error('Erro ao desfazer');
      }
    } catch (e) {
      addLog('error', `❌ Erro no desfazimento: ${e}`);
      setPdvState('pending');
      toast.error('Erro ao desfazer transação');
    }
  }, [transactionData, addLog, checkPendingTransactions]);

  // ═══════════════════════════════════════════════════════════════════════════
  // MENU ADMINISTRATIVO
  // ═══════════════════════════════════════════════════════════════════════════
  
  const openAdminMenu = useCallback(async () => {
    addLog('info', '════════════════════════════════════════════════════════');
    addLog('info', '║          🔧 ABRINDO MENU ADMINISTRATIVO               ║');
    addLog('info', '════════════════════════════════════════════════════════');
    
    try {
      const result = await iniciarAdministrativaAndroid();
      if (result) {
        addLog('success', '✅ Menu administrativo aberto');
        addLog('info', '   Use o menu para resolver pendências manualmente');
      } else {
        addLog('error', '❌ Não foi possível abrir menu administrativo');
        addLog('warning', '   Pode ser necessário atualizar o APK');
      }
    } catch (e) {
      addLog('error', `Erro: ${e}`);
    }
  }, [addLog]);

  // ═══════════════════════════════════════════════════════════════════════════
  // VENDA MICRO (FORÇA RESOLUÇÃO)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const forceMicroTransaction = useCallback(() => {
    addLog('info', '════════════════════════════════════════════════════════');
    addLog('info', '║       💰 INICIANDO MICRO-TRANSAÇÃO R$ 0,01            ║');
    addLog('info', '║       Esta operação força o PayGo a resolver          ║');
    addLog('info', '║       pendências automaticamente                      ║');
    addLog('info', '════════════════════════════════════════════════════════');
    
    setAmount('1');
    setPaymentMethod('debito');
  }, [addLog]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RESET PARA NOVA TRANSAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  
  const resetForNewTransaction = useCallback(() => {
    setAmount('');
    setTransactionData(null);
    setPdvState('idle');
    addLog('info', '🔄 PDV pronto para nova transação');
  }, [addLog]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS DE INPUT
  // ═══════════════════════════════════════════════════════════════════════════
  
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

  // ═══════════════════════════════════════════════════════════════════════════
  // VALORES FORMATADOS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const formattedAmount = (parseInt(amount || '0') / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const isInputDisabled = pdvState === 'processing' || pdvState === 'confirming' || pdvState === 'checking';
  const isPayDisabled = !amount || parseInt(amount) <= 0 || isInputDisabled || pdvState === 'pending' || pdvState === 'approved';

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col">
      {/* ═══════════════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════════════ */}
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
        
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">PDV Homologação TEF</h1>
          <Badge variant="outline" className="text-xs">v2.0</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status de Conexão */}
          <Badge 
            variant={isPinpadConnected ? 'default' : 'destructive'}
            className="text-xs"
          >
            {isPinpadConnected ? (
              <><Wifi className="h-3 w-3 mr-1" /> Pinpad</>
            ) : (
              <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
            )}
          </Badge>
          
          <Badge variant={isAndroid ? 'default' : 'secondary'} className="text-xs">
            {isAndroid ? '📱 Android' : '🌐 Web'}
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDebugInfo(!showDebugInfo)}
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ═══════════════════════════════════════════════════════════════════════════
            LEFT PANEL - INPUT & ACTIONS
        ═══════════════════════════════════════════════════════════════════════════ */}
        <div className="w-1/2 p-4 flex flex-col gap-3 border-r border-gray-700 overflow-y-auto">
          
          {/* ═══════════════════════════════════════════════════════════════════════════
              STATUS BANNERS
          ═══════════════════════════════════════════════════════════════════════════ */}
          
          {/* Banner: Pendência Detectada */}
          {pdvState === 'pending' && (
            <Card className="bg-amber-900/60 border-amber-500 animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-10 w-10 text-amber-400" />
                  <div className="flex-1">
                    <p className="font-bold text-amber-300 text-lg">⚠️ PENDÊNCIA DETECTADA</p>
                    <p className="text-amber-200/80 text-sm">
                      Existe uma transação pendente. Resolva antes de continuar.
                    </p>
                    {transactionData?.confirmationTransactionId && (
                      <p className="text-xs text-amber-200/60 mt-1 font-mono">
                        ID: {transactionData.confirmationTransactionId.substring(0, 40)}...
                      </p>
                    )}
                  </div>
                </div>
                
                <Separator className="my-3 bg-amber-700" />
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={confirmTransaction}
                    className="bg-green-600 hover:bg-green-700 h-12"
                    disabled={!transactionData?.confirmationTransactionId}
                  >
                    <Check className="h-5 w-5 mr-2" />
                    CONFIRMAR
                  </Button>
                  <Button
                    onClick={undoTransaction}
                    className="bg-red-600 hover:bg-red-700 h-12"
                  >
                    <Undo2 className="h-5 w-5 mr-2" />
                    DESFAZER
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openAdminMenu}
                    className="border-amber-500 text-amber-300"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Menu Admin
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={forceMicroTransaction}
                    className="border-amber-500 text-amber-300"
                  >
                    💰 Venda R$ 0,01
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Banner: Transação Aprovada - Aguardando Confirmação */}
          {pdvState === 'approved' && transactionData && (
            <Card className="bg-blue-900/60 border-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-10 w-10 text-blue-400" />
                  <div className="flex-1">
                    <p className="font-bold text-blue-300 text-lg">✅ TRANSAÇÃO APROVADA</p>
                    <p className="text-blue-200/80 text-sm">
                      Confirme para finalizar (Passo 33)
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mt-3 bg-blue-950/50 p-2 rounded">
                  <div>
                    <span className="text-blue-400">NSU:</span>
                    <span className="ml-2 font-mono">{transactionData.nsu || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-blue-400">Autorização:</span>
                    <span className="ml-2 font-mono">{transactionData.autorizacao || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-blue-400">Bandeira:</span>
                    <span className="ml-2">{transactionData.bandeira || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-blue-400">Valor:</span>
                    <span className="ml-2">{transactionData.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}</span>
                  </div>
                </div>
                
                <Separator className="my-3 bg-blue-700" />
                
                <div className="flex gap-2">
                  <Button
                    onClick={confirmTransaction}
                    className="flex-1 bg-green-600 hover:bg-green-700 h-12"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    CONFIRMAR (CNF)
                  </Button>
                  <Button
                    onClick={undoTransaction}
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-900/30"
                  >
                    <Undo2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Banner: Sucesso */}
          {pdvState === 'success' && (
            <Card className="bg-green-900/60 border-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="h-10 w-10 text-green-400" />
                  <div>
                    <p className="font-bold text-green-300 text-lg">✅ OPERAÇÃO CONCLUÍDA</p>
                    <p className="text-green-200/80 text-sm">
                      {transactionData?.status === 'aprovado' ? 'Transação finalizada com sucesso' : 'Pendência resolvida'}
                    </p>
                  </div>
                </div>
                <Button onClick={resetForNewTransaction} className="w-full bg-green-700 hover:bg-green-800">
                  Nova Transação
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Banner: Erro */}
          {pdvState === 'error' && (
            <Card className="bg-red-900/60 border-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <XCircle className="h-10 w-10 text-red-400" />
                  <div>
                    <p className="font-bold text-red-300 text-lg">❌ ERRO</p>
                    <p className="text-red-200/80 text-sm">{transactionData?.mensagem || 'Erro desconhecido'}</p>
                  </div>
                </div>
                <Button onClick={resetForNewTransaction} variant="outline" className="w-full border-red-500">
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Banner: Processando */}
          {(pdvState === 'processing' || pdvState === 'confirming' || pdvState === 'checking') && (
            <Card className="bg-gray-800/80 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                  <div className="text-center">
                    <p className="font-bold text-gray-200">
                      {pdvState === 'processing' && '⏳ Processando pagamento...'}
                      {pdvState === 'confirming' && '📤 Enviando confirmação...'}
                      {pdvState === 'checking' && '🔍 Verificando pendências...'}
                    </p>
                    <p className="text-gray-400 text-sm">Aguarde...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════════
              DISPLAY DE VALOR
          ═══════════════════════════════════════════════════════════════════════════ */}
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

          {/* ═══════════════════════════════════════════════════════════════════════════
              MÉTODO DE PAGAMENTO
          ═══════════════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={paymentMethod === 'debito' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('debito')}
              className={paymentMethod === 'debito' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              disabled={isInputDisabled}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Débito
            </Button>
            <Button
              variant={paymentMethod === 'credito' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('credito')}
              className={paymentMethod === 'credito' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              disabled={isInputDisabled}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Crédito
            </Button>
            <Button
              variant={paymentMethod === 'pix' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('pix')}
              className={paymentMethod === 'pix' ? 'bg-green-600 hover:bg-green-700' : ''}
              disabled={isInputDisabled}
            >
              <QrCode className="h-4 w-4 mr-1" />
              PIX
            </Button>
          </div>

          {/* Parcelas (só para crédito) */}
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
                    disabled={isInputDisabled}
                  >
                    {n}x
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════════
              TECLADO NUMÉRICO
          ═══════════════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'].map(key => (
              <Button
                key={key}
                variant="outline"
                className="h-12 text-xl font-mono"
                onClick={() => {
                  if (key === '⌫') handleBackspace();
                  else handleDigit(key);
                }}
                disabled={isInputDisabled}
              >
                {key}
              </Button>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════════
              BOTÕES DE AÇÃO
          ═══════════════════════════════════════════════════════════════════════════ */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isInputDisabled}
              className="flex-1"
            >
              Limpar
            </Button>
            <Button
              onClick={executePayment}
              disabled={isPayDisabled}
              className="flex-[2] bg-amber-600 hover:bg-amber-700 text-lg font-bold h-12"
            >
              {pdvState === 'processing' ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Aguarde...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  VENDER
                </>
              )}
            </Button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════════
              VALORES RÁPIDOS (HOMOLOGAÇÃO)
          ═══════════════════════════════════════════════════════════════════════════ */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs text-gray-400">⚡ Valores Rápidos - Homologação PayGo</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setAmount('100560'); setPaymentMethod('debito'); }}
                  className="text-xs h-auto py-2 border-green-700 hover:bg-green-900/30"
                  disabled={isInputDisabled}
                >
                  <div className="text-left w-full">
                    <p className="font-bold text-green-400">Passo 33</p>
                    <p className="text-gray-400">R$ 1.005,60 → Confirmar</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setAmount('100561'); setPaymentMethod('debito'); }}
                  className="text-xs h-auto py-2 border-amber-700 hover:bg-amber-900/30"
                  disabled={isInputDisabled}
                >
                  <div className="text-left w-full">
                    <p className="font-bold text-amber-400">Passo 34</p>
                    <p className="text-gray-400">R$ 1.005,61 → Desfazer</p>
                  </div>
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setAmount('5000'); setPaymentMethod('credito'); }}
                  className="text-xs"
                  disabled={isInputDisabled}
                >
                  R$ 50,00
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setAmount('10000'); setPaymentMethod('debito'); }}
                  className="text-xs"
                  disabled={isInputDisabled}
                >
                  R$ 100,00
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={forceMicroTransaction}
                  className="text-xs border-orange-700"
                  disabled={isInputDisabled}
                >
                  R$ 0,01 💰
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════
            RIGHT PANEL - LOGS
        ═══════════════════════════════════════════════════════════════════════════ */}
        <div className="w-1/2 flex flex-col">
          {/* Header Logs */}
          <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="font-semibold text-sm">Logs em Tempo Real</span>
              <Badge variant="outline" className="text-xs">
                {logs.length}
              </Badge>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={checkPendingTransactions} title="Verificar pendências">
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={copyLogs} title="Copiar logs">
                <Copy className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={downloadLogs} title="Download logs">
                <Download className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={clearLogs} title="Limpar logs">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Área de Logs */}
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
                    log.type === 'debug' ? 'text-purple-400' :
                    'text-gray-400'
                  }`}
                >
                  <span className="text-gray-600 shrink-0">{log.time}</span>
                  <span className="break-all whitespace-pre-wrap">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </ScrollArea>

          {/* ═══════════════════════════════════════════════════════════════════════════
              DOCUMENTAÇÃO PASSOS 33/34
          ═══════════════════════════════════════════════════════════════════════════ */}
          <Card className="m-2 bg-gray-800/50 border-gray-700">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs text-gray-400">📋 Roteiro PayGo - Homologação</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2 text-xs">
              <div className="bg-green-900/30 border border-green-700/50 rounded p-2">
                <p className="font-bold text-green-400">✅ PASSO 33 - Venda R$ 1.005,60</p>
                <ol className="text-green-300/80 list-decimal list-inside mt-1 space-y-0.5">
                  <li>Selecione valor 100560 (ou digite)</li>
                  <li>Clique VENDER → Transação aprovada</li>
                  <li>Clique CONFIRMAR (envia CNF ao PayGo)</li>
                </ol>
              </div>
              <div className="bg-amber-900/30 border border-amber-700/50 rounded p-2">
                <p className="font-bold text-amber-400">⚠️ PASSO 34 - Venda R$ 1.005,61</p>
                <ol className="text-amber-300/80 list-decimal list-inside mt-1 space-y-0.5">
                  <li>Selecione valor 100561 (ou digite)</li>
                  <li>Clique VENDER → PayGo retorna erro -2599</li>
                  <li>Clique DESFAZER para resolver pendência</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
