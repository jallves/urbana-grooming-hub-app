/**
 * TEF Android Bridge
 * 
 * Interface JavaScript para comunicação com o app Android nativo
 * que integra com o SDK PayGo TEF Local e pinpad PPC930.
 */

// Tipos para a interface TEF Android
export interface TEFPaymentParams {
  ordemId: string;
  valorCentavos: number;
  metodo: 'debito' | 'credito' | 'credito_parcelado' | 'pix' | 'voucher';
  parcelas?: number;
}

export interface TEFResultado {
  status: 'aprovado' | 'negado' | 'cancelado' | 'erro';
  valor?: number;
  bandeira?: string;
  nsu?: string;
  autorizacao?: string;
  codigoResposta?: string;
  codigoErro?: string;
  mensagem?: string;
  comprovanteCliente?: string;
  comprovanteLojista?: string;
  ordemId?: string;
  timestamp?: number;
  // ID para confirmação manual (quando requiresConfirmation = true)
  confirmationTransactionId?: string;
  requiresConfirmation?: boolean;
}

export interface TEFPinpadStatus {
  conectado: boolean;
  modelo?: string;
  timestamp: number;
}

// Declaração global da interface TEF injetada pelo Android
declare global {
  interface Window {
    TEF?: {
      iniciarPagamento: (jsonParams: string) => void;
      cancelarPagamento: () => void;
      confirmarTransacao: (confirmationId: string, status: string) => void;
      verificarPinpad: () => string;
      getStatus: () => string;
      verificarPayGo: () => string;
      setModoDebug: (enabled: boolean) => void;
      getLogs: () => string;
      limparLogs: () => void;
      isReady: () => boolean;
    };
    Android?: {
      // Legacy Android interface
      [key: string]: unknown;
    };
    onTefResultado?: (resultado: TEFResultado) => void;
  }
}

// Callbacks registrados
type TEFResultCallback = (resultado: TEFResultado) => void;
type TEFPinpadCallback = (status: { modelo?: string; erro?: string }) => void;

let resultCallback: TEFResultCallback | null = null;
let pinpadConnectedCallback: TEFPinpadCallback | null = null;
let pinpadDisconnectedCallback: (() => void) | null = null;
let pinpadErrorCallback: TEFPinpadCallback | null = null;
let androidReadyCallback: ((version: string) => void) | null = null;

// Flag para evitar processamento duplicado
let lastProcessedResult: string | null = null;

/**
 * Inicializa listener global para resultados do PayGo
 * Chamado automaticamente quando o módulo é carregado
 */
function initGlobalPaymentListener() {
  // Listener para CustomEvent (backup)
  window.addEventListener('tefPaymentResult', ((event: CustomEvent) => {
    console.log('[TEFBridge] CustomEvent tefPaymentResult recebido:', event.detail);
    
    if (resultCallback && event.detail) {
      const resultKey = JSON.stringify(event.detail);
      if (lastProcessedResult !== resultKey) {
        lastProcessedResult = resultKey;
        resultCallback(event.detail);
      }
    }
  }) as EventListener);

  console.log('[TEFBridge] Global payment listener inicializado');
}

// Inicializar listener ao carregar módulo
if (typeof window !== 'undefined') {
  initGlobalPaymentListener();
}

/**
 * Verifica se estamos rodando dentro do WebView Android com TEF
 */
export function isAndroidTEFAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.TEF !== 'undefined';
}

/**
 * Verifica o status do pinpad
 */
export function verificarPinpad(): TEFPinpadStatus | null {
  if (!isAndroidTEFAvailable()) {
    return null;
  }
  
  try {
    const statusJson = window.TEF!.verificarPinpad();
    return JSON.parse(statusJson) as TEFPinpadStatus;
  } catch (error) {
    console.error('[TEFBridge] Erro ao verificar pinpad:', error);
    return null;
  }
}

/**
 * Inicia um pagamento TEF através do app Android
 * 
 * IMPORTANTE: Este método NÃO sobrescreve window.onTefResultado para evitar
 * conflito com useTEFPaymentResult que é o receptor principal.
 * Se nenhum hook estiver escutando, o resultado será armazenado no sessionStorage.
 */
export function iniciarPagamentoAndroid(
  params: TEFPaymentParams,
  onResult?: TEFResultCallback
): boolean {
  if (!isAndroidTEFAvailable()) {
    console.warn('[TEFBridge] TEF Android não disponível');
    return false;
  }
  
  // Limpar resultado anterior
  lastProcessedResult = null;
  
  // Registrar callback interno (backup)
  if (onResult) {
    resultCallback = onResult;
  }
  
  // NÃO sobrescrever window.onTefResultado aqui!
  // O hook useTEFPaymentResult é responsável por registrar o listener
  // Apenas garantir que existe um fallback se nenhum hook estiver ativo
  if (!window.onTefResultado) {
    console.log('[TEFBridge] Registrando fallback onTefResultado');
    window.onTefResultado = (resultado: TEFResultado | Record<string, unknown>) => {
      console.log('[TEFBridge] ═══════════════════════════════════════');
      console.log('[TEFBridge] RESULTADO DO PAYGO RECEBIDO (FALLBACK)');
      console.log('[TEFBridge] Dados brutos:', JSON.stringify(resultado, null, 2));
      
      // Normalizar resultado
      const normalizedResult = normalizePayGoResult(resultado as Record<string, unknown>);
      console.log('[TEFBridge] Resultado normalizado:', normalizedResult.status);
      
      // Salvar no sessionStorage para que useTEFPaymentResult possa capturar via polling
      try {
        sessionStorage.setItem('lastTefResult', JSON.stringify(normalizedResult));
        sessionStorage.setItem('lastTefResultTime', Date.now().toString());
        console.log('[TEFBridge] ✅ Resultado salvo no sessionStorage');
      } catch (e) {
        console.error('[TEFBridge] Erro ao salvar no sessionStorage:', e);
      }
      
      // Disparar evento customizado como backup adicional
      const event = new CustomEvent('tefPaymentResult', { detail: normalizedResult });
      window.dispatchEvent(event);
      document.dispatchEvent(event);
      console.log('[TEFBridge] ✅ CustomEvent tefPaymentResult disparado');
      
      console.log('[TEFBridge] ═══════════════════════════════════════');
    };
  } else {
    console.log('[TEFBridge] window.onTefResultado já registrado por outro hook');
  }
  
  try {
    const jsonParams = JSON.stringify({
      ordemId: params.ordemId,
      valorCentavos: params.valorCentavos,
      metodo: params.metodo,
      parcelas: params.parcelas || 1
    });
    
    console.log('[TEFBridge] Iniciando pagamento:', jsonParams);
    window.TEF!.iniciarPagamento(jsonParams);
    return true;
  } catch (error) {
    console.error('[TEFBridge] Erro ao iniciar pagamento:', error);
    resultCallback = null;
    return false;
  }
}

/**
 * Normaliza o resultado do PayGo para o formato esperado
 */
function normalizePayGoResult(raw: Record<string, unknown>): TEFResultado {
  // Se já tem status formatado, usar diretamente
  if (raw.status && typeof raw.status === 'string') {
    return {
      status: raw.status as TEFResultado['status'],
      valor: typeof raw.valor === 'number' ? raw.valor : 
             typeof raw.amount === 'number' ? raw.amount : undefined,
      bandeira: (raw.bandeira || raw.cardName || '') as string,
      nsu: (raw.nsu || raw.transactionNsu || '') as string,
      autorizacao: (raw.autorizacao || raw.authorizationCode || '') as string,
      codigoResposta: raw.transactionResult?.toString(),
      mensagem: (raw.mensagem || raw.resultMessage || '') as string,
      comprovanteCliente: (raw.comprovanteCliente || raw.cardholderReceipt || '') as string,
      comprovanteLojista: (raw.comprovanteLojista || raw.merchantReceipt || '') as string,
      ordemId: raw.ordemId as string,
      timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : Date.now(),
      // Dados de confirmação
      confirmationTransactionId: (raw.confirmationTransactionId || '') as string,
      requiresConfirmation: raw.requiresConfirmation === true || raw.requiresConfirmation === 'true'
    };
  }
  
  // Converter de formato PayGo bruto
  const transactionResult = typeof raw.transactionResult === 'number' 
    ? raw.transactionResult 
    : parseInt(raw.transactionResult as string || '-99', 10);
  
  let status: TEFResultado['status'];
  if (transactionResult === 0) {
    status = 'aprovado';
  } else if (transactionResult >= 1 && transactionResult <= 99) {
    status = 'negado';
  } else if (transactionResult === -1) {
    status = 'cancelado';
  } else {
    status = 'erro';
  }
  
  return {
    status,
    valor: typeof raw.amount === 'number' ? raw.amount : undefined,
    bandeira: (raw.cardName || '') as string,
    nsu: (raw.transactionNsu || '') as string,
    autorizacao: (raw.authorizationCode || '') as string,
    codigoResposta: transactionResult.toString(),
    mensagem: (raw.resultMessage || '') as string,
    comprovanteCliente: (raw.cardholderReceipt || '') as string,
    comprovanteLojista: (raw.merchantReceipt || '') as string,
    timestamp: Date.now(),
    // Dados de confirmação
    confirmationTransactionId: (raw.confirmationTransactionId || '') as string,
    requiresConfirmation: raw.requiresConfirmation === true || raw.requiresConfirmation === 'true'
  };
}

/**
 * Confirma uma transação TEF
 * Deve ser chamado APÓS enviar comprovante por e-mail/imprimir
 * 
 * @param confirmationId - ID de confirmação recebido na resposta do PayGo
 * @param status - Status da confirmação: CONFIRMADO_AUTOMATICO, CONFIRMADO_MANUAL, DESFEITO_MANUAL
 */
export function confirmarTransacaoTEF(
  confirmationId: string,
  status: 'CONFIRMADO_AUTOMATICO' | 'CONFIRMADO_MANUAL' | 'DESFEITO_MANUAL' = 'CONFIRMADO_AUTOMATICO'
): boolean {
  if (!isAndroidTEFAvailable()) {
    console.log('[TEFBridge] TEF não disponível - confirmação simulada');
    return true; // Em modo simulação, sempre sucesso
  }
  
  if (!confirmationId) {
    console.warn('[TEFBridge] confirmationId não fornecido');
    return false;
  }
  
  try {
    console.log('[TEFBridge] ═══════════════════════════════════════');
    console.log('[TEFBridge] CONFIRMANDO TRANSAÇÃO TEF');
    console.log('[TEFBridge] confirmationId:', confirmationId);
    console.log('[TEFBridge] status:', status);
    console.log('[TEFBridge] ═══════════════════════════════════════');
    
    window.TEF!.confirmarTransacao(confirmationId, status);
    
    console.log('[TEFBridge] ✅ Confirmação enviada com sucesso');
    return true;
  } catch (error) {
    console.error('[TEFBridge] ❌ Erro ao confirmar transação:', error);
    return false;
  }
}

/**
 * Desfaz uma transação TEF (antes de confirmar)
 * Usar quando há erro no checkout após aprovação do pagamento
 */
export function desfazerTransacaoTEF(confirmationId: string): boolean {
  return confirmarTransacaoTEF(confirmationId, 'DESFEITO_MANUAL');
}

/**
 * Cancela o pagamento TEF atual
 */
export function cancelarPagamentoAndroid(): boolean {
  if (!isAndroidTEFAvailable()) {
    console.warn('[TEFBridge] TEF Android não disponível');
    return false;
  }
  
  try {
    console.log('[TEFBridge] Cancelando pagamento');
    window.TEF!.cancelarPagamento();
    return true;
  } catch (error) {
    console.error('[TEFBridge] Erro ao cancelar pagamento:', error);
    return false;
  }
}

/**
 * Ativa/desativa modo debug
 */
export function setModoDebug(enabled: boolean): boolean {
  if (!isAndroidTEFAvailable()) {
    return false;
  }
  
  try {
    window.TEF!.setModoDebug(enabled);
    return true;
  } catch (error) {
    console.error('[TEFBridge] Erro ao configurar modo debug:', error);
    return false;
  }
}

/**
 * Obtém logs de debug do app Android
 */
export function getLogsAndroid(): string[] {
  if (!isAndroidTEFAvailable()) {
    return [];
  }
  
  try {
    const logsJson = window.TEF!.getLogs();
    const parsed = JSON.parse(logsJson);
    return parsed.logs || [];
  } catch (error) {
    console.error('[TEFBridge] Erro ao obter logs:', error);
    return [];
  }
}

/**
 * Limpa logs de debug
 */
export function limparLogsAndroid(): boolean {
  if (!isAndroidTEFAvailable()) {
    return false;
  }
  
  try {
    window.TEF!.limparLogs();
    return true;
  } catch (error) {
    console.error('[TEFBridge] Erro ao limpar logs:', error);
    return false;
  }
}

/**
 * Obtém status completo do serviço TEF
 */
export function getFullStatusAndroid(): Record<string, unknown> | null {
  if (!isAndroidTEFAvailable()) {
    return null;
  }
  
  try {
    if (window.TEF?.getStatus) {
      const statusJson = window.TEF.getStatus();
      return JSON.parse(statusJson);
    }
    return null;
  } catch (error) {
    console.error('[TEFBridge] Erro ao obter status:', error);
    return null;
  }
}

/**
 * Obtém informações do PayGo instalado
 */
export function getPayGoInfoAndroid(): Record<string, unknown> | null {
  if (!isAndroidTEFAvailable()) {
    return null;
  }
  
  try {
    if (window.TEF?.verificarPayGo) {
      const infoJson = window.TEF.verificarPayGo();
      return JSON.parse(infoJson);
    }
    return null;
  } catch (error) {
    console.error('[TEFBridge] Erro ao verificar PayGo:', error);
    return null;
  }
}

/**
 * Registra listeners para eventos do pinpad
 */
export function registrarListenersPinpad(options: {
  onConnected?: TEFPinpadCallback;
  onDisconnected?: () => void;
  onError?: TEFPinpadCallback;
  onAndroidReady?: (version: string) => void;
}): () => void {
  pinpadConnectedCallback = options.onConnected || null;
  pinpadDisconnectedCallback = options.onDisconnected || null;
  pinpadErrorCallback = options.onError || null;
  androidReadyCallback = options.onAndroidReady || null;
  
  // Handler para pinpad conectado
  const handlePinpadConnected = (event: CustomEvent) => {
    console.log('[TEFBridge] Pinpad conectado:', event.detail);
    if (pinpadConnectedCallback) {
      pinpadConnectedCallback(event.detail);
    }
  };
  
  // Handler para pinpad desconectado
  const handlePinpadDisconnected = () => {
    console.log('[TEFBridge] Pinpad desconectado');
    if (pinpadDisconnectedCallback) {
      pinpadDisconnectedCallback();
    }
  };
  
  // Handler para erro do pinpad
  const handlePinpadError = (event: CustomEvent) => {
    console.error('[TEFBridge] Erro do pinpad:', event.detail);
    if (pinpadErrorCallback) {
      pinpadErrorCallback(event.detail);
    }
  };
  
  // Handler para Android pronto
  const handleAndroidReady = (event: CustomEvent) => {
    console.log('[TEFBridge] Android TEF pronto:', event.detail);
    if (androidReadyCallback) {
      androidReadyCallback(event.detail?.version || '1.0.0');
    }
  };
  
  // Registrar event listeners
  window.addEventListener('tefPinpadConnected', handlePinpadConnected as EventListener);
  window.addEventListener('tefPinpadDisconnected', handlePinpadDisconnected);
  window.addEventListener('tefPinpadError', handlePinpadError as EventListener);
  window.addEventListener('tefAndroidReady', handleAndroidReady as EventListener);
  
  // Retornar função de cleanup
  return () => {
    window.removeEventListener('tefPinpadConnected', handlePinpadConnected as EventListener);
    window.removeEventListener('tefPinpadDisconnected', handlePinpadDisconnected);
    window.removeEventListener('tefPinpadError', handlePinpadError as EventListener);
    window.removeEventListener('tefAndroidReady', handleAndroidReady as EventListener);
    
    pinpadConnectedCallback = null;
    pinpadDisconnectedCallback = null;
    pinpadErrorCallback = null;
    androidReadyCallback = null;
  };
}

/**
 * Mapeia o método de pagamento para o formato esperado pelo Android
 */
export function mapPaymentMethod(
  paymentType: 'credit' | 'debit' | 'pix',
  installments?: number
): TEFPaymentParams['metodo'] {
  switch (paymentType) {
    case 'debit':
      return 'debito';
    case 'credit':
      return installments && installments > 1 ? 'credito_parcelado' : 'credito';
    case 'pix':
      return 'pix';
    default:
      return 'credito';
  }
}

/**
 * Converte valor em reais para centavos
 */
export function reaisToCentavos(valor: number): number {
  return Math.round(valor * 100);
}

/**
 * Converte centavos para reais
 */
export function centavosToReais(centavos: number): number {
  return centavos / 100;
}
