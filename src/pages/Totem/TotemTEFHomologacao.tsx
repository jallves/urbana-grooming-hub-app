import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  X,
  Calendar,
  Clock,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  Hash,
  Check,
  Printer,
  Receipt,
  Database,
  RotateCcw,
  AlertTriangle,
  Undo2,
  CheckSquare
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import {
  isAndroidTEFAvailable,
  getLogsAndroid,
  setModoDebug,
  limparLogsAndroid,
  confirmarTransacaoTEF,
  cancelarVendaAndroid,
  resolverPendenciaAndroid,
  reimprimirUltimaTransacaoAndroid,
  type TEFResultado
} from '@/lib/tef/tefAndroidBridge';
import { toast } from 'sonner';
import { formatBrazilDate, getTodayInBrazil } from '@/lib/utils/dateUtils';
import {
  loadLogStorage,
  saveLogStorage,
  addAndroidLogs,
  getAvailableDates,
  getLogsByDate,
  getAllLogs,
  clearAllLogs,
  clearLogsByDate,
  migrateOldLogs,
  getStorageStats,
  formatDateForDisplay,
  type StoredTransactionLog,
  type StoredAndroidLog
} from '@/lib/tef/tefLogStorage';

type PaymentMethod = 'debito' | 'credito' | 'pix';
type FinancingType = 'avista' | 'parcelado_loja' | 'parcelado_emissor';
type Authorizer = 'DEMO' | 'REDE' | 'PIX_C6_BANK';

// Valores dos testes obrigatórios PayGo (Android)
const PAYGO_TEST_VALUES: Array<{
  passo: string;
  valor: number;
  desc: string;
  resultado: string;
  metodo: PaymentMethod;
  financiamento?: FinancingType;
  parcelas?: number;
  autorizador?: Authorizer;
}> = [
  { passo: '02', valor: 10000000, desc: 'Venda máxima R$100k', resultado: 'Aprovada', metodo: 'credito' },
  { passo: '03', valor: 5000, desc: 'Crédito à vista', resultado: 'Aprovada', metodo: 'credito', financiamento: 'avista', autorizador: 'DEMO' },
  { passo: '04', valor: 100001, desc: 'Venda negada', resultado: 'Negada', metodo: 'credito', autorizador: 'DEMO' },
  { passo: '05', valor: 5000, desc: 'Cancelar na seleção de rede', resultado: 'Cancelada', metodo: 'credito' },
  { passo: '06', valor: 5000, desc: 'Crédito', resultado: 'Aprovada', metodo: 'credito', autorizador: 'DEMO' },
  { passo: '07', valor: 5000, desc: 'Débito', resultado: 'Aprovada', metodo: 'debito', autorizador: 'DEMO' },
  { passo: '08', valor: 10000, desc: 'Parcelado 99x', resultado: 'Aprovada', metodo: 'credito', financiamento: 'parcelado_loja', parcelas: 99, autorizador: 'DEMO' },
  { passo: '11', valor: 5000, desc: 'PIX QRCode', resultado: 'Aprovada', metodo: 'pix', autorizador: 'PIX_C6_BANK' },
  { passo: '19', valor: 1234567, desc: 'Venda p/ cancelar', resultado: 'Aprovada', metodo: 'credito', autorizador: 'DEMO' },
  { passo: '30', valor: 100300, desc: 'Msg máxima', resultado: 'Aprovada', metodo: 'credito', autorizador: 'DEMO' },
  { passo: '33', valor: 100560, desc: 'Pendente #1 (confirmar)', resultado: 'Aprovada+Confirmada', metodo: 'credito', autorizador: 'DEMO' },
  { passo: '34', valor: 100561, desc: 'Pendente #2 (DESFAZER!)', resultado: 'Aprovada+Desfeita', metodo: 'credito', autorizador: 'DEMO' },
  { passo: '35', valor: 101200, desc: 'Confirmação', resultado: 'Aprovada', metodo: 'credito', autorizador: 'DEMO' },
  { passo: '37', valor: 101100, desc: 'Desfazimento', resultado: 'Desfeita', metodo: 'credito', autorizador: 'DEMO' },
  { passo: '39', valor: 101300, desc: 'Falha mercadoria', resultado: 'Aprovada', metodo: 'credito', autorizador: 'DEMO' },
  { passo: '45', valor: 102000, desc: 'Contactless', resultado: 'Aprovada', metodo: 'credito', autorizador: 'DEMO' },
  { passo: '46', valor: 99900, desc: 'Contactless s/senha', resultado: 'Aprovada', metodo: 'credito', autorizador: 'DEMO' },
  { passo: '53', valor: 50000, desc: 'PIX R$500', resultado: 'Aprovada', metodo: 'pix', autorizador: 'PIX_C6_BANK' },
  { passo: '54', valor: 50000, desc: 'Cancelar PIX (Passo 53)', resultado: 'Cancelamento Negado', metodo: 'pix', autorizador: 'PIX_C6_BANK' },
];

// Usar tipos do storage
type TransactionLog = StoredTransactionLog;

interface DailyLogGroup {
  date: string;
  displayDate: string;
  transactionLogs: StoredTransactionLog[];
  androidLogs: StoredAndroidLog[];
}

export default function TotemTEFHomologacao() {
  const navigate = useNavigate();
  const location = useLocation();
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('debito');
  const [financingType, setFinancingType] = useState<FinancingType>('avista');
  const [authorizer, setAuthorizer] = useState<Authorizer>('DEMO');
  const [installments, setInstallments] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTestValues, setShowTestValues] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estado para modo de cancelamento (Passo 21)
  const [showCancelMode, setShowCancelMode] = useState(false);
  const [selectedCancelTransaction, setSelectedCancelTransaction] = useState<{
    nsu: string;
    autorizacao: string;
    valor: number;
    bandeira?: string;
    passoTeste?: string;
  } | null>(null);
  
  // Carregar logs do storage persistente na inicialização
  const [transactionLogs, setTransactionLogs] = useState<StoredTransactionLog[]>(() => {
    const storage = loadLogStorage();
    return storage.transactionLogs;
  });
  const [androidLogs, setAndroidLogs] = useState<StoredAndroidLog[]>(() => {
    const storage = loadLogStorage();
    return storage.androidLogs;
  });
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(true);
  const [activeTab, setActiveTab] = useState<'pdv' | 'logs' | 'pendencias'>('pdv');
  const [resolvingPending, setResolvingPending] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayInBrazil());
  const [storageStats, setStorageStats] = useState(() => getStorageStats());
  const transactionLogsEndRef = useRef<HTMLDivElement>(null);
  const androidLogsScrollRef = useRef<HTMLDivElement>(null);
  const [isAndroidLogsAtBottom, setIsAndroidLogsAtBottom] = useState(true);
  const [copiedNsuId, setCopiedNsuId] = useState<string | null>(null);
  
  // Migrar logs antigos na primeira execução
  useEffect(() => {
    migrateOldLogs();
    // Recarregar após migração
    const storage = loadLogStorage();
    setTransactionLogs(storage.transactionLogs);
    setAndroidLogs(storage.androidLogs);
    setStorageStats(getStorageStats());
  }, []);
  
  // Salvar logs no storage sempre que mudarem
  useEffect(() => {
    saveLogStorage({
      transactionLogs,
      androidLogs,
      lastCleanup: new Date().toISOString()
    });
    setStorageStats(getStorageStats());
  }, [transactionLogs, androidLogs]);


  // Permite abrir direto na aba Logs quando vier do Diagnóstico
  useEffect(() => {
    const state = location.state as { tab?: 'pdv' | 'logs' | 'pendencias' } | null;
    if (state?.tab) {
      setActiveTab(state.tab);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Dados da última transação para confirmação manual
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    confirmationId: string;
    nsu: string;
    autorizacao: string;
  } | null>(null);

  // Passos 33/34: armazenar a confirmação do Passo 33 para resolver no Passo 34
  const [passo33PendingConfirmationId, setPasso33PendingConfirmationId] = useState<string | null>(null);

  // Modal de resultado da transação
  const [transactionResult, setTransactionResult] = useState<{
    show: boolean;
    status: 'aprovado' | 'negado' | 'cancelado' | 'erro';
    valor: number;
    nsu: string;
    autorizacao: string;
    bandeira: string;
    mensagem: string;
    comprovanteCliente?: string;
    comprovanteLojista?: string;
    passoTeste?: string;
  } | null>(null);

  // Adicionar log com data - DEFINIDO ANTES do useTEFAndroid para estar disponível nos callbacks
  const addLog = useCallback((type: TransactionLog['type'], message: string, data?: Record<string, unknown>) => {
    const now = new Date();
    const log: TransactionLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
      type,
      message,
      data
    };
    setTransactionLogs(prev => [...prev, log]);
    console.log('[PDV LOG]', type, message, data);
  }, []);

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
      
      // Encontrar passo do teste pelo valor
      const valorCentavos = resultado.valor ? Math.round(resultado.valor * 100) : parseInt(amount, 10);
      const testePasso = PAYGO_TEST_VALUES.find(t => t.valor === valorCentavos);
      
      // PASSOS 33 e 34: Lógica especial de transação pendente
      // Interpretação do roteiro PayGo:
      // - Passo 33 (R$1005,60): NÃO confirmar -> deixa a transação pendente
      // - Passo 34 (R$1005,61): realizar 2ª venda e enviar DESFAZIMENTO MANUAL da pendência (Passo 33)
      const isPasso33 = valorCentavos === 100560;
      const isPasso34 = valorCentavos === 100561;
      
      // FALLBACK: Usar NSU como confirmationId se não vier do PayGo
      // Isso é comum no PayGo - o NSU pode ser usado como identificador da transação
      const confirmationId = resultado.confirmationTransactionId || resultado.nsu || '';

      addLog('success', `✅ TRANSAÇÃO APROVADA`, {
        nsu: resultado.nsu,
        autorizacao: resultado.autorizacao,
        bandeira: resultado.bandeira,
        valor: resultado.valor,
        passoTeste: testePasso?.passo,
        requiresConfirmation: resultado.requiresConfirmation,
        confirmationIdOriginal: resultado.confirmationTransactionId || 'NÃO RETORNADO PELO PAYGO',
        confirmationIdUsado: confirmationId,
        isPasso33,
        isPasso34
      });
      
      // AVISO se confirmationId não veio do PayGo
      if (!resultado.confirmationTransactionId && resultado.nsu) {
        addLog('warning', '⚠️ PayGoService.kt NÃO retornou confirmationTransactionId - usando NSU como fallback', {
          nsu: resultado.nsu,
          acao: 'O PayGoService.kt deve incluir confirmationTransactionId no resultado'
        });
      }

      // Mostrar modal de resultado
      setTransactionResult({
        show: true,
        status: 'aprovado',
        valor: resultado.valor || (parseInt(amount, 10) / 100),
        nsu: resultado.nsu || '',
        autorizacao: resultado.autorizacao || '',
        bandeira: resultado.bandeira || '',
        mensagem: resultado.mensagem || 'Transação aprovada com sucesso',
        comprovanteCliente: resultado.comprovanteCliente,
        comprovanteLojista: resultado.comprovanteLojista,
        passoTeste: testePasso?.passo
      });

      // LÓGICA ESPECIAL PARA PASSOS 33 e 34:
      if (isPasso33) {
        // Passo 33: guardar o confirmationId (NSU como fallback) e NÃO confirmar (gera pendência)
        if (confirmationId) {
          setPasso33PendingConfirmationId(confirmationId);
          addLog('warning', '📋 PASSO 33: Transação ficará PENDENTE (sem confirmação) para executar o Passo 34', {
            confirmationIdArmazenado: confirmationId
          });
          toast.warning('Passo 33: transação ficará pendente. Agora execute o Passo 34!');
        } else {
          addLog('error', '❌ PASSO 33: Não foi possível armazenar confirmationId - PayGo não retornou NSU nem confirmationTransactionId');
          toast.error('Passo 33: Erro - Sem ID para confirmar. Verifique PayGoService.kt');
        }
      } else if (isPasso34) {
        // Passo 34: primeiro, resolver a pendência do Passo 33 com DESFAZIMENTO MANUAL
        if (passo33PendingConfirmationId) {
          addLog('warning', '📋 PASSO 34: Enviando DESFAZIMENTO MANUAL da pendência (Passo 33)...', {
            confirmationId: passo33PendingConfirmationId
          });
          const undone = confirmarTransacaoTEF(passo33PendingConfirmationId, 'DESFEITO_MANUAL');
          addLog('warning', undone ? '✅ Pendência (Passo 33): DESFAZIMENTO MANUAL enviado' : '❌ Falha ao desfazer pendência (Passo 33)');
          setPasso33PendingConfirmationId(null);
        } else {
          addLog('warning', '⚠️ PASSO 34: Não encontrei pendência do Passo 33 para desfazer (confirmationId ausente)');
        }

        // Depois, confirmar a própria transação do Passo 34 (para não bloquear próximas operações)
        if (confirmationId) {
          addLog('info', '📋 PASSO 34: Confirmando a 2ª venda para finalizar o fluxo...');
          const confirmed = confirmarTransacaoTEF(confirmationId, 'CONFIRMADO_MANUAL');
          addLog('info', confirmed ? '✅ Passo 34: Confirmação enviada' : '❌ Erro na confirmação do Passo 34');
        }

        toast.info('Passo 34: pendência desfeita e venda finalizada. Teste deve liberar novas operações.');
      } else if (resultado.requiresConfirmation && confirmationId) {
        // Outros casos que requerem confirmação manual
        setPendingConfirmation({
          confirmationId: confirmationId,
          nsu: resultado.nsu || '',
          autorizacao: resultado.autorizacao || ''
        });
        addLog('warning', '⚠️ Transação aguardando confirmação manual');
      } else {
        // Confirmação automática para demais transações
        if (confirmationId) {
          const confirmed = confirmarTransacaoTEF(confirmationId, 'CONFIRMADO_AUTOMATICO');
          addLog('info', confirmed ? '✅ Confirmação automática enviada' : '❌ Erro na confirmação automática');
        }
      }
      
      refreshAndroidLogs();
    },
    onError: (erro, resultadoCompleto) => {
      setIsProcessing(false);
      
      const valorCentavos = parseInt(amount, 10);
      const testePasso = PAYGO_TEST_VALUES.find(t => t.valor === valorCentavos);
      const resultadoEsperado = testePasso?.resultado || 'N/A';
      const timestamp = new Date().toISOString();
      
      // PASSO 34: Verificar se é a transação de R$ 1.005,61 que deve ser negada
      const isPasso34 = valorCentavos === 100561;
      
      // Detectar se é cancelamento (rede não informada, operação cancelada, etc.)
      const erroLower = erro.toLowerCase();
      const isCancelamento = erroLower.includes('cancelad') || 
                             erroLower.includes('rede não informada') ||
                             erroLower.includes('operação cancelada') ||
                             erroLower.includes('esc') ||
                             erroLower.includes('abortado');
      
      if (isCancelamento) {
        // Tratar como OPERAÇÃO CANCELADA (Passo 05 - rede não informada)
        addLog('warning', `⚠️ OPERAÇÃO CANCELADA`, {
          passoTeste: testePasso?.passo,
          resultadoEsperado,
          valor: valorCentavos / 100,
          motivo: erro,
          timestamp,
          observacao: 'Transação não realizada - rede não informada ou operação cancelada pelo usuário'
        });
        
        setTransactionResult({
          show: true,
          status: 'cancelado',
          valor: parseInt(amount, 10) / 100,
          nsu: 'N/A (cancelado)',
          autorizacao: 'N/A (cancelado)',
          bandeira: '',
          mensagem: erro.toUpperCase().includes('CANCELAD') ? erro : 'OPERAÇÃO CANCELADA - Rede não informada',
          passoTeste: testePasso?.passo
        });
      } else {
        // Tratar como TRANSAÇÃO NEGADA (erro do autorizador)
        addLog('error', `❌ TRANSAÇÃO NEGADA`, {
          passoTeste: testePasso?.passo,
          resultadoEsperado,
          valor: valorCentavos / 100,
          motivoNegacao: erro,
          timestamp,
          observacao: 'Transação negada pelo autorizador - não gera NSU ou código de autorização',
          isPasso34,
          resultadoCompleto
        });
        
        // PASSO 34: Se for R$ 1.005,61 e foi negado, verificar e tratar pendência conforme documentação
        if (isPasso34) {
          // 1. Logar que a transação foi negada (já logado acima)
          // 2. Verificar se existe transação pendente (conforme documentação PayGo)
          addLog('info', '🔍 [PASSO 34] Verificando se existe transação pendente (saidaTransacao.existeTransacaoPendente())...');
          
          // Dados da pendência podem vir do resultado ou do estado salvo do Passo 33
          const pendingId = resultadoCompleto?.confirmationTransactionId || 
                           passo33PendingConfirmationId;
          const existeTransacaoPendente = !!pendingId;
          
          addLog('info', `🔍 [PASSO 34] existeTransacaoPendente: ${existeTransacaoPendente}`, {
            confirmationIdFromResult: resultadoCompleto?.confirmationTransactionId || 'N/A',
            confirmationIdFromPasso33: passo33PendingConfirmationId || 'N/A',
            pendingIdUsado: pendingId || 'NENHUM'
          });
          
          if (existeTransacaoPendente && pendingId) {
            // 3. Obter dados da transação pendente
            addLog('info', '📋 [PASSO 34] Obtendo dados da transação pendente (saidaTransacao.obtemDadosTransacaoPendente())...');
            addLog('info', '📋 [PASSO 34] Dados obtidos:', { confirmationId: pendingId });
            
            // 4. Resolver a pendência com DESFEITO_MANUAL (conforme roteiro PayGo)
            addLog('warning', '🔄 [PASSO 34] Criando confirmação: confirmacao.informaStatusTransacao(StatusTransacao.DESFEITO_MANUAL)');
            addLog('warning', '🔄 [PASSO 34] Chamando PayGo: transacao.resolvePendencia(dadosPendencia, confirmacao)...');
            
            // Chamar PayGo via resolverPendenciaAndroid passando o confirmationId
            const success = resolverPendenciaAndroid('desfazer', pendingId);
            
            if (success) {
              addLog('success', '✅ [PASSO 34] PayGo chamado com sucesso! DESFEITO_MANUAL enviado', { 
                confirmationId: pendingId,
                statusEnviado: 'DESFEITO_MANUAL',
                metodo: 'window.TEF.confirmarTransacao()'
              });
              toast.success('✅ PASSO 34 COMPLETO!', {
                description: 'PayGo chamado - DESFEITO_MANUAL enviado',
                duration: 5000
              });
              setPasso33PendingConfirmationId(null);
            } else {
              addLog('error', '❌ [PASSO 34] Erro ao chamar PayGo para DESFEITO_MANUAL');
              toast.error('Erro ao chamar PayGo');
            }
          } else {
            // Não há confirmationId - A transação pendente existe no PayGo mas não temos o ID
            // Isso acontece quando: Passo 33 falhou ou a pendência é de outra sessão
            addLog('warning', '⚠️ [PASSO 34] Nenhum confirmationId encontrado.');
            addLog('info', '📋 [PASSO 34] DIAGNÓSTICO:', {
              motivo: 'O Passo 33 provavelmente também falhou com erro de pendência',
              solucao: 'O SDK Android precisa buscar a pendência automaticamente via obtemDadosTransacaoPendente()',
              codigoErro: resultadoCompleto?.codigoResposta || '-2599'
            });
            
            addLog('warning', '🔄 [PASSO 34] Chamando PayGo: resolverPendenciaAndroid(desfazer)...');
            addLog('info', '📋 [PASSO 34] O app Android deve implementar:');
            addLog('info', '   1. existeTransacaoPendente() -> true');
            addLog('info', '   2. obtemDadosTransacaoPendente() -> dados');
            addLog('info', '   3. resolvePendencia(dados, DESFEITO_MANUAL)');
            
            const success = resolverPendenciaAndroid('desfazer');
            if (success) {
              addLog('success', '✅ [PASSO 34] Chamada enviada ao PayGo');
              addLog('warning', '⚠️ [PASSO 34] Se a pendência persistir, verifique se o app Android implementa a busca automática de pendências');
              toast.info('PASSO 34: Comando enviado ao PayGo', {
                description: 'Verifique os logs do Android para confirmar resolução',
                duration: 5000
              });
            } else {
              addLog('error', '❌ [PASSO 34] Erro ao chamar PayGo');
              toast.error('Erro ao chamar PayGo');
            }
          }
        }
        
        setTransactionResult({
          show: true,
          status: 'negado',
          valor: parseInt(amount, 10) / 100,
          nsu: 'N/A (negado)',
          autorizacao: 'N/A (negado)',
          bandeira: '',
          mensagem: isPasso34 
            ? `${erro} - DESFEITO_MANUAL ENVIADO (Passo 34)` 
            : erro,
          passoTeste: testePasso?.passo
        });
      }
      
      refreshAndroidLogs();
    },
    onCancelled: () => {
      setIsProcessing(false);
      
      const valorCentavos = parseInt(amount, 10);
      const testePasso = PAYGO_TEST_VALUES.find(t => t.valor === valorCentavos);
      
      addLog('warning', '⚠️ Transação cancelada pelo usuário', {
        passoTeste: testePasso?.passo
      });
      
      // Mostrar modal de resultado
      setTransactionResult({
        show: true,
        status: 'cancelado',
        valor: parseInt(amount, 10) / 100,
        nsu: '',
        autorizacao: '',
        bandeira: '',
        mensagem: 'Transação cancelada pelo usuário',
        passoTeste: testePasso?.passo
      });
      
      refreshAndroidLogs();
    }
  });

  // Função para resolver pendência - PASSO 34: DESFAZER
  const handleResolverPendenciaDesfazer = useCallback(async () => {
    console.log('[PDV] Iniciando DESFAZIMENTO de pendência (Passo 34)');
    setResolvingPending(true);
    
    try {
      if (!isAndroidAvailable) {
        toast.error('TEF Android não disponível');
        return;
      }

      // Se temos o confirmationId do passo 33, usar confirmarTransacaoTEF
      if (passo33PendingConfirmationId) {
        console.log('[PDV] Usando confirmarTransacaoTEF com ID:', passo33PendingConfirmationId);
        const success = confirmarTransacaoTEF(passo33PendingConfirmationId, 'DESFEITO_MANUAL');
        
        if (success) {
          toast.success('✅ DESFEITO_MANUAL enviado!', {
            description: 'Passo 34 concluído - Pendência resolvida',
            duration: 5000
          });
          setPasso33PendingConfirmationId(null);
          
          // Adicionar log
          addLog('warning', '[PASSO 34] DESFEITO_MANUAL enviado com sucesso', { 
            confirmationId: passo33PendingConfirmationId, 
            action: 'DESFEITO_MANUAL' 
          });
        } else {
          toast.error('Erro ao enviar DESFEITO_MANUAL');
        }
      } else {
        // Usar resolverPendenciaAndroid como fallback
        console.log('[PDV] Usando resolverPendenciaAndroid (desfazer)');
        const success = resolverPendenciaAndroid('desfazer');
        
        if (success) {
          toast.success('✅ Resolução de pendência (DESFAZER) enviada!', {
            description: 'Aguardando resposta do PayGo...',
            duration: 5000
          });
          addLog('warning', 'Resolução de pendência (DESFAZER) enviada via PayGo');
        } else {
          toast.error('Erro ao resolver pendência');
        }
      }
    } catch (error) {
      console.error('[PDV] Erro ao resolver pendência:', error);
      toast.error('Erro ao resolver pendência');
    } finally {
      setResolvingPending(false);
    }
  }, [isAndroidAvailable, passo33PendingConfirmationId, addLog]);

  // Função para resolver pendência - CONFIRMAR
  const handleResolverPendenciaConfirmar = useCallback(async () => {
    console.log('[PDV] Iniciando CONFIRMAÇÃO de pendência');
    setResolvingPending(true);
    
    try {
      if (!isAndroidAvailable) {
        toast.error('TEF Android não disponível');
        return;
      }

      if (passo33PendingConfirmationId) {
        console.log('[PDV] Usando confirmarTransacaoTEF com ID:', passo33PendingConfirmationId);
        const success = confirmarTransacaoTEF(passo33PendingConfirmationId, 'CONFIRMADO_MANUAL');
        
        if (success) {
          toast.success('✅ CONFIRMADO_MANUAL enviado!', {
            description: 'Pendência confirmada com sucesso',
            duration: 5000
          });
          setPasso33PendingConfirmationId(null);
          addLog('success', 'CONFIRMADO_MANUAL enviado com sucesso', { 
            confirmationId: passo33PendingConfirmationId, 
            action: 'CONFIRMADO_MANUAL' 
          });
        } else {
          toast.error('Erro ao enviar CONFIRMADO_MANUAL');
        }
      } else {
        const success = resolverPendenciaAndroid('confirmar');
        
        if (success) {
          toast.success('✅ Resolução de pendência (CONFIRMAR) enviada!', {
            duration: 5000
          });
          addLog('success', 'Resolução de pendência (CONFIRMAR) enviada via PayGo');
        } else {
          toast.error('Erro ao resolver pendência');
        }
      }
    } catch (error) {
      console.error('[PDV] Erro ao confirmar pendência:', error);
      toast.error('Erro ao confirmar pendência');
    } finally {
      setResolvingPending(false);
    }
  }, [isAndroidAvailable, passo33PendingConfirmationId, addLog]);

  // Auto-scroll
  useEffect(() => {
    if (transactionLogsEndRef.current) {
      transactionLogsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [transactionLogs]);

  // Auto-scroll Android logs somente se o usuário estiver no final
  useEffect(() => {
    const el = androidLogsScrollRef.current;
    if (!el) return;
    if (!isAndroidLogsAtBottom) return;

    // scroll imediato (sem "puxar" quando o usuário está navegando)
    el.scrollTop = el.scrollHeight;
  }, [androidLogs, isAndroidLogsAtBottom]);

  const handleAndroidLogsScroll = useCallback(() => {
    const el = androidLogsScrollRef.current;
    if (!el) return;

    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsAndroidLogsAtBottom(distanceToBottom < 12);
  }, []);

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

  const refreshAndroidLogs = useCallback(() => {
    if (isAndroidTEFAvailable()) {
      const logs = getLogsAndroid();
      const today = getTodayInBrazil();
      const now = new Date();
      
      // Formatar e persistir logs Android com data
      const formattedLogs: StoredAndroidLog[] = logs.map((log, i) => ({
        timestamp: new Date(now.getTime() + i).toISOString(),
        date: today,
        message: log
      }));
      
      // Atualizar estado local
      setAndroidLogs(prev => {
        // Manter logs de outros dias, atualizar apenas o dia atual
        const otherDays = prev.filter(l => l.date !== today);
        return [...otherDays, ...formattedLogs];
      });
    }
  }, []);

  // Agrupar logs por data
  const dailyLogGroups = useMemo((): DailyLogGroup[] => {
    const groups: Record<string, DailyLogGroup> = {};
    
    // Adicionar logs de transação
    transactionLogs.forEach(log => {
      if (!groups[log.date]) {
        groups[log.date] = {
          date: log.date,
          displayDate: formatDateForDisplay(log.date),
          transactionLogs: [],
          androidLogs: []
        };
      }
      groups[log.date].transactionLogs.push(log);
    });

    // Adicionar logs Android por data
    androidLogs.forEach(log => {
      if (!groups[log.date]) {
        groups[log.date] = {
          date: log.date,
          displayDate: formatDateForDisplay(log.date),
          transactionLogs: [],
          androidLogs: []
        };
      }
      groups[log.date].androidLogs.push(log);
    });

    // Garantir que hoje sempre apareça
    const today = getTodayInBrazil();
    if (!groups[today]) {
      groups[today] = {
        date: today,
        displayDate: formatDateForDisplay(today),
        transactionLogs: [],
        androidLogs: []
      };
    }

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactionLogs, androidLogs]);

  // Datas disponíveis
  const availableDates = useMemo(() => {
    return dailyLogGroups.map(g => g.date);
  }, [dailyLogGroups]);

  // Logs do dia selecionado
  const selectedDayLogs = useMemo(() => {
    return dailyLogGroups.find(g => g.date === selectedDate) || {
      date: selectedDate,
      displayDate: formatDateDisplay(selectedDate),
      transactionLogs: [],
      androidLogs: []
    };
  }, [dailyLogGroups, selectedDate]);

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

  // Formatar data para exibição
  function formatDateDisplay(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Hoje';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Ontem';
    }
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  }

  // Navegar entre datas
  const navigateDate = (direction: 'prev' | 'next') => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (direction === 'prev' && currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    }
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

    // Determinar parcelas baseado no tipo de financiamento
    const parcelas = selectedMethod === 'credito' && financingType !== 'avista' 
      ? installments 
      : 1;

    // Encontrar passo do teste se for um valor conhecido
    const testePasso = PAYGO_TEST_VALUES.find(t => t.valor === parseInt(amount, 10));

    addLog('transaction', `🚀 INICIANDO TRANSAÇÃO ${testePasso ? `(Passo ${testePasso.passo})` : ''}`, {
      orderId,
      valor: valorReais,
      metodo: selectedMethod,
      autorizador: authorizer,
      financiamento: financingType,
      parcelas,
      passoTeste: testePasso?.passo,
      resultadoEsperado: testePasso?.resultado
    });

    const tipo = selectedMethod === 'debito' ? 'debit' : 
                 selectedMethod === 'credito' ? 'credit' : 'pix';

    await iniciarPagamento({
      ordemId: orderId,
      valor: valorReais,
      tipo,
      parcelas
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

  // Resolver pendência no PayGo - Confirmar
  const handleResolvePendencyConfirm = () => {
    if (!isAndroidAvailable) {
      toast.error('TEF Android não disponível');
      return;
    }
    
    console.log('[TotemTEF] ═══════════════════════════════════════');
    console.log('[TotemTEF] BOTÃO CONFIRMAR PENDÊNCIA CLICADO');
    console.log('[TotemTEF] isAndroidAvailable:', isAndroidAvailable);
    console.log('[TotemTEF] ═══════════════════════════════════════');
    
    addLog('warning', '🔄 CONFIRMANDO PENDÊNCIA NO PAYGO');
    toast.info('Enviando comando de confirmação...');
    
    const resolved = resolverPendenciaAndroid('confirmar');
    console.log('[TotemTEF] resolverPendenciaAndroid retornou:', resolved);
    
    if (resolved) {
      addLog('success', '✅ Confirmação de pendência enviada');
      toast.success('Pendência confirmada no PayGo');
    } else {
      addLog('error', '❌ Erro ao confirmar pendência');
      toast.error('Erro ao confirmar pendência');
    }
    
    // Aguardar um pouco e atualizar logs
    setTimeout(() => {
      refreshAndroidLogs();
    }, 1000);
  };

  // Resolver pendência no PayGo - Desfazer
  const handleResolvePendencyUndo = () => {
    if (!isAndroidAvailable) {
      toast.error('TEF Android não disponível');
      return;
    }
    
    console.log('[TotemTEF] ═══════════════════════════════════════');
    console.log('[TotemTEF] BOTÃO DESFAZER PENDÊNCIA CLICADO');
    console.log('[TotemTEF] isAndroidAvailable:', isAndroidAvailable);
    console.log('[TotemTEF] ═══════════════════════════════════════');
    
    addLog('warning', '🔄 DESFAZENDO PENDÊNCIA NO PAYGO');
    toast.info('Enviando comando de desfazimento...');
    
    const resolved = resolverPendenciaAndroid('desfazer');
    console.log('[TotemTEF] resolverPendenciaAndroid retornou:', resolved);
    
    if (resolved) {
      addLog('success', '✅ Desfazimento de pendência enviado');
      toast.success('Pendência desfeita no PayGo');
    } else {
      addLog('error', '❌ Erro ao desfazer pendência');
      toast.error('Erro ao desfazer pendência');
    }
    
    // Aguardar um pouco e atualizar logs
    setTimeout(() => {
      refreshAndroidLogs();
    }, 1000);
  };

  // Limpar pendências via transação administrativa (R$50,00)
  const handleClearPendenciesWithTransaction = async () => {
    if (!isAndroidAvailable || !isPinpadConnected) {
      toast.error('TEF ou Pinpad não disponível');
      return;
    }

    console.log('[TotemTEF] ═══════════════════════════════════════');
    console.log('[TotemTEF] LIMPANDO PENDÊNCIAS VIA TRANSAÇÃO');
    console.log('[TotemTEF] ═══════════════════════════════════════');

    addLog('warning', '🧹 LIMPANDO PENDÊNCIAS - Iniciando transação administrativa');
    toast.info('Iniciando limpeza de pendências... Aguarde o pinpad.');

    // IMPORTANTE: se o PayGo ficar em estado pendente e não retornar callback,
    // evitamos travar a UI com um timeout.
    setIsProcessing(true);

    const paymentPromise = iniciarPagamento({
      ordemId: `LIMPAR_PENDENCIA_${Date.now()}`,
      valor: 50.0,
      tipo: 'credit',
      parcelas: 1,
    });

    const timeoutMs = 90_000;
    const timeoutPromise = new Promise<boolean>((resolve) =>
      setTimeout(() => resolve(false), timeoutMs)
    );

    const ok = await Promise.race([paymentPromise, timeoutPromise]);

    if (!ok) {
      addLog('warning', '⚠️ Limpeza de pendências sem resposta (timeout).');
      toast.warning('Sem resposta do pinpad (timeout). Tente novamente após reiniciar o PayGo/Pinpad.');
    }

    setIsProcessing(false);
    refreshAndroidLogs();
  };

  // Lista de transações aprovadas que podem ser canceladas (Passo 21)
  const cancellableTransactions = useMemo(() => {
    return transactionLogs
      .filter(log => log.type === 'success' && log.data?.nsu && log.data?.valor)
      .map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        nsu: String(log.data?.nsu || ''),
        autorizacao: String(log.data?.autorizacao || ''),
        valor: log.data?.valor as number,
        bandeira: String(log.data?.bandeira || ''),
        passoTeste: log.data?.passoTeste as string | undefined,
      }))
      .reverse(); // Mais recentes primeiro
  }, [transactionLogs]);

  // Iniciar cancelamento de venda (Passo 21)
  const handleStartCancelamento = async () => {
    if (!selectedCancelTransaction) {
      toast.error('Selecione uma transação para cancelar');
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
    const orderId = `CANCEL_${Date.now()}`;
    // O valor já está em centavos no log
    const valorCentavos = selectedCancelTransaction.valor;
    
    // Detectar se é Passo 54 (Cancelamento PIX do Passo 53)
    // Passo 53 tem valor de 50000 centavos (R$500) e é PIX
    const isPasso54 = selectedCancelTransaction.passoTeste === '53' || valorCentavos === 50000;
    const passoAtual = isPasso54 ? '54' : '21';

    addLog('transaction', `🔄 INICIANDO CANCELAMENTO (Passo ${passoAtual})`, {
      orderId,
      valorCentavos,
      nsuOriginal: selectedCancelTransaction.nsu,
      autorizacaoOriginal: selectedCancelTransaction.autorizacao,
      passoTeste: passoAtual,
      tipoCancelamento: isPasso54 ? 'PIX' : 'Cartão'
    });

    // Definir callback para resultado
    const handleCancelResult = (resultado: TEFResultado) => {
      setIsProcessing(false);
      
      if (resultado.status === 'aprovado') {
        addLog('success', `✅ CANCELAMENTO APROVADO (Passo ${passoAtual})`, {
          nsu: resultado.nsu,
          autorizacao: resultado.autorizacao,
          valorCancelado: selectedCancelTransaction.valor / 100,
          passoTeste: passoAtual
        });
        
        setTransactionResult({
          show: true,
          status: 'aprovado',
          valor: selectedCancelTransaction.valor / 100,
          nsu: resultado.nsu || '',
          autorizacao: resultado.autorizacao || '',
          bandeira: resultado.bandeira || selectedCancelTransaction.bandeira || '',
          mensagem: 'Cancelamento realizado com sucesso',
          comprovanteCliente: resultado.comprovanteCliente,
          comprovanteLojista: resultado.comprovanteLojista,
          passoTeste: passoAtual
        });
        
        toast.success('Cancelamento aprovado!');
      } else {
        // Para Passo 54, o resultado esperado é "Cancelamento Negado" com mensagem específica
        const mensagemErro = isPasso54 
          ? 'TRANSAÇÃO NEGADA PELO HOST' 
          : (resultado.mensagem || 'Cancelamento não realizado');
        
        addLog(isPasso54 ? 'warning' : 'error', `❌ CANCELAMENTO NEGADO (Passo ${passoAtual})`, {
          erro: mensagemErro,
          passoTeste: passoAtual,
          resultadoEsperado: isPasso54 ? 'Cancelamento Negado (comportamento correto para PIX)' : undefined
        });
        
        setTransactionResult({
          show: true,
          status: 'negado',
          valor: selectedCancelTransaction.valor / 100,
          nsu: resultado.nsu || 'N/A',
          autorizacao: resultado.autorizacao || 'N/A',
          bandeira: '',
          mensagem: mensagemErro,
          passoTeste: passoAtual
        });
        
        // Para Passo 54, negação é o resultado esperado
        if (isPasso54) {
          toast.info('Cancelamento PIX negado (resultado esperado para Passo 54)');
        } else {
          toast.error('Cancelamento negado');
        }
      }
      
      refreshAndroidLogs();
      setShowCancelMode(false);
      setSelectedCancelTransaction(null);
    };

    // Chamar cancelamento
    const success = cancelarVendaAndroid({
      ordemId: orderId,
      valorCentavos,
      nsuOriginal: selectedCancelTransaction.nsu,
      autorizacaoOriginal: selectedCancelTransaction.autorizacao
    }, handleCancelResult);

    if (!success) {
      setIsProcessing(false);
      addLog('error', '❌ Falha ao iniciar cancelamento');
      toast.error('Falha ao iniciar cancelamento');
    }
  };

  // Reimprimir última transação
  const handleReimpressao = useCallback(() => {
    console.log('[PDV] handleReimpressao chamado');
    console.log('[PDV] isAndroidAvailable:', isAndroidAvailable);
    console.log('[PDV] isPinpadConnected:', isPinpadConnected);
    
    if (!isAndroidAvailable) {
      toast.error('TEF Android não disponível');
      return;
    }

    if (!isPinpadConnected) {
      toast.error('Pinpad não conectado');
      return;
    }

    setIsProcessing(true);
    addLog('transaction', '🖨️ SOLICITANDO REIMPRESSÃO DA ÚLTIMA TRANSAÇÃO');
    toast.info('Solicitando reimpressão...');

    // Chamar reimpressão com callback inline
    const success = reimprimirUltimaTransacaoAndroid((resultado: TEFResultado) => {
      console.log('[PDV] Resultado reimpressão:', resultado);
      setIsProcessing(false);
      
      if (resultado.status === 'aprovado') {
        addLog('success', '✅ REIMPRESSÃO RETORNADA', {
          nsu: resultado.nsu,
          autorizacao: resultado.autorizacao,
          temComprovanteCliente: !!resultado.comprovanteCliente,
          temComprovanteLojista: !!resultado.comprovanteLojista
        });
        
        // Exibir modal de resultado com comprovantes
        setTransactionResult({
          show: true,
          status: 'aprovado',
          valor: resultado.valor ? resultado.valor / 100 : 0,
          nsu: resultado.nsu || '',
          autorizacao: resultado.autorizacao || '',
          bandeira: resultado.bandeira || '',
          mensagem: 'Comprovante da última transação',
          comprovanteCliente: resultado.comprovanteCliente,
          comprovanteLojista: resultado.comprovanteLojista
        });
        
        toast.success('Comprovantes recuperados!');
      } else {
        addLog('warning', '⚠️ REIMPRESSÃO NÃO DISPONÍVEL', {
          mensagem: resultado.mensagem
        });
        
        toast.warning(resultado.mensagem || 'Não há transação para reimprimir');
      }
      
      refreshAndroidLogs();
    });

    console.log('[PDV] reimprimirUltimaTransacaoAndroid retornou:', success);

    if (!success) {
      setIsProcessing(false);
      addLog('error', '❌ Falha ao solicitar reimpressão');
      toast.error('Falha ao solicitar reimpressão');
    }
  }, [isAndroidAvailable, isPinpadConnected, addLog, refreshAndroidLogs]);

  // Limpar logs (remove do storage também)
  const handleClearLogs = () => {
    clearAllLogs();
    setTransactionLogs([]);
    setAndroidLogs([]);
    limparLogsAndroid();
    setStorageStats(getStorageStats());
    toast.success('Todos os logs foram excluídos');
  };
  
  // Limpar logs apenas do dia selecionado
  const handleClearDayLogs = () => {
    clearLogsByDate(selectedDate);
    setTransactionLogs(prev => prev.filter(l => l.date !== selectedDate));
    setAndroidLogs(prev => prev.filter(l => l.date !== selectedDate));
    setStorageStats(getStorageStats());
    toast.success(`Logs de ${formatDateForDisplay(selectedDate)} excluídos`);
  };

  // Exportar logs do dia selecionado
  const handleExportDayLogs = () => {
    const dayLogs = selectedDayLogs;
    const allLogs = [
      '╔══════════════════════════════════════════════════════════════════╗',
      '║           RELATÓRIO DE HOMOLOGAÇÃO PAYGO - TEF                  ║',
      '╚══════════════════════════════════════════════════════════════════╝',
      '',
      `📅 Data: ${dayLogs.displayDate} (${dayLogs.date})`,
      `⏰ Exportado em: ${new Date().toLocaleString('pt-BR')}`,
      `📱 Versão Android: ${androidVersion || 'N/A'}`,
      `🔌 Pinpad: ${pinpadStatus?.modelo || 'N/A'}`,
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '                        TRANSAÇÕES DO DIA                          ',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      dayLogs.transactionLogs.length === 0 
        ? '  Nenhuma transação registrada neste dia.'
        : dayLogs.transactionLogs.map(log => {
            const time = log.timestamp.split('T')[1].slice(0, 12);
            const typeLabel = {
              'success': '✅ SUCESSO',
              'error': '❌ ERRO',
              'warning': '⚠️ AVISO',
              'transaction': '💳 TRANSAÇÃO',
              'info': 'ℹ️ INFO'
            }[log.type];
            let line = `[${time}] [${typeLabel}] ${log.message}`;
            if (log.data) {
              line += '\n' + JSON.stringify(log.data, null, 2).split('\n').map(l => '          ' + l).join('\n');
            }
            return line;
          }).join('\n\n'),
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '                     LOGS ANDROID TEF                              ',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      dayLogs.androidLogs.length === 0 
        ? '  Nenhum log Android disponível para este dia.'
        : dayLogs.androidLogs.map(log => `  ${log.message}`).join('\n'),
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '                        FIM DO RELATÓRIO                           ',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ].join('\n');

    const blob = new Blob([allLogs], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paygo-homologacao-${dayLogs.date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Logs de ${dayLogs.displayDate} exportados`);
  };

  // Exportar todos os logs
  const handleExportAllLogs = () => {
    const allLogsSections = dailyLogGroups.map(dayLogs => {
      return [
        '',
        `╔══════════════════════════════════════════════════════════════════╗`,
        `║  ${dayLogs.displayDate.padEnd(20)} (${dayLogs.date})                           ║`,
        `╚══════════════════════════════════════════════════════════════════╝`,
        '',
        '── Transações ──',
        dayLogs.transactionLogs.length === 0 
          ? '  Nenhuma transação.'
          : dayLogs.transactionLogs.map(log => {
              const time = log.timestamp.split('T')[1].slice(0, 12);
              let line = `[${time}] [${log.type.toUpperCase()}] ${log.message}`;
              if (log.data) {
                line += ' | ' + JSON.stringify(log.data);
              }
              return line;
            }).join('\n'),
        '',
        '── Logs Android ──',
        dayLogs.androidLogs.length === 0 
          ? '  Nenhum log.'
          : dayLogs.androidLogs.map(log => `  ${log.message}`).join('\n'),
      ].join('\n');
    });

    const allLogs = [
      '╔══════════════════════════════════════════════════════════════════╗',
      '║       RELATÓRIO COMPLETO DE HOMOLOGAÇÃO PAYGO - TEF             ║',
      '╚══════════════════════════════════════════════════════════════════╝',
      '',
      `⏰ Exportado em: ${new Date().toLocaleString('pt-BR')}`,
      `📱 Versão Android: ${androidVersion || 'N/A'}`,
      `🔌 Pinpad: ${pinpadStatus?.modelo || 'N/A'}`,
      `📊 Total de dias: ${dailyLogGroups.length}`,
      `📝 Total de transações: ${transactionLogs.length}`,
      ...allLogsSections,
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '                        FIM DO RELATÓRIO COMPLETO                  ',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ].join('\n');

    const blob = new Blob([allLogs], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paygo-homologacao-completo-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Relatório completo exportado');
  };

  // Copiar logs do dia
  const handleCopyDayLogs = () => {
    const dayLogs = selectedDayLogs;
    const text = [
      `LOGS ${dayLogs.displayDate}`,
      '---',
      ...dayLogs.transactionLogs.map(log => `[${log.timestamp.split('T')[1].slice(0, 8)}] ${log.message}`),
      '---',
      ...dayLogs.androidLogs.map(log => log.message)
    ].join('\n');

    navigator.clipboard.writeText(text);
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

  const getLogBgColor = (type: TransactionLog['type']) => {
    switch (type) {
      case 'success': return 'bg-green-500/10 border-l-green-500';
      case 'error': return 'bg-red-500/10 border-l-red-500';
      case 'warning': return 'bg-yellow-500/10 border-l-yellow-500';
      case 'transaction': return 'bg-blue-500/10 border-l-blue-500';
      default: return 'bg-gray-500/10 border-l-gray-500';
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

  // Copiar NSU Local para a planilha
  const copyNsuLocal = async (nsu: string, logId: string) => {
    try {
      await navigator.clipboard.writeText(nsu);
      setCopiedNsuId(logId);
      toast.success('NSU Local copiado!');
      setTimeout(() => setCopiedNsuId(null), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  // Função para gerar recibo diferenciado (Passo 10 - Teste de recibos diferenciados)
  const generateDifferentiatedReceipt = (type: 'cliente' | 'lojista') => {
    if (!transactionResult) return '';
    
    const dataHora = new Date().toLocaleString('pt-BR');
    const dataHoraCompacta = new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    
    if (type === 'cliente') {
      // VIA DO PORTADOR DO CARTÃO - Recibo simplificado para o cliente
      return `
╔════════════════════════════════════╗
║       COSTA URBANA BARBEARIA       ║
║      CNPJ: 00.000.000/0001-00      ║
╠════════════════════════════════════╣
║        VIA DO PORTADOR             ║
╠════════════════════════════════════╣
║ ${transactionResult.status.toUpperCase() === 'APROVADO' ? '✓ TRANSAÇÃO APROVADA' : '✗ TRANSAÇÃO ' + transactionResult.status.toUpperCase()}
║                                    ║
║ VALOR: R$ ${transactionResult.valor.toFixed(2).padStart(10)}             ║
║ BANDEIRA: ${(transactionResult.bandeira || 'DEMO').padEnd(15)}        ║
║ CARTÃO: **** **** **** 0001        ║
║ TIPO: ${selectedMethod.toUpperCase().padEnd(20)}    ║
║                                    ║
║ NSU: ${transactionResult.nsu.padEnd(20)}        ║
║ AUT: ${transactionResult.autorizacao.padEnd(20)}        ║
║                                    ║
║ ${dataHoraCompacta.padStart(34)}║
╠════════════════════════════════════╣
║  GUARDE ESTE COMPROVANTE PARA      ║
║     CONTROLE DE SUA COMPRA         ║
╚════════════════════════════════════╝
      `.trim();
    } else {
      // VIA DO LOJISTA - Recibo completo com mais informações
      return `
╔════════════════════════════════════╗
║       COSTA URBANA BARBEARIA       ║
║      CNPJ: 00.000.000/0001-00      ║
║   EC: 1234567890 - FILIAL: 001     ║
╠════════════════════════════════════╣
║         VIA DO LOJISTA             ║
╠════════════════════════════════════╣
║ ${transactionResult.status.toUpperCase() === 'APROVADO' ? '✓ TRANSAÇÃO APROVADA' : '✗ TRANSAÇÃO ' + transactionResult.status.toUpperCase()}
║                                    ║
║ VALOR: R$ ${transactionResult.valor.toFixed(2).padStart(10)}             ║
║ BANDEIRA: ${(transactionResult.bandeira || 'DEMO').padEnd(15)}        ║
║ CARTÃO: **** **** **** 0001        ║
║ TIPO: ${selectedMethod.toUpperCase().padEnd(20)}    ║
║ FINANC: ${(financingType === 'avista' ? 'A VISTA' : `PARC ${installments}X`).padEnd(18)}    ║
║ AUTORIZADOR: ${(authorizer || 'DEMO').padEnd(15)}   ║
║                                    ║
║ NSU LOCAL: ${transactionResult.nsu.padEnd(18)}  ║
║ NSU HOST: ${transactionResult.nsu.padEnd(19)}  ║
║ COD. AUT: ${transactionResult.autorizacao.padEnd(19)}  ║
║                                    ║
${transactionResult.passoTeste ? `║ PASSO TESTE: ${transactionResult.passoTeste.padEnd(20)}║\n` : ''}║ TERMINAL: TOTEM-001                ║
║ OPERADOR: HOMOLOGACAO              ║
║                                    ║
║ ${dataHora.padStart(34)}║
╠════════════════════════════════════╣
║    CONFIRMO A TRANSAÇÃO ACIMA      ║
║                                    ║
║ __________________________________ ║
║       ASSINATURA DO CLIENTE        ║
╠════════════════════════════════════╣
║   GUARDE ESTA VIA PARA CONTROLE    ║
╚════════════════════════════════════╝
      `.trim();
    }
  };

  // Função para imprimir recibo diferenciado (Passo 10)
  const handlePrintReceipt = (type: 'cliente' | 'lojista') => {
    if (!transactionResult) return;
    
    // Usar comprovante retornado pelo TEF se disponível, senão gerar diferenciado
    const reciboContent = type === 'cliente' 
      ? (transactionResult.comprovanteCliente || generateDifferentiatedReceipt('cliente'))
      : (transactionResult.comprovanteLojista || generateDifferentiatedReceipt('lojista'));
    
    // Log para homologação
    addLog('info', `📄 Imprimindo recibo diferenciado - Via ${type.toUpperCase()}`, {
      tipo: type,
      valor: transactionResult.valor,
      nsu: transactionResult.nsu,
      autorizacao: transactionResult.autorizacao
    });
    
    // Abrir janela de impressão
    const printWindow = window.open('', '_blank', 'width=400,height=700');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Comprovante TEF - Via ${type === 'cliente' ? 'Portador' : 'Lojista'}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                padding: 10px; 
                font-size: 11px;
                max-width: 300px;
                margin: 0 auto;
              }
              pre { 
                white-space: pre-wrap; 
                word-wrap: break-word;
                margin: 0;
                line-height: 1.3;
              }
              .header { 
                text-align: center; 
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px dashed #333;
              }
              .via-badge {
                display: inline-block;
                padding: 4px 12px;
                background: ${type === 'cliente' ? '#4CAF50' : '#2196F3'};
                color: white;
                border-radius: 4px;
                font-weight: bold;
                font-size: 10px;
              }
              @media print { 
                body { padding: 0; max-width: 100%; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <span class="via-badge">VIA ${type === 'cliente' ? 'PORTADOR' : 'LOJISTA'}</span>
            </div>
            <pre>${reciboContent}</pre>
            <div class="no-print" style="margin-top: 20px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
                🖨️ Imprimir
              </button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Auto-imprimir após carregar
      setTimeout(() => {
        printWindow.print();
      }, 300);
    } else {
      toast.error('Não foi possível abrir a janela de impressão');
    }
    
    toast.success(`Recibo ${type === 'cliente' ? 'do portador' : 'do lojista'} enviado para impressão`);
  };

  // Fechar modal de resultado
  const closeTransactionResult = () => {
    setTransactionResult(null);
    setAmount(''); // Limpar valor para próxima transação
  };

  // Extrair transações para a planilha (removendo duplicatas)
  const transactionsList = useMemo(() => {
    const seenIds = new Set<string>();
    return transactionLogs
      .filter(log => (log.type === 'success' || log.type === 'error' || log.type === 'warning') && log.data)
      // Filtrar apenas logs que são transações (têm passoTeste ou valor)
      .filter(log => log.data?.passoTeste || log.data?.valor)
      // Remover duplicatas: prioriza NSU (quando existe). Se não existir, usa combinação estável.
      .filter(log => {
        const passo = String(log.data?.passoTeste || '');
        const valor = String(log.data?.valor ?? '');
        const nsu = String(log.data?.nsu || '');
        const autorizacao = String(log.data?.autorizacao || '');
        const motivo = String(log.data?.motivo || log.data?.motivoNegacao || '');

        const uniqueKey = nsu
          ? `nsu:${nsu}`
          : `passo:${passo}|valor:${valor}|auth:${autorizacao}|motivo:${motivo}`;

        if (seenIds.has(uniqueKey)) return false;
        seenIds.add(uniqueKey);
        return true;
      })
      .map(log => {
        // Determinar o status correto baseado no tipo e mensagem
        let status: 'APROVADO' | 'NEGADO' | 'CANCELADO' = 'NEGADO';
        if (log.type === 'success') {
          status = 'APROVADO';
        } else if (log.type === 'warning' || log.message.includes('CANCELADA') || log.message.includes('cancelada')) {
          status = 'CANCELADO';
        }
        
        return {
          id: log.id,
          timestamp: log.timestamp,
          type: log.type,
          status,
          nsu: String(log.data?.nsu || ''),
          autorizacao: String(log.data?.autorizacao || ''),
          bandeira: String(log.data?.bandeira || ''),
          valor: log.data?.valor as number | undefined,
          passoTeste: log.data?.passoTeste as string | undefined,
          resultadoEsperado: log.data?.resultadoEsperado as string | undefined,
          motivo: String(log.data?.motivo || log.data?.motivoNegacao || ''),
        };
      });
  }, [transactionLogs]);

  // Manter compatibilidade com nsuLocalList
  const nsuLocalList = transactionsList.filter(t => t.type === 'success' && t.nsu);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-black-soft to-urbana-black text-white flex flex-col overflow-hidden">
      {/* Header Compacto */}
      <header className="flex-shrink-0 bg-urbana-black/80 backdrop-blur-sm border-b border-urbana-gold/20 px-2 md:px-4 py-2 safe-area-inset-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onPointerDown={() => navigate('/totem', { state: { openTEFDiagnostics: true } })}
              className="text-urbana-gold hover:bg-urbana-gold/10 h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base md:text-lg font-bold text-urbana-gold flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" />
                PDV Homologação
              </h1>
              <p className="text-[10px] text-urbana-light/60">Terminal TEF PayGo</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Badge 
              variant="outline" 
              className={`text-[10px] px-1.5 py-0.5 ${isAndroidAvailable ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}
            >
              <Smartphone className="h-3 w-3 mr-0.5" />
              {isAndroidAvailable ? 'TEF' : 'OFF'}
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-[10px] px-1.5 py-0.5 ${isPinpadConnected ? 'border-green-500 text-green-400' : 'border-yellow-500 text-yellow-400'}`}
            >
              {isPinpadConnected ? <Wifi className="h-3 w-3 mr-0.5" /> : <WifiOff className="h-3 w-3 mr-0.5" />}
              {isPinpadConnected ? 'PIN' : 'N/C'}
            </Badge>
          </div>
        </div>
      </header>

      {/* Tabs para Mobile/Tablet */}
      <div className="flex-shrink-0 px-2 md:px-4 pt-2">
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={activeTab === 'pdv' ? 'default' : 'outline'}
            onPointerDown={() => setActiveTab('pdv')}
            className={`h-10 ${activeTab === 'pdv' 
              ? 'bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90' 
              : 'border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10'}`}
          >
            <DollarSign className="h-4 w-4 mr-1" />
            PDV
          </Button>
          <Button
            variant={activeTab === 'pendencias' ? 'default' : 'outline'}
            onPointerDown={() => setActiveTab('pendencias')}
            className={`h-10 ${activeTab === 'pendencias' 
              ? 'bg-yellow-500 text-black hover:bg-yellow-500/90' 
              : 'border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10'}`}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            33/34
            {passo33PendingConfirmationId && (
              <Badge className="ml-1 bg-red-500 text-white text-[9px] px-1 animate-pulse">
                !
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'logs' ? 'default' : 'outline'}
            onPointerDown={() => setActiveTab('logs')}
            className={`h-10 ${activeTab === 'logs' 
              ? 'bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90' 
              : 'border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10'}`}
          >
            <FileText className="h-4 w-4 mr-1" />
            Logs
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-hidden p-2">
        {/* Aba Pendências - Passos 33/34 */}
        {activeTab === 'pendencias' && (
          <div className="h-full flex flex-col gap-3">
            {/* Instruções */}
            <Card className="bg-yellow-900/20 border-yellow-500/30">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm text-yellow-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Passos 33 e 34 - Transação Pendente
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 text-xs text-yellow-200/80 space-y-2">
                <p><strong>Passo 33:</strong> Execute venda de R$ 1.005,60 → Aprovada e confirmada normalmente.</p>
                <p><strong>Passo 34:</strong> Execute venda de R$ 1.005,61 → Será <strong>NEGADA</strong> e o sistema <strong>automaticamente</strong> envia DESFEITO_MANUAL.</p>
                <p className="text-green-400 text-[10px] italic">✓ O desfazimento é enviado automaticamente quando a transação do Passo 34 for negada.</p>
              </CardContent>
            </Card>

            {/* Status da Pendência */}
            <Card className={`border-2 ${passo33PendingConfirmationId ? 'bg-red-900/20 border-red-500/50' : 'bg-green-900/20 border-green-500/50'}`}>
              <CardContent className="p-4 text-center">
                {passo33PendingConfirmationId ? (
                  <>
                    <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-red-400 font-bold text-lg">PENDÊNCIA DETECTADA</p>
                    <p className="text-red-300/70 text-xs mt-1 font-mono break-all">
                      ID: {passo33PendingConfirmationId}
                    </p>
                    <p className="text-yellow-400 text-sm mt-2">
                      Envie DESFEITO_MANUAL para resolver (Passo 34)
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400 font-bold text-lg">SEM PENDÊNCIAS</p>
                    <p className="text-green-300/70 text-sm mt-1">
                      Execute o Passo 33 (R$ 1.005,60) para criar uma pendência
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onPointerDown={handleResolverPendenciaDesfazer}
                disabled={resolvingPending || !isAndroidAvailable}
                className="h-16 bg-red-600 hover:bg-red-700 text-white flex flex-col gap-1"
              >
                {resolvingPending ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Undo2 className="h-6 w-6" />
                )}
                <span className="text-xs font-bold">DESFAZER</span>
                <span className="text-[9px] opacity-70">DESFEITO_MANUAL</span>
              </Button>
              
              <Button
                onPointerDown={handleResolverPendenciaConfirmar}
                disabled={resolvingPending || !isAndroidAvailable}
                className="h-16 bg-green-600 hover:bg-green-700 text-white flex flex-col gap-1"
              >
                {resolvingPending ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <CheckSquare className="h-6 w-6" />
                )}
                <span className="text-xs font-bold">CONFIRMAR</span>
                <span className="text-[9px] opacity-70">CONFIRMADO_MANUAL</span>
              </Button>
            </div>

            {/* Resolver Pendência PayGo (fallback) */}
            <Card className="bg-blue-900/20 border-blue-500/30">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs text-blue-400">
                  Resolver via PayGo (alternativo)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onPointerDown={() => {
                      if (resolverPendenciaAndroid('desfazer')) {
                        toast.success('DESFAZER enviado via PayGo');
                      }
                    }}
                    disabled={!isAndroidAvailable}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <Undo2 className="h-3 w-3 mr-1" />
                    PayGo Desfazer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onPointerDown={() => {
                      if (resolverPendenciaAndroid('confirmar')) {
                        toast.success('CONFIRMAR enviado via PayGo');
                      }
                    }}
                    disabled={!isAndroidAvailable}
                    className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                  >
                    <CheckSquare className="h-3 w-3 mr-1" />
                    PayGo Confirmar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info TEF */}
            <Card className="bg-urbana-black-soft/80 border-urbana-gold/30 mt-auto">
              <CardContent className="p-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-urbana-black/50 rounded text-center">
                    <p className="text-[9px] text-urbana-light/50 uppercase">TEF Android</p>
                    <p className={`text-sm font-bold ${isAndroidAvailable ? 'text-green-400' : 'text-red-400'}`}>
                      {isAndroidAvailable ? '✓ Disponível' : '✗ Indisponível'}
                    </p>
                  </div>
                  <div className="p-2 bg-urbana-black/50 rounded text-center">
                    <p className="text-[9px] text-urbana-light/50 uppercase">Pinpad</p>
                    <p className={`text-sm font-bold ${isPinpadConnected ? 'text-green-400' : 'text-yellow-400'}`}>
                      {isPinpadConnected ? '✓ Conectado' : '⚠ Desconectado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PDV Tab */}
        {activeTab === 'pdv' && (
          <div className="h-full flex flex-col gap-2">
            {/* Valor Display */}
            <Card className="bg-gradient-to-br from-urbana-black-soft to-urbana-black border-urbana-gold/30 shadow-lg shadow-urbana-gold/5">
              <CardContent className="p-3">
                <p className="text-[10px] text-urbana-light/60 mb-0.5 uppercase tracking-wider">Valor</p>
                <div className="text-3xl md:text-4xl font-bold text-urbana-gold text-center py-2 font-mono">
                  {formatCurrency(amount)}
                </div>
              </CardContent>
            </Card>

            {/* Método de Pagamento */}
            <Card className="bg-urbana-black-soft/80 border-urbana-gold/30">
              <CardContent className="p-3 space-y-2">
                <p className="text-[10px] text-urbana-light/60 uppercase tracking-wider">Forma de Pagamento</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'debito', label: 'Débito', icon: CreditCard },
                    { id: 'credito', label: 'Crédito', icon: Banknote },
                    { id: 'pix', label: 'PIX', icon: QrCode }
                  ].map(({ id, label, icon: Icon }) => (
                    <Button
                      key={id}
                      variant={selectedMethod === id ? 'default' : 'outline'}
                      onPointerDown={() => setSelectedMethod(id as PaymentMethod)}
                      className={`h-12 flex flex-col gap-0.5 hover:bg-transparent ${selectedMethod === id 
                        ? 'bg-urbana-gold text-urbana-black shadow-lg shadow-urbana-gold/20' 
                        : 'border-urbana-gold/30 text-urbana-gold'}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[10px] font-medium">{label}</span>
                    </Button>
                  ))}
                </div>

                {/* Opções Avançadas Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onPointerDown={() => setShowAdvanced(!showAdvanced)}
                  className="w-full h-7 text-[10px] text-urbana-light/60 hover:bg-transparent hover:text-urbana-gold"
                >
                  {showAdvanced ? '▲ Ocultar Opções Avançadas' : '▼ Opções Avançadas (Passo 03)'}
                </Button>

                {showAdvanced && (
                  <>
                    {/* Autorizador */}
                    <div>
                      <p className="text-[10px] text-urbana-light/60 mb-1 uppercase tracking-wider">Autorizador</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'DEMO', label: 'DEMO' },
                          { id: 'REDE', label: 'REDE' },
                          { id: 'PIX_C6_BANK', label: 'PIX C6' }
                        ].map(({ id, label }) => (
                          <Button
                            key={id}
                            size="sm"
                            variant={authorizer === id ? 'default' : 'outline'}
                            onPointerDown={() => setAuthorizer(id as Authorizer)}
                            className={`h-8 text-[10px] hover:bg-transparent ${authorizer === id
                              ? 'bg-urbana-gold text-urbana-black'
                              : 'border-urbana-gold/30 text-urbana-gold'}`}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Tipo de Financiamento (só para crédito) */}
                    {selectedMethod === 'credito' && (
                      <div>
                        <p className="text-[10px] text-urbana-light/60 mb-1 uppercase tracking-wider">Financiamento</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'avista', label: 'À Vista' },
                            { id: 'parcelado_loja', label: 'Parc. Loja' },
                            { id: 'parcelado_emissor', label: 'Parc. Emissor' }
                          ].map(({ id, label }) => (
                            <Button
                              key={id}
                              size="sm"
                              variant={financingType === id ? 'default' : 'outline'}
                              onPointerDown={() => {
                                setFinancingType(id as FinancingType);
                                if (id === 'avista') setInstallments(1);
                              }}
                              className={`h-8 text-[10px] hover:bg-transparent ${financingType === id
                                ? 'bg-urbana-gold text-urbana-black'
                                : 'border-urbana-gold/30 text-urbana-gold'}`}
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Parcelas - Expandido para 99 (Passo 08) */}
                {selectedMethod === 'credito' && financingType !== 'avista' && (
                  <div>
                    <p className="text-[10px] text-urbana-light/60 mb-1.5 uppercase tracking-wider">Parcelas (até 99x)</p>
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 6, 10, 12, 24, 48, 99].map((n) => (
                        <Button
                          key={n}
                          size="sm"
                          variant={installments === n ? 'default' : 'outline'}
                          onPointerDown={() => setInstallments(n)}
                          className={`h-7 text-xs px-2 hover:bg-transparent ${installments === n
                            ? 'bg-urbana-gold text-urbana-black'
                            : 'border-urbana-gold/30 text-urbana-gold'}`}
                        >
                          {n}x
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Valores de Teste PayGo */}
            <Card className="bg-urbana-black-soft/80 border-orange-500/30 flex-shrink-0">
              <CardContent className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onPointerDown={() => setShowTestValues(!showTestValues)}
                  className="w-full h-7 text-[10px] text-orange-400 hover:bg-transparent mb-1"
                >
                  🧪 {showTestValues ? '▲ Ocultar' : '▼ Valores de Teste PayGo'}
                </Button>
                
                {showTestValues && (
                  <div className="grid grid-cols-3 gap-1 max-h-40 overflow-auto">
                    {PAYGO_TEST_VALUES.map((test) => (
                      <Button
                        key={test.passo}
                        size="sm"
                        variant="outline"
                        onPointerDown={() => {
                          // Passo 54 é cancelamento - abre aba de cancelamento e busca transação do Passo 53
                          if (test.passo === '54') {
                            // Buscar transação do Passo 53 (PIX R$500 aprovada) na lista de canceláveis
                            const passo53FromCancellable = cancellableTransactions.find(
                              tx => tx.passoTeste === '53' || tx.valor === 50000 || tx.valor === 500
                            );
                            
                            if (passo53FromCancellable) {
                              // Pré-seleciona a transação do Passo 53 para cancelamento
                              setSelectedCancelTransaction({
                                nsu: passo53FromCancellable.nsu,
                                autorizacao: passo53FromCancellable.autorizacao,
                                valor: passo53FromCancellable.valor,
                                bandeira: passo53FromCancellable.bandeira,
                                passoTeste: '53'
                              });
                              // Ativa modo de cancelamento
                              setShowCancelMode(true);
                              toast.info('Transação do Passo 53 selecionada para cancelamento (Passo 54)');
                            } else {
                              // Verificar se existe alguma transação disponível
                              if (cancellableTransactions.length > 0) {
                                setShowCancelMode(true);
                                toast.warning('Passo 53 não encontrado. Selecione manualmente a transação PIX R$500.');
                              } else {
                                toast.error('Execute o Passo 53 (PIX R$500) primeiro antes de cancelar');
                              }
                            }
                            return;
                          }
                          
                          // Configura valor
                          setAmount(test.valor.toString());
                          // Configura método de pagamento
                          setSelectedMethod(test.metodo);
                          // Configura autorizador
                          if (test.autorizador) setAuthorizer(test.autorizador);
                          // Configura financiamento
                          if (test.financiamento) setFinancingType(test.financiamento);
                          // Configura parcelas
                          if (test.parcelas) setInstallments(test.parcelas);
                          else if (test.financiamento === 'avista') setInstallments(1);
                          // Abre opções avançadas se necessário
                          if (test.autorizador && test.autorizador !== 'DEMO') setShowAdvanced(true);
                          // Log para debug
                          console.log(`[TEF Homolog] Teste P${test.passo} selecionado:`, {
                            valor: test.valor / 100,
                            metodo: test.metodo,
                            autorizador: test.autorizador,
                            financiamento: test.financiamento,
                            parcelas: test.parcelas
                          });
                        }}
                        className={`h-auto py-1.5 px-2 text-left border-orange-500/20 hover:bg-transparent flex flex-col items-start ${
                          test.passo === '54' ? 'text-red-300 border-red-500/30' :
                          test.metodo === 'pix' ? 'text-cyan-300' : 
                          test.metodo === 'debito' ? 'text-green-300' : 'text-orange-300'
                        }`}
                      >
                        <div className="flex items-center gap-1 w-full">
                          <span className="text-[9px] font-bold">P{test.passo}</span>
                          {test.passo === '54' ? (
                            <XCircle className="h-3 w-3 text-red-400" />
                          ) : (
                            <span className={`text-[7px] px-1 rounded ${
                              test.metodo === 'pix' ? 'bg-cyan-500/20' : 
                              test.metodo === 'debito' ? 'bg-green-500/20' : 'bg-orange-500/20'
                            }`}>
                              {test.metodo === 'pix' ? 'PIX' : test.metodo === 'debito' ? 'DEB' : 'CRE'}
                            </span>
                          )}
                        </div>
                        <span className="text-[8px] text-urbana-light/70 truncate w-full">{test.desc}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Teclado Numérico */}
            <Card className="bg-urbana-black-soft/80 border-urbana-gold/30 flex-1">
              <CardContent className="p-2 h-full">
                <div className="grid grid-cols-3 gap-1.5 h-full">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <Button
                      key={num}
                      variant="outline"
                      onPointerDown={() => handleNumberClick(num)}
                      disabled={isProcessing}
                      className="h-full min-h-[40px] text-xl font-semibold border-urbana-gold/30 text-urbana-gold hover:bg-transparent active:bg-urbana-gold/20"
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    onPointerDown={handleClear}
                    disabled={isProcessing}
                    className="h-full min-h-[40px] border-red-500/30 text-red-400 hover:bg-transparent active:bg-red-500/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    onPointerDown={() => handleNumberClick('0')}
                    disabled={isProcessing}
                    className="h-full min-h-[40px] text-xl font-semibold border-urbana-gold/30 text-urbana-gold hover:bg-transparent active:bg-urbana-gold/20"
                  >
                    0
                  </Button>
                  <Button
                    variant="outline"
                    onPointerDown={handleBackspace}
                    disabled={isProcessing}
                    className="h-full min-h-[40px] border-yellow-500/30 text-yellow-400 hover:bg-transparent active:bg-yellow-500/20"
                  >
                    <Delete className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex gap-2 flex-shrink-0">
              {/* Botão de Pagamento */}
              <Button
                onPointerDown={handleStartTransaction}
                disabled={isProcessing || !amount || !isAndroidAvailable || !isPinpadConnected || showCancelMode}
                className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-600 hover:to-green-500 active:from-green-800 active:to-green-700 text-white disabled:opacity-50 shadow-lg shadow-green-500/20"
              >
                {isProcessing && !showCancelMode ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-5 w-5 mr-1.5" />
                    PAGAR {formatCurrency(amount)}
                  </>
                )}
              </Button>
              
              {/* Botão de Cancelamento (Passo 21) */}
              <Button
                onPointerDown={() => setShowCancelMode(!showCancelMode)}
                disabled={isProcessing || cancellableTransactions.length === 0}
                className={`h-14 px-4 font-bold transition-all ${showCancelMode 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'}`}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>

            {/* Painel de Cancelamento (Passo 21) */}
            {showCancelMode && (
              <Card className="bg-red-900/20 border-red-500/50 flex-shrink-0">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm text-red-400 flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Cancelamento de Venda (Passo 21)
                    <Badge variant="outline" className="ml-auto border-red-500/30 text-red-400">
                      {cancellableTransactions.length} disponíveis
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-3">
                  <p className="text-xs text-red-300/70">
                    Selecione a transação aprovada do Passo 19 para cancelar:
                  </p>
                  
                  {/* Lista de transações canceláveis */}
                  <ScrollArea className="h-32 pr-2">
                    <div className="space-y-1.5">
                      {cancellableTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className={`p-2 rounded border cursor-pointer transition-all ${
                            selectedCancelTransaction?.nsu === tx.nsu
                              ? 'bg-red-500/30 border-red-500'
                              : 'bg-urbana-black/30 border-red-500/20 hover:border-red-500/50'
                          }`}
                          onClick={() => setSelectedCancelTransaction({
                            nsu: tx.nsu,
                            autorizacao: tx.autorizacao,
                            valor: tx.valor,
                            bandeira: tx.bandeira,
                            passoTeste: tx.passoTeste
                          })}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={selectedCancelTransaction?.nsu === tx.nsu}
                                onChange={() => {}}
                                className="accent-red-500"
                              />
                              <div>
                                <p className="text-xs text-white font-mono">
                                  NSU: {tx.nsu}
                                </p>
                                <p className="text-[10px] text-red-300/60">
                                  Auth: {tx.autorizacao} {tx.passoTeste && `• Passo ${tx.passoTeste}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-red-400">
                                R$ {(tx.valor / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <p className="text-[9px] text-red-300/50">
                                {tx.bandeira || 'DEMO'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {/* Botões de ação */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onPointerDown={() => {
                        setShowCancelMode(false);
                        setSelectedCancelTransaction(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-1.5" />
                      Voltar
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      disabled={!selectedCancelTransaction || isProcessing}
                      onPointerDown={handleStartCancelamento}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          Cancelando...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-1.5" />
                          Cancelar Venda
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Confirmação Pendente */}
            {pendingConfirmation && (
              <Card className="bg-yellow-500/10 border-yellow-500/50 animate-pulse flex-shrink-0">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-yellow-400" />
                    <p className="text-yellow-400 font-semibold text-sm">Aguardando confirmação</p>
                  </div>
                  <div className="bg-urbana-black/30 rounded p-2 mb-2 font-mono text-xs">
                    <p className="text-urbana-light/70">NSU: <span className="text-white">{pendingConfirmation.nsu}</span> | Auth: <span className="text-white">{pendingConfirmation.autorizacao}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onPointerDown={handleConfirmTransaction}
                      className="flex-1 bg-green-600 hover:bg-green-600 h-10 text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Confirmar
                    </Button>
                    <Button
                      onPointerDown={handleUndoTransaction}
                      variant="outline"
                      className="flex-1 border-red-500/50 text-red-400 hover:bg-transparent h-10 text-sm"
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Desfazer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botões para Resolver Pendência (quando há erro de autorização pendente) */}
            {isAndroidAvailable && !pendingConfirmation && (
              <div className="flex flex-col gap-2 flex-shrink-0">
                <div className="flex gap-2">
                  <Button
                    onClick={handleResolvePendencyConfirm}
                    onPointerDown={handleResolvePendencyConfirm}
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    className="border-green-500/50 text-green-400 hover:bg-green-500/10 flex-1"
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Confirmar Pendência
                  </Button>
                  <Button
                    onClick={handleResolvePendencyUndo}
                    onPointerDown={handleResolvePendencyUndo}
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 flex-1"
                  >
                    <RotateCcw className="h-4 w-4 mr-1.5" />
                    Desfazer Pendência
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleClearPendenciesWithTransaction}
                    onPointerDown={handleClearPendenciesWithTransaction}
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Limpar Pendências
                  </Button>
                  <Button
                    onClick={handleReimpressao}
                    onPointerDown={handleReimpressao}
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 flex-1"
                  >
                    <Printer className="h-4 w-4 mr-1.5" />
                    Reimprimir Última
                  </Button>
                </div>
                {isProcessing && (
                  <p className="text-xs text-urbana-light/70">Aguardando retorno do pinpad… se travar, aguarde o timeout.</p>
                )}
              </div>
            )}

            {/* Aviso se não conectado */}
            {(!isAndroidAvailable || !isPinpadConnected) && (
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex-shrink-0">
                <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                  <WifiOff className="h-3.5 w-3.5" />
                  {!isAndroidAvailable 
                    ? 'TEF não detectado. Execute no Android.'
                    : 'Pinpad desconectado.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="h-full flex flex-col gap-2">
            {/* Controles de Data */}
            <Card className="bg-urbana-black-soft/80 border-urbana-gold/30 flex-shrink-0">
              <CardContent className="p-2">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onPointerDown={() => navigateDate('prev')}
                    disabled={availableDates.indexOf(selectedDate) >= availableDates.length - 1}
                    className="border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10 h-8 px-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-urbana-gold" />
                      <span className="text-urbana-gold font-semibold text-sm">{selectedDayLogs.displayDate}</span>
                      <span className="text-xs text-urbana-light/50">({selectedDate})</span>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onPointerDown={() => navigateDate('next')}
                    disabled={availableDates.indexOf(selectedDate) <= 0}
                    className="border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10 h-8 px-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Ações de Log */}
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onPointerDown={handleCopyDayLogs}
                    className="flex-1 border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10 h-8 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onPointerDown={handleExportDayLogs}
                    className="flex-1 border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10 h-8 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Dia
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onPointerDown={handleExportAllLogs}
                    className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10 h-8 text-xs"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    30 dias
                  </Button>
                </div>
                
                {/* Ações de Limpeza */}
                <div className="flex gap-1.5 mt-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onPointerDown={handleClearDayLogs}
                    className="flex-1 border-orange-500/30 text-orange-400 hover:bg-orange-500/10 h-7 text-[10px]"
                  >
                    <Trash2 className="h-2.5 w-2.5 mr-1" />
                    Limpar dia
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onPointerDown={handleClearLogs}
                    className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 h-7 text-[10px]"
                  >
                    <Trash2 className="h-2.5 w-2.5 mr-1" />
                    Limpar tudo
                  </Button>
                </div>

                {/* Status e Informações de Armazenamento */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-urbana-gold/10">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer text-[10px] ${autoRefreshLogs 
                        ? 'border-green-500 text-green-400 animate-pulse' 
                        : 'border-gray-500 text-gray-400'}`}
                      onClick={() => setAutoRefreshLogs(!autoRefreshLogs)}
                    >
                      <RefreshCw className={`h-2.5 w-2.5 mr-1 ${autoRefreshLogs ? 'animate-spin' : ''}`} />
                      {autoRefreshLogs ? 'AO VIVO' : 'PAUSADO'}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-400">
                      <Database className="h-2.5 w-2.5 mr-1" />
                      30 dias
                    </Badge>
                  </div>
                  <span className="text-[10px] text-urbana-light/50">
                    {selectedDayLogs.transactionLogs.length} txn | {selectedDayLogs.androidLogs.length} logs
                  </span>
                </div>
                
                {/* Estatísticas de armazenamento */}
                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-urbana-gold/5 text-[9px] text-urbana-light/40">
                  <span>Total: {storageStats.totalTransactionLogs} transações</span>
                  <span>{storageStats.daysWithLogs} dias com logs</span>
                </div>
              </CardContent>
            </Card>

            {/* Área de Logs */}
            <div className="flex-1 overflow-hidden grid grid-rows-3 gap-2">
              {/* Logs de Transação */}
              <Card className="bg-urbana-black-soft/80 border-urbana-gold/30 overflow-hidden">
                <CardHeader className="py-1.5 px-3 border-b border-urbana-gold/10">
                  <CardTitle className="text-xs text-urbana-gold flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    Transações
                    <Badge variant="outline" className="ml-auto text-[10px] border-urbana-gold/30 text-urbana-gold px-1.5">
                      {selectedDayLogs.transactionLogs.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-36px)]">
                  <ScrollArea className="h-full">
                    {selectedDayLogs.transactionLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-urbana-light/40 py-4">
                        <FileText className="h-6 w-6 mb-1 opacity-50" />
                        <p className="text-xs">Nenhuma transação</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1.5">
                        {selectedDayLogs.transactionLogs.map((log) => (
                          <div 
                            key={log.id} 
                            className={`p-2 rounded border-l-4 ${getLogBgColor(log.type)}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs font-medium ${getLogColor(log.type)}`}>
                                {log.message}
                              </p>
                              <span className="text-[9px] text-urbana-light/40 font-mono whitespace-nowrap">
                                {log.timestamp.split('T')[1].slice(0, 8)}
                              </span>
                            </div>
                            {log.data && (
                              <pre className="mt-1.5 text-[9px] text-urbana-light/60 font-mono bg-urbana-black/30 rounded p-1.5 overflow-x-auto">
                                {JSON.stringify(log.data, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                        <div ref={transactionLogsEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Logs Android TEF */}
              <Card className="bg-urbana-black-soft/80 border-urbana-gold/30 overflow-hidden">
                <CardHeader className="py-1.5 px-3 border-b border-urbana-gold/10">
                  <CardTitle className="text-xs text-urbana-gold flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5" />
                    Logs Android
                    <Badge variant="outline" className="ml-auto text-[10px] border-urbana-gold/30 text-urbana-gold px-1.5">
                      {selectedDayLogs.androidLogs.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-36px)]">
                  <div
                    ref={androidLogsScrollRef}
                    onScroll={handleAndroidLogsScroll}
                    className="h-full overflow-auto"
                  >
                    {selectedDayLogs.androidLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-urbana-light/40 py-4">
                        <Smartphone className="h-6 w-6 mb-1 opacity-50" />
                        <p className="text-xs">
                          {isAndroidAvailable ? 'Nenhum log' : 'TEF não detectado'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-2 font-mono text-[10px] space-y-0.5">
                        {selectedDayLogs.androidLogs.map((log, i) => (
                          <div key={i} className={`py-0.5 ${getAndroidLogColor(log.message)}`}>
                            {log.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Transações - Planilha Homologação PayGo */}
              <Card className="bg-urbana-black-soft/80 border-blue-500/30 overflow-hidden">
                <CardHeader className="py-1.5 px-3 border-b border-blue-500/20 bg-blue-900/10">
                  <CardTitle className="text-xs text-blue-400 flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5" />
                    Transações (Planilha PayGo)
                    <Badge variant="outline" className="ml-auto text-[10px] border-blue-500/30 text-blue-400 px-1.5">
                      {transactionsList.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-36px)]">
                  <ScrollArea className="h-full">
                    {transactionsList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-urbana-light/40 py-4">
                        <Receipt className="h-6 w-6 mb-1 opacity-50" />
                        <p className="text-xs">Nenhuma transação</p>
                        <p className="text-[9px] text-urbana-light/30 mt-0.5">Execute transações para ver aqui</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1.5">
                        <div className="text-[9px] text-blue-300/70 px-1 mb-1">
                          Transações para preencher na planilha PayGo
                        </div>
                        {transactionsList.map((item, index) => (
                          <div 
                            key={item.id} 
                            className={`p-2 rounded border ${
                              item.type === 'success' 
                                ? 'bg-green-900/20 border-green-500/30' 
                                : 'bg-red-900/20 border-red-500/30'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-urbana-light/60 font-mono">
                                  #{index + 1}
                                </span>
                                {item.passoTeste && (
                                  <Badge variant="outline" className="text-[9px] border-urbana-gold/50 text-urbana-gold px-1">
                                    P{item.passoTeste}
                                  </Badge>
                                )}
                                <Badge 
                                  variant="outline" 
                                  className={`text-[9px] px-1.5 ${
                                    item.status === 'APROVADO' 
                                      ? 'border-green-500/50 text-green-400 bg-green-500/10' 
                                      : item.status === 'CANCELADO'
                                      ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
                                      : 'border-red-500/50 text-red-400 bg-red-500/10'
                                  }`}
                                >
                                  {item.status === 'APROVADO' ? '✓ APROVADO' : 
                                   item.status === 'CANCELADO' ? '⚠ CANCELADO' : 
                                   '✗ NEGADO'}
                                </Badge>
                              </div>
                              {item.nsu && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 bg-blue-500/10"
                                  onClick={() => copyNsuLocal(item.nsu, item.id)}
                                >
                                  {copiedNsuId === item.id ? (
                                    <Check className="h-3 w-3 text-green-400" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-blue-300" />
                                  )}
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-[10px]">
                              <div>
                                <span className="text-urbana-light/50">Valor:</span>
                                <span className="ml-1 text-urbana-gold font-bold">
                                  R$ {(item.valor || 0).toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-urbana-light/50">NSU:</span>
                                <code className="ml-1 text-blue-300 font-mono">
                                  {item.nsu || '-'}
                                </code>
                              </div>
                              <div>
                                <span className="text-urbana-light/50">Auth:</span>
                                <span className="ml-1 text-urbana-light">
                                  {item.autorizacao || '-'}
                                </span>
                              </div>
                            </div>
                            {item.bandeira && (
                              <div className="mt-1 text-[9px] text-urbana-light/40">
                                Bandeira: {item.bandeira}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Info Técnica Compacta */}
            <Card className="bg-urbana-black-soft/80 border-urbana-gold/30 flex-shrink-0">
              <CardContent className="p-2">
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'App', value: androidVersion || 'N/A' },
                    { label: 'Pinpad', value: pinpadStatus?.modelo?.slice(0, 8) || 'N/A' },
                    { label: 'TEF', value: isAndroidAvailable ? 'OK' : 'OFF' },
                    { label: 'Conexão', value: isPinpadConnected ? 'ON' : 'OFF' }
                  ].map(({ label, value }) => (
                    <div key={label} className="p-1.5 bg-urbana-black/50 rounded text-center">
                      <p className="text-[9px] text-urbana-light/50 uppercase">{label}</p>
                      <p className="text-[10px] text-urbana-light font-mono truncate">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de Resultado da Transação */}
      {transactionResult?.show && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className={`w-full max-w-md border-2 relative ${
            transactionResult.status === 'aprovado' 
              ? 'bg-gradient-to-br from-green-900/90 to-urbana-black border-green-500' 
              : transactionResult.status === 'negado'
              ? 'bg-gradient-to-br from-red-900/90 to-urbana-black border-red-500'
              : 'bg-gradient-to-br from-yellow-900/90 to-urbana-black border-yellow-500'
          }`}>
            {/* Botão X para fechar */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-10 w-10 rounded-full text-white bg-black/50 hover:bg-black/80 z-10"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeTransactionResult();
              }}
            >
              <X className="h-6 w-6" />
            </Button>
            <CardHeader className="text-center pb-2">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                transactionResult.status === 'aprovado' 
                  ? 'bg-green-500/20' 
                  : transactionResult.status === 'negado'
                  ? 'bg-red-500/20'
                  : 'bg-yellow-500/20'
              }`}>
                {transactionResult.status === 'aprovado' ? (
                  <CheckCircle2 className="h-10 w-10 text-green-400" />
                ) : transactionResult.status === 'negado' ? (
                  <XCircle className="h-10 w-10 text-red-400" />
                ) : (
                  <XCircle className="h-10 w-10 text-yellow-400" />
                )}
              </div>
              <CardTitle className={`text-xl font-bold ${
                transactionResult.status === 'aprovado' 
                  ? 'text-green-400' 
                  : transactionResult.status === 'negado'
                  ? 'text-red-400'
                  : 'text-yellow-400'
              }`}>
                {transactionResult.status === 'aprovado' ? 'TRANSAÇÃO APROVADA' : 
                 transactionResult.status === 'negado' ? 'TRANSAÇÃO NEGADA' : 
                 'TRANSAÇÃO CANCELADA'}
              </CardTitle>
              {/* Mensagem de erro do host - destacada para cancelamentos */}
              {transactionResult.status === 'negado' && transactionResult.mensagem && (
                <div className="mt-2 px-3 py-2 bg-red-900/50 rounded-lg border border-red-500/50">
                  <p className="text-sm font-mono text-red-300 text-center">
                    {transactionResult.mensagem}
                  </p>
                </div>
              )}
              {transactionResult.passoTeste && (
                <Badge variant="outline" className="mx-auto mt-2 border-urbana-gold/50 text-urbana-gold">
                  Passo {transactionResult.passoTeste}
                </Badge>
              )}
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Valor */}
              <div className="text-center">
                <span className="text-3xl font-bold text-urbana-gold">
                  R$ {transactionResult.valor.toFixed(2)}
                </span>
              </div>
              
              {/* Detalhes */}
              <div className="bg-black/30 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-urbana-light/60">NSU:</span>
                  <code className="text-blue-300 font-mono">{transactionResult.nsu || '-'}</code>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-urbana-light/60">Autorização:</span>
                  <span className="text-urbana-light">{transactionResult.autorizacao || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-urbana-light/60">Bandeira:</span>
                  <span className="text-urbana-light">{transactionResult.bandeira || '-'}</span>
                </div>
                {/* Mensagem apenas para status aprovado (negado já exibe no topo) */}
                {transactionResult.mensagem && transactionResult.status === 'aprovado' && (
                  <div className="pt-2 border-t border-urbana-light/10">
                    <p className="text-xs text-urbana-light/80">{transactionResult.mensagem}</p>
                  </div>
                )}
              </div>
              
              {/* Botões de Impressão */}
              {transactionResult.status === 'aprovado' && (
                <div className="space-y-2">
                  <p className="text-xs text-center text-urbana-light/60">Imprimir Comprovante</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="border-urbana-gold/30 text-urbana-gold"
                      onClick={() => handlePrintReceipt('cliente')}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Via Cliente
                    </Button>
                    <Button
                      variant="outline"
                      className="border-urbana-gold/30 text-urbana-gold"
                      onClick={() => handlePrintReceipt('lojista')}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Via Lojista
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Botão Fechar */}
              <Button
                className="w-full bg-urbana-gold text-urbana-black font-bold h-14 text-lg"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeTransactionResult();
                }}
              >
                <X className="h-5 w-5 mr-2" />
                {transactionResult.status === 'aprovado' ? 'Fechar / Próxima Transação' : 'Fechar / Tentar Novamente'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
