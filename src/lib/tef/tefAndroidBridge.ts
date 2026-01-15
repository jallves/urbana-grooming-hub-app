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

// Parâmetros para cancelamento de venda
export interface TEFCancelamentoParams {
  ordemId: string;
  valorCentavos: number;
  nsuOriginal: string;
  autorizacaoOriginal?: string;
}

// Declaração global da interface TEF injetada pelo Android
declare global {
  interface Window {
    TEF?: {
      iniciarPagamento: (jsonParams: string) => void;
      cancelarVenda: (jsonParams: string) => void;
      cancelarPagamento: () => void;
      confirmarTransacao: (confirmationId: string, status: string) => void;
      resolverPendencia: (status?: string) => void;
      // Método que recebe dados da pendência + status (NOVO - resolve o problema)
      resolverPendenciaComDados?: (pendingDataJson: string, status: string) => void;
      reimprimirUltimaTransacao: () => void;
      verificarPinpad: () => string;
      getStatus: () => string;
      verificarPayGo: () => string;
      setModoDebug: (enabled: boolean) => void;
      getLogs: () => string;
      limparLogs: () => void;
      isReady: () => boolean;
      // Métodos para gerenciamento de pendências (Passos 33/34)
      getPendingInfo?: () => string;
      salvarConfirmationId?: (confirmationId: string, nsu: string, autorizacao: string) => void;
      limparConfirmationId?: () => void;
      // Salvar dados de pendência no APK (para resolução posterior)
      salvarPendingData?: (pendingDataJson: string) => void;
      // NOVO: Limpar dados de pendência após validação bem-sucedida
      limparPendingData?: () => void;
      // NOVO: Operação administrativa - pode resolver pendências
      iniciarAdministrativa?: () => void;
      // ===== PASSOS 33/34 - GERENCIADOR OBRIGATÓRIO =====
      // Gate: verifica se pode iniciar nova transação
      canStartTransaction?: () => boolean;
      hasPendingTransaction?: () => boolean;
      getPendingTransactionInfo?: () => string;
      // Salvar transação aprovada para confirmação posterior
      saveApprovedTransaction?: (jsonParams: string) => void;
      // Marcar status da impressão
      markPrintSuccess?: () => void;
      markPrintFailure?: () => void;
      // Confirmar/Desfazer transação aprovada
      confirmApprovedTransaction?: () => void;
      undoApprovedTransaction?: (reason: string) => void;
      // Resolver pendência existente
      resolvePendingTransaction?: (action: string) => void;
      autoResolvePending?: () => void;
      clearPendingTransaction?: () => void;
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
 * IMPORTANTE: Este método verifica se window.onTefResultado já está registrado
 * por um hook (ex: useTEFAndroid). Se não estiver, registra um fallback.
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
  
  // Verificar se já existe um handler registrado
  const existingHandler = (window as any).onTefResultado;
  const hasExistingHandler = typeof existingHandler === 'function';
  
  console.log('[TEFBridge] ═══════════════════════════════════════');
  console.log('[TEFBridge] Verificando handler existente:', hasExistingHandler);
  
  // Se NÃO existe handler, registrar fallback que salva no sessionStorage
  if (!hasExistingHandler) {
    console.log('[TEFBridge] Registrando fallback onTefResultado');
    (window as any).onTefResultado = (resultado: TEFResultado | Record<string, unknown>) => {
      console.log('[TEFBridge] ═══════════════════════════════════════');
      console.log('[TEFBridge] RESULTADO DO PAYGO RECEBIDO (FALLBACK)');
      console.log('[TEFBridge] Dados brutos:', JSON.stringify(resultado, null, 2));
      
      // Normalizar resultado
      const normalizedResult = normalizePayGoResult(resultado as Record<string, unknown>);
      console.log('[TEFBridge] Resultado normalizado:', normalizedResult.status);
      
      // Salvar no sessionStorage para que hooks possam capturar
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
      
      // Chamar callback interno se existir
      if (resultCallback) {
        console.log('[TEFBridge] Chamando callback interno');
        resultCallback(normalizedResult);
        resultCallback = null;
      }
      
      console.log('[TEFBridge] ═══════════════════════════════════════');
    };
  } else {
    console.log('[TEFBridge] Handler já registrado por hook, usando existente');
  }
  console.log('[TEFBridge] ═══════════════════════════════════════');
  
  try {
    const jsonParams = JSON.stringify({
      ordemId: params.ordemId,
      valorCentavos: params.valorCentavos,
      metodo: params.metodo,
      parcelas: params.parcelas || 1
    });
    
    console.log('[TEFBridge] ═══════════════════════════════════════');
    console.log('[TEFBridge] INICIANDO PAGAMENTO TEF');
    console.log('[TEFBridge] Parâmetros:', jsonParams);
    console.log('[TEFBridge] ═══════════════════════════════════════');
    
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
 * Resolve transação pendente no PayGo
 * Conforme documentação PayGo (Passos 33/34):
 * 
 * FLUXO SDK PayGo:
 * 1. saidaTransacao.existeTransacaoPendente() → verifica se há pendência
 * 2. saidaTransacao.obtemDadosTransacaoPendente() → obtém DadosTransacaoPendente
 * 3. confirmacao.informaStatusTransacao(StatusTransacao.CONFIRMADO_MANUAL ou DESFEITO_MANUAL)
 * 4. transacao.resolvePendencia(dadosPendencia, confirmacao) → resolve a pendência
 * 
 * IMPORTANTE: Os dados de pendência devem ser passados do JavaScript para o APK
 * porque o APK pode perder esses dados se o app for reiniciado.
 * 
 * @param acao - 'confirmar' para CONFIRMADO_MANUAL, 'desfazer' para DESFEITO_MANUAL
 * @param confirmationId - ID da transação pendente (opcional)
 * @param pendingDataFromJS - Dados da pendência vindos do JavaScript (opcional, mas importante!)
 */
export function resolverPendenciaAndroid(
  acao: 'confirmar' | 'desfazer' = 'confirmar',
  confirmationId?: string,
  pendingDataFromJS?: Record<string, unknown>
): boolean {
  if (!isAndroidTEFAvailable()) {
    console.warn('[TEFBridge] TEF Android não disponível');
    return false;
  }
  
  const status = acao === 'confirmar' ? 'CONFIRMADO_MANUAL' : 'DESFEITO_MANUAL';
  
  try {
    console.log('[TEFBridge] ╔═══════════════════════════════════════════════════════════╗');
    console.log('[TEFBridge] ║         RESOLUÇÃO DE PENDÊNCIA PayGo via URI              ║');
    console.log('[TEFBridge] ╠═══════════════════════════════════════════════════════════╣');
    console.log('[TEFBridge] ║ Ação:', acao.toUpperCase().padEnd(52), '║');
    console.log('[TEFBridge] ║ Status:', status.padEnd(50), '║');
    console.log('[TEFBridge] ╚═══════════════════════════════════════════════════════════╝');
    
    // ========================================================================
    // PASSO 1: Obter dados de pendência (ordem de prioridade)
    // 1. Dados passados diretamente do JS (pendingDataFromJS)
    // 2. Dados salvos no localStorage (pendência capturada anteriormente)
    // 3. Dados do APK (getPendingInfo)
    // ========================================================================
    
    // Tentar obter dados salvos no localStorage primeiro
    const savedPendingData = getSavedPendingDataFromLocalStorage();
    
    // Usar dados na ordem de prioridade
    let dataToUse = pendingDataFromJS || savedPendingData || null;
    
    // ========================================================================
    // APLICAR FALLBACKS NOS DADOS DE PENDÊNCIA
    // Conforme documentação PayGo: transactionNsu e hostNsu são MANDATÓRIOS
    // Se vazios, usar localNsu como fallback
    // ========================================================================
    if (dataToUse) {
      const localNsu = String(dataToUse.localNsu || '').trim();
      const transactionNsu = String(dataToUse.transactionNsu || '').trim() || localNsu;
      const hostNsu = String(dataToUse.hostNsu || '').trim() || transactionNsu;
      
      dataToUse = {
        ...dataToUse,
        localNsu,
        transactionNsu,
        hostNsu,
      };
      
      console.log('[TEFBridge] 📊 Dados de pendência (COM FALLBACKS APLICADOS):');
      console.log('[TEFBridge]   - providerName:', dataToUse.providerName);
      console.log('[TEFBridge]   - merchantId:', dataToUse.merchantId);
      console.log('[TEFBridge]   - localNsu:', localNsu);
      console.log('[TEFBridge]   - transactionNsu:', transactionNsu, transactionNsu === localNsu ? '(fallback)' : '');
      console.log('[TEFBridge]   - hostNsu:', hostNsu, hostNsu === transactionNsu ? '(fallback)' : '');
    } else {
      console.log('[TEFBridge] ⚠️ Nenhum dado de pendência disponível');
    }
    
    // ========================================================================
    // PASSO 2: Montar e enviar URI de resolução via APK
    // Formato conforme documentação PayGo:
    // URI Pendência: app://resolve/pendingTransaction?merchantId=xxx&providerName=xxx&...
    // URI Confirmação: app://resolve/confirmation?transactionStatus=xxx
    // ========================================================================
    
    if (dataToUse && hasRequiredPendingFields(dataToUse)) {
      // Temos dados válidos - usar resolverPendenciaComDados
      if (typeof (window.TEF as any).resolverPendenciaComDados === 'function') {
        const pendingDataJson = JSON.stringify(dataToUse);
        console.log('[TEFBridge] 🔄 Chamando resolverPendenciaComDados...');
        console.log('[TEFBridge] Dados JSON:', pendingDataJson);
        (window.TEF as any).resolverPendenciaComDados(pendingDataJson, status);
        console.log('[TEFBridge] ✅ Resolução de pendência enviada via URI');
        
        // Limpar dados salvos após resolução
        clearSavedPendingData();
        return true;
      }
    }
    
    // ========================================================================
    // FALLBACK: Tentar via resolverPendencia simples
    // O APK tentará buscar os dados internamente
    // ========================================================================
    if (typeof window.TEF!.resolverPendencia === 'function') {
      console.log('[TEFBridge] 🔄 Chamando resolverPendencia(' + status + ')...');
      window.TEF!.resolverPendencia(status);
      console.log('[TEFBridge] ✅ resolverPendencia chamado');
      clearSavedPendingData();
      return true;
    }
    
    // ========================================================================
    // ÚLTIMO RECURSO: confirmarTransacao
    // ========================================================================
    const idToUse = confirmationId || dataToUse?.confirmationTransactionId as string || 'PENDING';
    console.log('[TEFBridge] 🔄 Chamando confirmarTransacao(' + idToUse + ', ' + status + ')...');
    window.TEF!.confirmarTransacao(idToUse, status);
    console.log('[TEFBridge] ✅ confirmarTransacao chamado');
    clearSavedPendingData();
    
    return true;
  } catch (error) {
    console.error('[TEFBridge] ❌ Erro ao resolver pendência:', error);
    return false;
  }
}

/**
 * Verifica se os dados de pendência têm os campos obrigatórios para a URI
 * Conforme documentação PayGo (seção 3.3.4):
 * - providerName (M - Mandatório)
 * - merchantId (M - Mandatório)
 * - localNsu (M - Mandatório)
 * - transactionNsu (M - Mandatório) - pode usar fallback do localNsu
 * - hostNsu (M - Mandatório) - pode usar fallback do transactionNsu
 */
function hasRequiredPendingFields(data: Record<string, unknown>): boolean {
  // Campos básicos obrigatórios (devem existir originalmente)
  const basicFields = ['providerName', 'merchantId', 'localNsu'];
  const hasBasicFields = basicFields.every(field => {
    const value = data[field];
    return value && typeof value === 'string' && value.trim() !== '';
  });
  
  // transactionNsu e hostNsu podem vir via fallback do localNsu
  // então verificamos se têm valor (que pode ser o fallback)
  const hasTransactionNsu = data.transactionNsu && 
    typeof data.transactionNsu === 'string' && 
    data.transactionNsu.trim() !== '';
  const hasHostNsu = data.hostNsu && 
    typeof data.hostNsu === 'string' && 
    data.hostNsu.trim() !== '';
  
  const hasRequired = hasBasicFields && hasTransactionNsu && hasHostNsu;
  
  console.log('[TEFBridge] Verificação de campos obrigatórios:', {
    providerName: data.providerName || '(vazio)',
    merchantId: data.merchantId || '(vazio)',
    localNsu: data.localNsu || '(vazio)',
    transactionNsu: data.transactionNsu || '(vazio)',
    hostNsu: data.hostNsu || '(vazio)',
    hasBasicFields,
    hasTransactionNsu,
    hasHostNsu,
    hasRequired
  });
  
  return hasRequired;
}

/**
 * Salva dados de pendência no localStorage para uso posterior
 * IMPORTANTE: Chamar quando receber resposta do PayGo com dados de pendência
 * 
 * REGRA PayGo: Os campos transactionNsu e hostNsu são MANDATÓRIOS para resolução.
 * Se vierem vazios (comum no erro -2599), usamos localNsu como fallback.
 */
export function savePendingDataToLocalStorage(data: Record<string, unknown>): void {
  try {
    // Extrair dados brutos com múltiplas fontes possíveis
    const rawLocalNsu = String(data.localNsu || data.terminalNsu || data.localReference || '').trim();
    const rawTransactionNsu = String(data.transactionNsu || data.nsu || '').trim();
    const rawHostNsu = String(data.hostNsu || '').trim();
    
    // APLICAR FALLBACKS CONFORME DOCUMENTAÇÃO PayGo:
    // Se transactionNsu está vazio, usar localNsu
    // Se hostNsu está vazio, usar transactionNsu (ou localNsu se também vazio)
    const localNsu = rawLocalNsu;
    const transactionNsu = rawTransactionNsu || localNsu;
    const hostNsu = rawHostNsu || transactionNsu;
    
    const pendingData = {
      providerName: String(data.providerName || data.provider || '').trim(),
      merchantId: String(data.merchantId || '').trim(),
      localNsu: localNsu,
      transactionNsu: transactionNsu,
      hostNsu: hostNsu,
      confirmationTransactionId: String(data.confirmationTransactionId || '').trim(),
      timestamp: Date.now(),
      // Guardar valores originais para debug
      _rawTransactionNsu: rawTransactionNsu,
      _rawHostNsu: rawHostNsu,
      _fallbackApplied: rawTransactionNsu === '' || rawHostNsu === ''
    };
    
    console.log('[TEFBridge] ╔═══════════════════════════════════════════════════════════╗');
    console.log('[TEFBridge] ║     SALVANDO DADOS DE PENDÊNCIA (com fallbacks)          ║');
    console.log('[TEFBridge] ╠═══════════════════════════════════════════════════════════╣');
    console.log('[TEFBridge] ║ providerName:', pendingData.providerName.padEnd(44), '║');
    console.log('[TEFBridge] ║ merchantId:', pendingData.merchantId.padEnd(46), '║');
    console.log('[TEFBridge] ║ localNsu:', localNsu.padEnd(48), '║');
    console.log('[TEFBridge] ║ transactionNsu:', transactionNsu, rawTransactionNsu === '' ? '(fallback)' : '', '║');
    console.log('[TEFBridge] ║ hostNsu:', hostNsu, rawHostNsu === '' ? '(fallback)' : '', '║');
    console.log('[TEFBridge] ║ fallbackApplied:', pendingData._fallbackApplied, '║');
    console.log('[TEFBridge] ╚═══════════════════════════════════════════════════════════╝');
    
    localStorage.setItem('tef_pending_data', JSON.stringify(pendingData));
    console.log('[TEFBridge] ✅ Dados de pendência salvos no localStorage');
  } catch (error) {
    console.error('[TEFBridge] Erro ao salvar dados de pendência:', error);
  }
}

/**
 * Obtém dados de pendência salvos no localStorage
 * APLICA FALLBACKS automaticamente para garantir que campos obrigatórios estejam preenchidos
 * 
 * PRIORIDADE (conforme feedback PayGo):
 * 1. tef_real_pending_data: Dados do "TransacaoPendenteDados" recebidos do PayGo
 *    (estes são os dados da transação PENDENTE REAL, não da transação em curso)
 * 2. tef_pending_data: Dados salvos pelo frontend (pode ser da transação em curso)
 */
function getSavedPendingDataFromLocalStorage(): Record<string, unknown> | null {
  try {
    // ========================================================================
    // PRIORIDADE 1: Dados do TransacaoPendenteDados (REAL pending data)
    // Estes vêm diretamente do PayGo quando detecta uma pendência
    // ========================================================================
    const realPendingData = localStorage.getItem('tef_real_pending_data');
    if (realPendingData) {
      const data = JSON.parse(realPendingData);
      // Verificar se não está muito antigo (30 minutos)
      const capturedAt = data._capturedAt ? new Date(data._capturedAt).getTime() : 0;
      const isRecent = capturedAt && (Date.now() - capturedAt) < 30 * 60 * 1000;
      
      if (isRecent || data.providerName) {
        // Aplicar fallbacks
        const localNsu = String(data.localNsu || '').trim();
        const transactionNsu = String(data.transactionNsu || '').trim() || localNsu;
        const hostNsu = String(data.hostNsu || '').trim() || transactionNsu;
        
        const dataWithFallbacks = {
          ...data,
          localNsu,
          transactionNsu,
          hostNsu,
          _source: 'TransacaoPendenteDados',
        };
        
        console.log('[TEFBridge] ╔═══════════════════════════════════════════════════════════╗');
        console.log('[TEFBridge] ║  📥 DADOS DE PENDÊNCIA REAL (TransacaoPendenteDados)      ║');
        console.log('[TEFBridge] ╠═══════════════════════════════════════════════════════════╣');
        console.log('[TEFBridge] ║ providerName:', dataWithFallbacks.providerName);
        console.log('[TEFBridge] ║ merchantId:', dataWithFallbacks.merchantId);
        console.log('[TEFBridge] ║ localNsu:', dataWithFallbacks.localNsu);
        console.log('[TEFBridge] ║ transactionNsu:', dataWithFallbacks.transactionNsu);
        console.log('[TEFBridge] ║ hostNsu:', dataWithFallbacks.hostNsu);
        console.log('[TEFBridge] ╚═══════════════════════════════════════════════════════════╝');
        
        return dataWithFallbacks;
      } else {
        console.log('[TEFBridge] ⚠️ Dados de pendência REAL muito antigos, descartando');
        localStorage.removeItem('tef_real_pending_data');
        sessionStorage.removeItem('tef_real_pending_data');
      }
    }
    
    // ========================================================================
    // PRIORIDADE 2: Dados salvos pelo frontend (fallback)
    // ========================================================================
    const saved = localStorage.getItem('tef_pending_data');
    if (saved) {
      const data = JSON.parse(saved);
      // Verificar se não está muito antigo (30 minutos)
      if (data.timestamp && (Date.now() - data.timestamp) < 30 * 60 * 1000) {
        // Aplicar fallbacks novamente por segurança
        const localNsu = String(data.localNsu || '').trim();
        const transactionNsu = String(data.transactionNsu || '').trim() || localNsu;
        const hostNsu = String(data.hostNsu || '').trim() || transactionNsu;
        
        const dataWithFallbacks = {
          ...data,
          localNsu,
          transactionNsu,
          hostNsu,
          _source: 'frontend_saved',
        };
        
        console.log('[TEFBridge] 📥 Dados de pendência (frontend) recuperados:', {
          providerName: dataWithFallbacks.providerName,
          merchantId: dataWithFallbacks.merchantId,
          localNsu: dataWithFallbacks.localNsu,
          transactionNsu: dataWithFallbacks.transactionNsu,
          hostNsu: dataWithFallbacks.hostNsu,
        });
        
        return dataWithFallbacks;
      } else {
        console.log('[TEFBridge] ⚠️ Dados de pendência muito antigos, descartando');
        localStorage.removeItem('tef_pending_data');
      }
    }
  } catch (error) {
    console.error('[TEFBridge] Erro ao recuperar dados de pendência:', error);
  }
  return null;
}

/**
 * Limpa dados de pendência salvos no localStorage
 * IMPORTANTE: Limpa TODOS os dados relacionados a pendências
 */
export function clearSavedPendingData(): void {
  try {
    // Limpar dados de pendência principal
    localStorage.removeItem('tef_pending_data');
    
    // CRÍTICO: Limpar dados do TransacaoPendenteDados (pendência REAL)
    localStorage.removeItem('tef_real_pending_data');
    sessionStorage.removeItem('tef_real_pending_data');
    
    // CRÍTICO: Também limpar confirmationId e dados relacionados
    // Esses dados são usados na verificação de pendência em checkPending()
    localStorage.removeItem('tef_last_confirmation_id');
    localStorage.removeItem('tef_last_nsu');
    localStorage.removeItem('tef_last_autorizacao');
    localStorage.removeItem('tef_last_timestamp');
    
    // Limpar estados do hook
    localStorage.removeItem('tef_venda_state');
    localStorage.removeItem('tef_pending_state');
    
    console.log('[TEFBridge] 🗑️ TODOS os dados de pendência limpos do localStorage');
  } catch (error) {
    console.error('[TEFBridge] Erro ao limpar dados de pendência:', error);
  }
}

/**
 * Limpa dados de pendência do APK E do localStorage
 * IMPORTANTE: Chamar SOMENTE após confirmar que o PayGo realmente processou a resolução
 */
export function limparPendingDataCompleto(): void {
  console.log('[TEFBridge] ╔═══════════════════════════════════════════════════════════╗');
  console.log('[TEFBridge] ║      LIMPANDO DADOS DE PENDÊNCIA (APK + LocalStorage)     ║');
  console.log('[TEFBridge] ╚═══════════════════════════════════════════════════════════╝');
  
  // 1. Limpar localStorage
  clearSavedPendingData();
  
  // 2. Limpar APK (se disponível)
  if (isAndroidTEFAvailable() && typeof (window.TEF as any).limparPendingData === 'function') {
    try {
      console.log('[TEFBridge] 🔄 Chamando TEF.limparPendingData() no APK...');
      (window.TEF as any).limparPendingData();
      console.log('[TEFBridge] ✅ Dados do APK limpos');
    } catch (error) {
      console.error('[TEFBridge] Erro ao limpar dados do APK:', error);
    }
  } else if (isAndroidTEFAvailable() && window.TEF!.limparConfirmationId) {
    // Fallback: limpar pelo menos o confirmationId
    try {
      window.TEF!.limparConfirmationId();
      console.log('[TEFBridge] ✅ ConfirmationId do APK limpo (fallback)');
    } catch (error) {
      console.error('[TEFBridge] Erro ao limpar confirmationId:', error);
    }
  }
  
  // 3. Limpar localStorage adicional
  try {
    localStorage.removeItem('tef_last_confirmation_id');
    localStorage.removeItem('tef_last_nsu');
    localStorage.removeItem('tef_last_autorizacao');
    localStorage.removeItem('tef_last_timestamp');
    console.log('[TEFBridge] ✅ Dados adicionais do localStorage limpos');
  } catch (error) {
    console.error('[TEFBridge] Erro ao limpar dados adicionais:', error);
  }
}

/**
 * Salva o confirmationId da transação aprovada para uso posterior
 * IMPORTANTE: Chamar após cada transação aprovada no Passo 33
 */
export function salvarConfirmationIdAndroid(
  confirmationId: string,
  nsu: string,
  autorizacao: string
): boolean {
  if (!isAndroidTEFAvailable()) {
    console.log('[TEFBridge] TEF não disponível - salvando em localStorage');
    try {
      localStorage.setItem('tef_last_confirmation_id', confirmationId);
      localStorage.setItem('tef_last_nsu', nsu);
      localStorage.setItem('tef_last_autorizacao', autorizacao);
      localStorage.setItem('tef_last_timestamp', Date.now().toString());
    } catch (e) {
      console.error('[TEFBridge] Erro ao salvar em localStorage:', e);
    }
    return true;
  }
  
  try {
    console.log('[TEFBridge] Salvando confirmationId:', confirmationId);
    if (window.TEF!.salvarConfirmationId) {
      window.TEF!.salvarConfirmationId(confirmationId, nsu, autorizacao);
    }
    // Também salvar em localStorage como backup
    localStorage.setItem('tef_last_confirmation_id', confirmationId);
    localStorage.setItem('tef_last_nsu', nsu);
    return true;
  } catch (error) {
    console.error('[TEFBridge] Erro ao salvar confirmationId:', error);
    return false;
  }
}

/**
 * Obtém informações sobre pendências do PayGo
 */
export function getPendingInfoAndroid(): Record<string, unknown> | null {
  if (!isAndroidTEFAvailable() || !window.TEF!.getPendingInfo) {
    // Retornar dados do localStorage como fallback
    const confirmationId = localStorage.getItem('tef_last_confirmation_id');
    return {
      hasPendingData: false,
      lastConfirmationId: confirmationId,
      lastNsu: localStorage.getItem('tef_last_nsu'),
      source: 'localStorage'
    };
  }
  
  try {
    const infoJson = window.TEF!.getPendingInfo();
    return JSON.parse(infoJson);
  } catch (error) {
    console.error('[TEFBridge] Erro ao obter pendingInfo:', error);
    return null;
  }
}

/**
 * Cancela o pagamento TEF atual (em andamento)
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
 * Cancela uma venda já realizada anteriormente (Passo 21 - Cancelamento)
 * 
 * @param params - Parâmetros do cancelamento:
 *   - ordemId: ID da ordem de cancelamento
 *   - valorCentavos: Valor original em centavos
 *   - nsuOriginal: NSU da transação original
 *   - autorizacaoOriginal: Código de autorização original (opcional)
 * @param onResult - Callback para resultado
 */
export function cancelarVendaAndroid(
  params: TEFCancelamentoParams,
  onResult?: TEFResultCallback
): boolean {
  if (!isAndroidTEFAvailable()) {
    console.warn('[TEFBridge] TEF Android não disponível');
    return false;
  }
  
  // Limpar resultado anterior
  lastProcessedResult = null;
  
  // Registrar callback interno
  if (onResult) {
    resultCallback = onResult;
  }
  
  // Verificar se já existe um handler registrado
  const existingHandler = (window as any).onTefResultado;
  const hasExistingHandler = typeof existingHandler === 'function';
  
  console.log('[TEFBridge] ═══════════════════════════════════════');
  console.log('[TEFBridge] INICIANDO CANCELAMENTO DE VENDA');
  console.log('[TEFBridge] Handler existente:', hasExistingHandler);
  console.log('[TEFBridge] Callback direto registrado:', !!onResult);
  
  // SEMPRE sobrescrever o handler para garantir que o callback seja chamado
  // Guardar referência do handler existente para chamar depois
  const originalHandler = hasExistingHandler ? existingHandler : null;
  
  (window as any).onTefResultado = (resultado: TEFResultado | Record<string, unknown>) => {
    console.log('[TEFBridge] ═══════════════════════════════════════');
    console.log('[TEFBridge] RESULTADO DO CANCELAMENTO RECEBIDO');
    console.log('[TEFBridge] Dados brutos:', JSON.stringify(resultado, null, 2));
    
    const normalizedResult = normalizePayGoResult(resultado as Record<string, unknown>);
    console.log('[TEFBridge] Resultado normalizado:', normalizedResult.status);
    
    // Salvar no sessionStorage
    try {
      sessionStorage.setItem('lastTefResult', JSON.stringify(normalizedResult));
      sessionStorage.setItem('lastTefResultTime', Date.now().toString());
    } catch (e) {
      console.error('[TEFBridge] Erro ao salvar no sessionStorage:', e);
    }
    
    // Disparar evento
    const event = new CustomEvent('tefPaymentResult', { detail: normalizedResult });
    window.dispatchEvent(event);
    document.dispatchEvent(event);
    
    // IMPORTANTE: Chamar o callback direto primeiro (o que foi passado para cancelarVendaAndroid)
    if (resultCallback) {
      console.log('[TEFBridge] ✅ Chamando callback direto do cancelamento');
      resultCallback(normalizedResult);
      resultCallback = null;
    }
    
    // Restaurar handler original se existia
    if (originalHandler) {
      console.log('[TEFBridge] Restaurando handler original');
      (window as any).onTefResultado = originalHandler;
    }
    
    console.log('[TEFBridge] ═══════════════════════════════════════');
  };
  
  try {
    const jsonParams = JSON.stringify({
      ordemId: params.ordemId,
      valorCentavos: params.valorCentavos,
      nsuOriginal: params.nsuOriginal,
      autorizacaoOriginal: params.autorizacaoOriginal || ''
    });
    
    console.log('[TEFBridge] Parâmetros cancelamento:', jsonParams);
    console.log('[TEFBridge] ═══════════════════════════════════════');
    
    window.TEF!.cancelarVenda(jsonParams);
    return true;
  } catch (error) {
    console.error('[TEFBridge] Erro ao cancelar venda:', error);
    resultCallback = null;
    return false;
  }
}

/**
 * Solicita reimpressão do último comprovante
 * Conforme documentação PayGo: operation=REIMPRESSAO
 * 
 * @param onResult - Callback para resultado (inclui comprovantes)
 */
export function reimprimirUltimaTransacaoAndroid(
  onResult?: TEFResultCallback
): boolean {
  if (!isAndroidTEFAvailable()) {
    console.warn('[TEFBridge] TEF Android não disponível');
    return false;
  }
  
  // Registrar callback interno (backup)
  if (onResult) {
    resultCallback = onResult;
  }
  
  // Verificar se já existe um handler registrado
  const existingHandler = (window as any).onTefResultado;
  const hasExistingHandler = typeof existingHandler === 'function';
  
  console.log('[TEFBridge] ═══════════════════════════════════════');
  console.log('[TEFBridge] SOLICITANDO REIMPRESSÃO');
  console.log('[TEFBridge] Handler existente:', hasExistingHandler);
  
  // Se NÃO existe handler, registrar fallback
  if (!hasExistingHandler) {
    console.log('[TEFBridge] Registrando fallback para reimpressão');
    (window as any).onTefResultado = (resultado: TEFResultado | Record<string, unknown>) => {
      console.log('[TEFBridge] ═══════════════════════════════════════');
      console.log('[TEFBridge] RESULTADO DA REIMPRESSÃO RECEBIDO');
      console.log('[TEFBridge] Dados brutos:', JSON.stringify(resultado, null, 2));
      
      const normalizedResult = normalizePayGoResult(resultado as Record<string, unknown>);
      
      // Salvar no sessionStorage
      try {
        sessionStorage.setItem('lastTefResult', JSON.stringify(normalizedResult));
        sessionStorage.setItem('lastTefResultTime', Date.now().toString());
      } catch (e) {
        console.error('[TEFBridge] Erro ao salvar no sessionStorage:', e);
      }
      
      // Disparar evento
      const event = new CustomEvent('tefPaymentResult', { detail: normalizedResult });
      window.dispatchEvent(event);
      document.dispatchEvent(event);
      
      if (resultCallback) {
        resultCallback(normalizedResult);
        resultCallback = null;
      }
      
      console.log('[TEFBridge] ═══════════════════════════════════════');
    };
  }
  
  try {
    console.log('[TEFBridge] Chamando reimprimirUltimaTransacao()...');
    console.log('[TEFBridge] ═══════════════════════════════════════');
    
    window.TEF!.reimprimirUltimaTransacao();
    return true;
  } catch (error) {
    console.error('[TEFBridge] Erro ao reimprimir:', error);
    resultCallback = null;
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
 * Inicia operação ADMINISTRATIVA do PayGo
 * Esta operação abre o menu administrativo onde é possível:
 * - Resolver transações pendentes manualmente
 * - Verificar status do terminal
 * - Outras funções administrativas
 * 
 * IMPORTANTE: Usar quando o broadcast de resolução não funcionar
 */
export function iniciarAdministrativaAndroid(
  onResult?: TEFResultCallback
): boolean {
  if (!isAndroidTEFAvailable()) {
    console.warn('[TEFBridge] TEF Android não disponível');
    return false;
  }
  
  // Registrar callback interno (backup)
  if (onResult) {
    resultCallback = onResult;
  }
  
  console.log('[TEFBridge] ═══════════════════════════════════════');
  console.log('[TEFBridge] INICIANDO OPERAÇÃO ADMINISTRATIVA');
  console.log('[TEFBridge] Esta operação pode resolver pendências!');
  console.log('[TEFBridge] ═══════════════════════════════════════');
  
  // Verificar se já existe um handler registrado
  const existingHandler = (window as any).onTefResultado;
  const hasExistingHandler = typeof existingHandler === 'function';
  
  // Se NÃO existe handler, registrar fallback
  if (!hasExistingHandler) {
    console.log('[TEFBridge] Registrando fallback para administrativa');
    (window as any).onTefResultado = (resultado: TEFResultado | Record<string, unknown>) => {
      console.log('[TEFBridge] ═══════════════════════════════════════');
      console.log('[TEFBridge] RESULTADO DA ADMINISTRATIVA RECEBIDO');
      console.log('[TEFBridge] Dados brutos:', JSON.stringify(resultado, null, 2));
      
      const normalizedResult = normalizePayGoResult(resultado as Record<string, unknown>);
      
      // Salvar no sessionStorage
      try {
        sessionStorage.setItem('lastTefResult', JSON.stringify(normalizedResult));
        sessionStorage.setItem('lastTefResultTime', Date.now().toString());
      } catch (e) {
        console.error('[TEFBridge] Erro ao salvar no sessionStorage:', e);
      }
      
      // Disparar evento
      const event = new CustomEvent('tefPaymentResult', { detail: normalizedResult });
      window.dispatchEvent(event);
      
      // Chamar callback se existir
      if (resultCallback) {
        console.log('[TEFBridge] ✅ Chamando callback da administrativa');
        resultCallback(normalizedResult);
        resultCallback = null;
      }
      
      console.log('[TEFBridge] ═══════════════════════════════════════');
    };
  }
  
  try {
    if (typeof (window.TEF as any).iniciarAdministrativa === 'function') {
      (window.TEF as any).iniciarAdministrativa();
      console.log('[TEFBridge] ✅ Operação administrativa iniciada');
      return true;
    } else {
      console.error('[TEFBridge] ❌ Método iniciarAdministrativa não disponível no APK');
      console.error('[TEFBridge] É necessário atualizar o APK para usar esta função');
      return false;
    }
  } catch (error) {
    console.error('[TEFBridge] Erro ao iniciar administrativa:', error);
    resultCallback = null;
    return false;
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

// ============================================================================
// PASSOS 33/34 - FUNÇÕES DE GERENCIAMENTO DE PENDÊNCIA (OBRIGATÓRIO PayGo)
// ============================================================================

/**
 * Interface para informações de pendência do novo gerenciador
 */
export interface PendingTransactionInfo {
  hasPending: boolean;
  canStartTransaction: boolean;
  pending?: {
    confirmationId: string;
    nsu: string;
    autorizacao: string;
    valor: number;
    status: string;
    timestamp: number;
  };
}

/**
 * GATE OBRIGATÓRIO: Verifica se pode iniciar nova transação
 * Retorna FALSE se há pendência que precisa ser resolvida primeiro
 * 
 * REGRA PayGo: ANTES de qualquer venda, verificar pendência!
 */
export function canStartNewTransaction(): boolean {
  if (!isAndroidTEFAvailable()) {
    console.log('[TEFBridge] TEF não disponível - permitindo transação');
    return true;
  }
  
  try {
    if (typeof (window.TEF as any).canStartTransaction === 'function') {
      const canStart = (window.TEF as any).canStartTransaction();
      console.log('[TEFBridge] canStartTransaction:', canStart);
      return canStart;
    }
  } catch (error) {
    console.error('[TEFBridge] Erro ao verificar canStartTransaction:', error);
  }
  
  return true;
}

/**
 * Verifica se existe pendência no sistema
 */
export function hasPendingTransactionAndroid(): boolean {
  if (!isAndroidTEFAvailable()) {
    return false;
  }
  
  try {
    if (typeof (window.TEF as any).hasPendingTransaction === 'function') {
      return (window.TEF as any).hasPendingTransaction();
    }
  } catch (error) {
    console.error('[TEFBridge] Erro ao verificar hasPendingTransaction:', error);
  }
  
  return false;
}

/**
 * Obtém informações detalhadas sobre a pendência atual
 */
export function getPendingTransactionInfoAndroid(): PendingTransactionInfo | null {
  if (!isAndroidTEFAvailable()) {
    return null;
  }
  
  try {
    if (typeof (window.TEF as any).getPendingTransactionInfo === 'function') {
      const infoJson = (window.TEF as any).getPendingTransactionInfo();
      return JSON.parse(infoJson) as PendingTransactionInfo;
    }
  } catch (error) {
    console.error('[TEFBridge] Erro ao obter getPendingTransactionInfo:', error);
  }
  
  return null;
}

/**
 * Salva transação APROVADA para confirmação posterior
 * Chamado APÓS receber aprovação do PayGo
 * 
 * A transação só será CONFIRMADA após impressão/registro no PDV
 */
export function saveApprovedTransactionAndroid(params: {
  confirmationId: string;
  nsu: string;
  autorizacao: string;
  valor: number;
  providerName?: string;
  merchantId?: string;
  localNsu?: string;
  transactionNsu?: string;
  hostNsu?: string;
}): boolean {
  if (!isAndroidTEFAvailable()) {
    console.log('[TEFBridge] TEF não disponível - salvando em localStorage');
    try {
      localStorage.setItem('tef_approved_transaction', JSON.stringify({
        ...params,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('[TEFBridge] Erro ao salvar em localStorage:', e);
    }
    return true;
  }
  
  try {
    if (typeof (window.TEF as any).saveApprovedTransaction === 'function') {
      console.log('[TEFBridge] Salvando transação aprovada no APK:', params);
      (window.TEF as any).saveApprovedTransaction(JSON.stringify(params));
      return true;
    }
  } catch (error) {
    console.error('[TEFBridge] Erro em saveApprovedTransaction:', error);
  }
  
  return false;
}

/**
 * Marca que impressão foi bem-sucedida
 * Chamar APÓS imprimir/enviar comprovante
 */
export function markPrintSuccessAndroid(): boolean {
  if (!isAndroidTEFAvailable()) {
    return true;
  }
  
  try {
    if (typeof (window.TEF as any).markPrintSuccess === 'function') {
      (window.TEF as any).markPrintSuccess();
      console.log('[TEFBridge] ✅ Impressão marcada como sucesso');
      return true;
    }
  } catch (error) {
    console.error('[TEFBridge] Erro em markPrintSuccess:', error);
  }
  
  return false;
}

/**
 * Marca que impressão falhou
 * Chamar quando impressão/envio de comprovante falhar
 */
export function markPrintFailureAndroid(): boolean {
  if (!isAndroidTEFAvailable()) {
    return true;
  }
  
  try {
    if (typeof (window.TEF as any).markPrintFailure === 'function') {
      (window.TEF as any).markPrintFailure();
      console.warn('[TEFBridge] ❌ Impressão marcada como falha');
      return true;
    }
  } catch (error) {
    console.error('[TEFBridge] Erro em markPrintFailure:', error);
  }
  
  return false;
}

/**
 * CONFIRMA a transação aprovada (PASSO 33)
 * Chamar APÓS impressão OK e registro no PDV
 */
export function confirmApprovedTransactionAndroid(): boolean {
  if (!isAndroidTEFAvailable()) {
    console.log('[TEFBridge] TEF não disponível - confirmação simulada');
    localStorage.removeItem('tef_approved_transaction');
    return true;
  }
  
  try {
    if (typeof (window.TEF as any).confirmApprovedTransaction === 'function') {
      console.log('[TEFBridge] ✅ Confirmando transação aprovada...');
      (window.TEF as any).confirmApprovedTransaction();
      return true;
    }
  } catch (error) {
    console.error('[TEFBridge] Erro em confirmApprovedTransaction:', error);
  }
  
  return false;
}

/**
 * DESFAZ a transação aprovada (quando há falha)
 * Chamar quando: impressão falhou, PDV falhou, usuário cancelou, etc.
 */
export function undoApprovedTransactionAndroid(reason: string = 'DESFEITO_MANUAL'): boolean {
  if (!isAndroidTEFAvailable()) {
    console.log('[TEFBridge] TEF não disponível - desfazimento simulado');
    localStorage.removeItem('tef_approved_transaction');
    return true;
  }
  
  try {
    if (typeof (window.TEF as any).undoApprovedTransaction === 'function') {
      console.log('[TEFBridge] ❌ Desfazendo transação aprovada:', reason);
      (window.TEF as any).undoApprovedTransaction(reason);
      return true;
    }
  } catch (error) {
    console.error('[TEFBridge] Erro em undoApprovedTransaction:', error);
  }
  
  return false;
}

/**
 * RESOLVE pendência existente (PASSO 34)
 * Chamar ANTES de iniciar nova transação quando há pendência
 * 
 * @param action "CONFIRMAR" ou "DESFAZER"
 */
export function resolvePendingTransactionAndroid(action: 'CONFIRMAR' | 'DESFAZER' = 'DESFAZER'): boolean {
  if (!isAndroidTEFAvailable()) {
    console.log('[TEFBridge] TEF não disponível - resolução simulada');
    return true;
  }
  
  try {
    if (typeof (window.TEF as any).resolvePendingTransaction === 'function') {
      console.log('[TEFBridge] 🔄 Resolvendo pendência:', action);
      (window.TEF as any).resolvePendingTransaction(action);
      return true;
    }
  } catch (error) {
    console.error('[TEFBridge] Erro em resolvePendingTransaction:', error);
  }
  
  return false;
}

/**
 * AUTO-RESOLVE pendência baseado no status
 * Lógica: IMPRESSA_OK → CONFIRMAR, IMPRESSA_FALHA → DESFAZER, APROVADA → DESFAZER
 */
export function autoResolvePendingAndroid(): boolean {
  if (!isAndroidTEFAvailable()) {
    return true;
  }
  
  try {
    if (typeof (window.TEF as any).autoResolvePending === 'function') {
      console.log('[TEFBridge] 🤖 Auto-resolvendo pendência...');
      (window.TEF as any).autoResolvePending();
      return true;
    }
  } catch (error) {
    console.error('[TEFBridge] Erro em autoResolvePending:', error);
  }
  
  return false;
}

/**
 * Limpa pendência manualmente
 * CUIDADO: Chamar SOMENTE após confirmar resolução externa
 */
export function clearPendingTransactionAndroid(): boolean {
  if (!isAndroidTEFAvailable()) {
    localStorage.removeItem('tef_approved_transaction');
    return true;
  }
  
  try {
    if (typeof (window.TEF as any).clearPendingTransaction === 'function') {
      console.log('[TEFBridge] 🗑️ Limpando pendência...');
      (window.TEF as any).clearPendingTransaction();
      return true;
    }
  } catch (error) {
    console.error('[TEFBridge] Erro em clearPendingTransaction:', error);
  }
  
  return false;
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
