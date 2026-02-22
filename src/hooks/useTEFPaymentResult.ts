/**
 * Hook dedicado para receber resultados do PayGo TEF
 * 
 * Este hook implementa múltiplos mecanismos de fallback para garantir
 * que o resultado do pagamento seja recebido pelo React:
 * 
 * 1. Callback global window.onTefResultado
 * 2. CustomEvent 'tefPaymentResult'
 * 3. Polling do sessionStorage
 * 4. Storage event listener
 */

import { useEffect, useRef, useCallback } from 'react';
import { TEFResultado } from '@/lib/tef/tefAndroidBridge';

interface UseTEFPaymentResultOptions {
  enabled: boolean;
  onResult: (resultado: TEFResultado) => void;
  pollingInterval?: number; // ms
  maxWaitTime?: number; // ms
}

// Flag global para evitar processamento duplicado
let globalLastProcessedResultKey: string | null = null;

// Armazena o último resultado recebido para debug
let lastReceivedResult: TEFResultado | null = null;

/**
 * Normaliza o resultado do PayGo para o formato TEFResultado
 */
function normalizePayGoResult(raw: Record<string, unknown>): TEFResultado {
  console.log('[useTEFPaymentResult] Normalizando resultado:', JSON.stringify(raw, null, 2));
  
  // Se já tem status formatado, usar diretamente
  if (raw.status && typeof raw.status === 'string' && 
      ['aprovado', 'negado', 'cancelado', 'erro'].includes(raw.status)) {
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
      // CRÍTICO: Preservar dados de confirmação TEF
      confirmationTransactionId: (raw.confirmationTransactionId || '') as string,
      requiresConfirmation: raw.requiresConfirmation === true || raw.requiresConfirmation === 'true'
    };
  }
  
  // Converter de formato PayGo bruto
  // ATENÇÃO: transactionResult pode não existir - NÃO usar '-99' como default (isso vira erro falso)
  let transactionResult: number | undefined;

  if (typeof raw.transactionResult === 'number') {
    transactionResult = raw.transactionResult;
  } else if (typeof raw.transactionResult === 'string' && raw.transactionResult !== '') {
    transactionResult = parseInt(raw.transactionResult, 10);
  }

  let status: TEFResultado['status'];
  if (transactionResult !== undefined) {
    if (transactionResult === 0) {
      status = 'aprovado';
    } else if (transactionResult >= 1 && transactionResult <= 99) {
      status = 'negado';
    } else if (transactionResult === -1) {
      status = 'cancelado';
    } else {
      status = 'erro';
    }
  } else {
    const hasApprovalData = raw.transactionNsu || raw.nsu || raw.authorizationCode || raw.autorizacao;
    if (hasApprovalData) {
      status = 'aprovado';
    } else if (raw.cancelled === true) {
      status = 'cancelado';
    } else {
      status = 'erro';
    }
  }

  console.log('[useTEFPaymentResult] transactionResult:', transactionResult, '-> status:', status);

  return {
    status,
    valor: typeof raw.amount === 'number' ? raw.amount : undefined,
    bandeira: (raw.cardName || '') as string,
    nsu: (raw.transactionNsu || raw.nsu || '') as string,
    autorizacao: (raw.authorizationCode || raw.autorizacao || '') as string,
    codigoResposta: transactionResult?.toString() || raw.codigoResposta?.toString() || '',
    mensagem: (raw.resultMessage || raw.mensagem || '') as string,
    comprovanteCliente: (raw.cardholderReceipt || raw.comprovanteCliente || '') as string,
    comprovanteLojista: (raw.merchantReceipt || raw.comprovanteLojista || '') as string,
    timestamp: Date.now(),
    // CRÍTICO: Preservar dados de confirmação TEF
    confirmationTransactionId: (raw.confirmationTransactionId || '') as string,
    requiresConfirmation: raw.requiresConfirmation === true || raw.requiresConfirmation === 'true'
  };
}

export function useTEFPaymentResult({
  enabled,
  onResult,
  pollingInterval = 500,
  maxWaitTime = 120000 // 2 minutos
}: UseTEFPaymentResultOptions) {
  const onResultRef = useRef(onResult);
  const enabledRef = useRef(enabled);
  const startTimeRef = useRef<number>(Date.now());
  const processedRef = useRef(false);
  
  // Atualizar refs quando props mudarem
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  
  useEffect(() => {
    enabledRef.current = enabled;
    if (enabled) {
      console.log('[useTEFPaymentResult] ✅ Hook ATIVADO - aguardando resultado do PayGo');
      startTimeRef.current = Date.now();
      processedRef.current = false;
      globalLastProcessedResultKey = null;
    } else {
      console.log('[useTEFPaymentResult] ⏸️ Hook DESATIVADO');
    }
  }, [enabled]);
  
  // Função para processar resultado (com proteção contra duplicatas)
  // CRÍTICO: SÓ processar quando enabled=true (pagamento em andamento)
  // Isso evita que resultados antigos/stale sejam processados ao montar o componente
  const processResult = useCallback((resultado: TEFResultado | Record<string, unknown>, source: string) => {
    console.log('[useTEFPaymentResult] 📥 PROCESSANDO RESULTADO | Fonte:', source, '| enabled:', enabledRef.current);
    
    // CRÍTICO: Verificar se o hook está habilitado (pagamento ativo)
    // Sem isso, resultados antigos no storage são processados antes do PayGo ser chamado
    if (!enabledRef.current) {
      console.log('[useTEFPaymentResult] ⚠️ Hook DESATIVADO - ignorando resultado de', source);
      return;
    }
    
    if (processedRef.current) {
      console.log('[useTEFPaymentResult] ⚠️ Resultado já processado, ignorando');
      return;
    }
    
    const normalized = normalizePayGoResult(resultado as Record<string, unknown>);
    const resultKey = `${normalized.status}-${normalized.nsu}-${normalized.timestamp}`;
    
    if (globalLastProcessedResultKey === resultKey) {
      console.log('[useTEFPaymentResult] ⚠️ Resultado duplicado (key match), ignorando');
      return;
    }
    
    console.log('[useTEFPaymentResult] ═══════════════════════════════════════');
    console.log('[useTEFPaymentResult] ✅ RESULTADO ACEITO PARA PROCESSAMENTO');
    console.log('[useTEFPaymentResult] Via:', source);
    console.log('[useTEFPaymentResult] Status:', normalized.status);
    console.log('[useTEFPaymentResult] NSU:', normalized.nsu);
    console.log('[useTEFPaymentResult] Autorização:', normalized.autorizacao);
    console.log('[useTEFPaymentResult] ═══════════════════════════════════════');
    
    globalLastProcessedResultKey = resultKey;
    processedRef.current = true;
    lastReceivedResult = normalized;
    
    // Limpar storage (sessionStorage E localStorage)
    try {
      sessionStorage.removeItem('lastTefResult');
      sessionStorage.removeItem('lastTefResultTime');
      localStorage.removeItem('lastTefResult');
      localStorage.removeItem('lastTefResultTime');
    } catch (e) {
      console.warn('[useTEFPaymentResult] Erro ao limpar storage:', e);
    }
    
    // Chamar callback - SEMPRE
    console.log('[useTEFPaymentResult] 📞 Chamando onResultRef.current...');
    console.log('[useTEFPaymentResult] onResultRef.current existe?', !!onResultRef.current);
    
    if (onResultRef.current) {
      try {
        onResultRef.current(normalized);
        console.log('[useTEFPaymentResult] ✅ Callback chamado com sucesso');
      } catch (e) {
        console.error('[useTEFPaymentResult] ❌ ERRO ao chamar callback:', e);
      }
    } else {
      console.error('[useTEFPaymentResult] ❌ onResultRef.current é null/undefined!');
    }
  }, []);
  
  // NÃO registrar window.onTefResultado aqui!
  // O useTEFAndroid é o ÚNICO dono de window.onTefResultado
  // Este hook recebe resultados via CustomEvent + storage (propagados pelo useTEFAndroid)
  useEffect(() => {
    console.log('[useTEFPaymentResult] ✅ Inicializado - recebe via CustomEvent/storage (NÃO registra window.onTefResultado)');
  }, []);
  
  // Listener para CustomEvent - SEMPRE ativo
  useEffect(() => {
    const handleCustomEvent = (event: CustomEvent) => {
      console.log('[useTEFPaymentResult] 📞 CustomEvent tefPaymentResult RECEBIDO');
      if (event.detail) {
        processResult(event.detail, 'CustomEvent');
      }
    };
    
    window.addEventListener('tefPaymentResult', handleCustomEvent as EventListener);
    document.addEventListener('tefPaymentResult', handleCustomEvent as EventListener);
    
    return () => {
      window.removeEventListener('tefPaymentResult', handleCustomEvent as EventListener);
      document.removeEventListener('tefPaymentResult', handleCustomEvent as EventListener);
    };
  }, [processResult]);
  
  // Listener para storage event - SEMPRE ativo
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'lastTefResult' && event.newValue) {
        console.log('[useTEFPaymentResult] 📞 Storage event RECEBIDO');
        try {
          const resultado = JSON.parse(event.newValue);
          processResult(resultado, 'StorageEvent');
        } catch (e) {
          console.error('[useTEFPaymentResult] Erro ao parsear storage:', e);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [processResult]);
  
  // Polling do storage (fallback mais robusto)
  useEffect(() => {
    if (!enabled) return;
    
    console.log('[useTEFPaymentResult] Iniciando polling do storage');
    
    const checkStorage = () => {
      if (processedRef.current) return;
      
      // Verificar timeout
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed > maxWaitTime) {
        console.log('[useTEFPaymentResult] ⏱️ Timeout - tempo máximo de espera atingido');
        return;
      }
      
      try {
        // Verificar sessionStorage primeiro, depois localStorage
        let storedResult = sessionStorage.getItem('lastTefResult');
        let storedTime = sessionStorage.getItem('lastTefResultTime');
        
        if (!storedResult) {
          storedResult = localStorage.getItem('lastTefResult');
          storedTime = localStorage.getItem('lastTefResultTime');
        }
        
        if (storedResult && storedTime) {
          const resultAge = Date.now() - parseInt(storedTime, 10);
          
          // Aceitar resultados dos últimos 60 segundos
          if (resultAge < 60000) {
            console.log('[useTEFPaymentResult] 📞 Storage POLLING encontrou resultado');
            console.log('[useTEFPaymentResult] Idade do resultado:', resultAge, 'ms');
            
            const resultado = JSON.parse(storedResult);
            processResult(resultado, 'Storage Polling');
          }
        }
      } catch (e) {
        console.error('[useTEFPaymentResult] Erro no polling:', e);
      }
    };
    
    // Verificar imediatamente
    checkStorage();
    
    // Polling periódico
    const interval = setInterval(checkStorage, pollingInterval);
    
    return () => {
      clearInterval(interval);
    };
  }, [enabled, pollingInterval, maxWaitTime, processResult]);
  
  return {
    lastResult: lastReceivedResult,
    isProcessed: processedRef.current
  };
}

export default useTEFPaymentResult;
