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
      timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : Date.now()
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
  
  console.log('[useTEFPaymentResult] transactionResult:', transactionResult, '-> status:', status);
  
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
    timestamp: Date.now()
  };
}

export function useTEFPaymentResult({
  enabled,
  onResult,
  pollingInterval = 500,
  maxWaitTime = 120000 // 2 minutos
}: UseTEFPaymentResultOptions) {
  const onResultRef = useRef(onResult);
  const startTimeRef = useRef<number>(Date.now());
  const processedRef = useRef(false);
  
  // Atualizar ref quando callback mudar
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  
  // Reset quando enabled mudar
  useEffect(() => {
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
  const processResult = useCallback((resultado: TEFResultado | Record<string, unknown>, source: string) => {
    if (processedRef.current) {
      console.log('[useTEFPaymentResult] ⚠️ Resultado já processado, ignorando');
      return;
    }
    
    const normalized = normalizePayGoResult(resultado as Record<string, unknown>);
    const resultKey = `${normalized.status}-${normalized.nsu}-${normalized.timestamp}`;
    
    if (globalLastProcessedResultKey === resultKey) {
      console.log('[useTEFPaymentResult] ⚠️ Resultado duplicado, ignorando');
      return;
    }
    
    console.log('[useTEFPaymentResult] ═══════════════════════════════════════');
    console.log('[useTEFPaymentResult] ✅ RESULTADO RECEBIDO via:', source);
    console.log('[useTEFPaymentResult] Status:', normalized.status);
    console.log('[useTEFPaymentResult] NSU:', normalized.nsu);
    console.log('[useTEFPaymentResult] ═══════════════════════════════════════');
    
    globalLastProcessedResultKey = resultKey;
    processedRef.current = true;
    lastReceivedResult = normalized;
    
    // Limpar sessionStorage
    try {
      sessionStorage.removeItem('lastTefResult');
      sessionStorage.removeItem('lastTefResultTime');
    } catch (e) {
      console.warn('[useTEFPaymentResult] Erro ao limpar sessionStorage:', e);
    }
    
    // Chamar callback
    onResultRef.current(normalized);
  }, []);
  
  // Registrar callback global no window
  useEffect(() => {
    if (!enabled) return;
    
    console.log('[useTEFPaymentResult] Registrando window.onTefResultado');
    
    const originalCallback = (window as any).onTefResultado;
    
    (window as any).onTefResultado = (resultado: TEFResultado | Record<string, unknown>) => {
      console.log('[useTEFPaymentResult] 📞 window.onTefResultado CHAMADO');
      processResult(resultado, 'window.onTefResultado');
    };
    
    return () => {
      // Restaurar callback original se existia
      if (originalCallback) {
        (window as any).onTefResultado = originalCallback;
      }
    };
  }, [enabled, processResult]);
  
  // Listener para CustomEvent
  useEffect(() => {
    if (!enabled) return;
    
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
  }, [enabled, processResult]);
  
  // Listener para storage event (quando Android salva no sessionStorage)
  useEffect(() => {
    if (!enabled) return;
    
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
  }, [enabled, processResult]);
  
  // Polling do sessionStorage (fallback mais robusto)
  useEffect(() => {
    if (!enabled) return;
    
    console.log('[useTEFPaymentResult] Iniciando polling do sessionStorage');
    
    const checkSessionStorage = () => {
      if (processedRef.current) return;
      
      // Verificar timeout
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed > maxWaitTime) {
        console.log('[useTEFPaymentResult] ⏱️ Timeout - tempo máximo de espera atingido');
        return;
      }
      
      try {
        const storedResult = sessionStorage.getItem('lastTefResult');
        const storedTime = sessionStorage.getItem('lastTefResultTime');
        
        if (storedResult && storedTime) {
          const resultAge = Date.now() - parseInt(storedTime, 10);
          
          // Aceitar resultados dos últimos 60 segundos
          if (resultAge < 60000) {
            console.log('[useTEFPaymentResult] 📞 SessionStorage POLLING encontrou resultado');
            console.log('[useTEFPaymentResult] Idade do resultado:', resultAge, 'ms');
            
            const resultado = JSON.parse(storedResult);
            processResult(resultado, 'SessionStorage Polling');
          }
        }
      } catch (e) {
        console.error('[useTEFPaymentResult] Erro no polling:', e);
      }
    };
    
    // Verificar imediatamente
    checkSessionStorage();
    
    // Polling periódico
    const interval = setInterval(checkSessionStorage, pollingInterval);
    
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
