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
    console.log('[TEFBridge] ║         RESOLUÇÃO DE PENDÊNCIA PayGo (Passo 34)           ║');
    console.log('[TEFBridge] ╠═══════════════════════════════════════════════════════════╣');
    console.log('[TEFBridge] ║ Ação:', acao.toUpperCase().padEnd(52), '║');
    console.log('[TEFBridge] ║ Status:', status.padEnd(50), '║');
    console.log('[TEFBridge] ║ confirmationId:', (confirmationId || 'N/A').substring(0, 42).padEnd(42), '║');
    console.log('[TEFBridge] ║ pendingDataFromJS:', pendingDataFromJS ? 'SIM' : 'NÃO'.padEnd(39), '║');
    console.log('[TEFBridge] ╚═══════════════════════════════════════════════════════════╝');
    
    // Verificar métodos disponíveis no TEF
    const tefMethods = Object.keys(window.TEF || {});
    console.log('[TEFBridge] Métodos TEF disponíveis:', tefMethods.join(', '));
    
    // ========================================================================
    // ESTRATÉGIA 1 (NOVA - PREFERENCIAL): resolverPendenciaComDados(pendingDataJson, status)
    // Passa os dados da pendência diretamente do JavaScript para o APK
    // ========================================================================
    if (pendingDataFromJS && typeof (window.TEF as any).resolverPendenciaComDados === 'function') {
      const pendingDataJson = JSON.stringify(pendingDataFromJS);
      console.log('[TEFBridge] 🔄 Chamando resolverPendenciaComDados com dados do JS...');
      console.log('[TEFBridge] Dados:', pendingDataJson);
      (window.TEF as any).resolverPendenciaComDados(pendingDataJson, status);
      console.log('[TEFBridge] ✅ resolverPendenciaComDados chamado com sucesso');
      return true;
    }
    
    // ========================================================================
    // ESTRATÉGIA 1.5: Salvar dados de pendência no APK primeiro, depois resolver
    // ========================================================================
    if (pendingDataFromJS && typeof (window.TEF as any).salvarPendingData === 'function') {
      const pendingDataJson = JSON.stringify(pendingDataFromJS);
      console.log('[TEFBridge] 💾 Salvando pendingData no APK antes de resolver...');
      (window.TEF as any).salvarPendingData(pendingDataJson);
      console.log('[TEFBridge] ✅ Dados de pendência salvos no APK');
      // Agora tentar resolver
    }
    
    // ========================================================================
    // ESTRATÉGIA 2: resolverPendencia(status) com parâmetro
    // O método resolverPendencia agora aceita o status como parâmetro
    // ========================================================================
    if (typeof window.TEF!.resolverPendencia === 'function') {
      console.log('[TEFBridge] 🔄 Chamando resolverPendencia(' + status + ')...');
      window.TEF!.resolverPendencia(status);
      console.log('[TEFBridge] ✅ resolverPendencia(' + status + ') chamado');
      
      // Aguardar um momento e verificar se a pendência foi resolvida
      setTimeout(() => {
        const infoApos = getPendingInfoAndroid();
        console.log('[TEFBridge] 📊 Status após resolução:', JSON.stringify(infoApos, null, 2));
      }, 1000);
      
      return true;
    }
    
    // ========================================================================
    // ESTRATÉGIA 3: confirmarTransacao com confirmationId específico
    // Se temos o ID, usamos confirmarTransacao diretamente
    // ========================================================================
    if (confirmationId && confirmationId !== 'PENDENCIA' && confirmationId !== 'undefined') {
      console.log('[TEFBridge] 🔄 Chamando confirmarTransacao(' + confirmationId + ', ' + status + ')...');
      window.TEF!.confirmarTransacao(confirmationId, status);
      console.log('[TEFBridge] ✅ confirmarTransacao chamado com ID específico');
      return true;
    }
    
    // ========================================================================
    // ESTRATÉGIA 4: Buscar pendingData e usar confirmationTransactionId
    // Obtém os dados da pendência e usa o ID correto
    // ========================================================================
    const pendingInfo = getPendingInfoAndroid();
    console.log('[TEFBridge] 📊 PendingInfo obtido:', JSON.stringify(pendingInfo, null, 2));
    
    if (pendingInfo) {
      // Extrair possíveis IDs da pendência
      const pendingData = pendingInfo.pendingData as Record<string, unknown> | undefined;
      const possibleIds = [
        pendingInfo.pendingConfirmationId,
        pendingInfo.confirmationId,
        pendingInfo.lastConfirmationId,
        pendingData?.confirmationTransactionId,
        pendingData?.transactionId,
        pendingInfo.confirmationTransactionId,
      ].filter(id => id && typeof id === 'string' && id !== 'undefined' && id !== 'null' && id !== '');
      
      console.log('[TEFBridge] 🔍 IDs candidatos encontrados:', possibleIds);
      
      if (possibleIds.length > 0) {
        const idToUse = possibleIds[0] as string;
        console.log('[TEFBridge] 🔄 Usando confirmarTransacao(' + idToUse + ', ' + status + ')...');
        window.TEF!.confirmarTransacao(idToUse, status);
        console.log('[TEFBridge] ✅ confirmarTransacao chamado com ID da pendência');
        return true;
      }
    }
    
    // ========================================================================
    // ESTRATÉGIA 5: confirmarTransacao com ID genérico "PENDING"
    // Fallback: indica ao APK que deve buscar a pendência automaticamente
    // ========================================================================
    console.log('[TEFBridge] ⚠️ Nenhum ID disponível - tentando confirmarTransacao(PENDING, ' + status + ')...');
    window.TEF!.confirmarTransacao('PENDING', status);
    console.log('[TEFBridge] ✅ confirmarTransacao(PENDING, ' + status + ') chamado');
    
    console.log('[TEFBridge] ════════════════════════════════════════════════════════════');
    
    return true;
  } catch (error) {
    console.error('[TEFBridge] ❌ Erro ao resolver pendência:', error);
    return false;
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
