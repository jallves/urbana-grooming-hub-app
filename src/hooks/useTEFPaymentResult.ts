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
  // CRÍTICO: NÃO depender de enabled - processar SEMPRE que receber resultado
  const processResult = useCallback((resultado: TEFResultado | Record<string, unknown>, source: string) => {
    console.log('[useTEFPaymentResult] ═══════════════════════════════════════');
    console.log('[useTEFPaymentResult] 📥 PROCESSANDO RESULTADO');
    console.log('[useTEFPaymentResult] Fonte:', source);
    console.log('[useTEFPaymentResult] enabledRef.current:', enabledRef.current);
    console.log('[useTEFPaymentResult] processedRef.current:', processedRef.current);
    console.log('[useTEFPaymentResult] Dados brutos:', JSON.stringify(resultado, null, 2));
    console.log('[useTEFPaymentResult] ═══════════════════════════════════════');
    
    // REMOVIDO: Verificação de enabled
    // O resultado do PayGo SEMPRE deve ser processado quando chegar
    // Não importa se o hook está "enabled" ou não
    
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
  
  // Registrar callback global no window
  // IMPORTANTE: SEMPRE registrar, independente de enabled
  // Isso garante que não perdemos o resultado do PayGo
  useEffect(() => {
    console.log('[useTEFPaymentResult] ═══════════════════════════════════════');
    console.log('[useTEFPaymentResult] ✅ REGISTRANDO window.onTefResultado (SEMPRE ATIVO)');
    console.log('[useTEFPaymentResult] ═══════════════════════════════════════');
    
    // SEMPRE registrar o callback, não depender de enabled
    (window as any).onTefResultado = (resultado: TEFResultado | Record<string, unknown>) => {
      console.log('[useTEFPaymentResult] ═══════════════════════════════════════');
      console.log('[useTEFPaymentResult] 📞 window.onTefResultado CHAMADO');
      console.log('[useTEFPaymentResult] enabled atual:', enabledRef.current);
      console.log('[useTEFPaymentResult] Dados:', JSON.stringify(resultado, null, 2));
      console.log('[useTEFPaymentResult] ═══════════════════════════════════════');
      processResult(resultado, 'window.onTefResultado');
    };
    
    console.log('[useTEFPaymentResult] Callback registrado com sucesso');
    
    // Verificar se há resultado pendente no storage ao montar
    // Isso captura resultados que chegaram antes do React estar pronto
    // Verificar tanto sessionStorage quanto localStorage
    setTimeout(() => {
      try {
        // Tentar sessionStorage primeiro
        let storedResult = sessionStorage.getItem('lastTefResult');
        let storedTime = sessionStorage.getItem('lastTefResultTime');
        
        // Se não encontrou, tentar localStorage (mais persistente)
        if (!storedResult) {
          storedResult = localStorage.getItem('lastTefResult');
          storedTime = localStorage.getItem('lastTefResultTime');
          if (storedResult) {
            console.log('[useTEFPaymentResult] Resultado encontrado no localStorage!');
          }
        }
        
        if (storedResult && storedTime && !processedRef.current) {
          const resultAge = Date.now() - parseInt(storedTime, 10);
          
          // Aceitar resultados dos últimos 60 segundos (aumentado para dar mais tempo)
          if (resultAge < 60000) {
            console.log('[useTEFPaymentResult] 📞 Resultado pendente encontrado no storage ao montar!');
            console.log('[useTEFPaymentResult] Idade do resultado:', resultAge, 'ms');
            
            const resultado = JSON.parse(storedResult);
            processResult(resultado, 'Storage on Mount');
          }
        }
      } catch (e) {
        console.error('[useTEFPaymentResult] Erro ao verificar storage ao montar:', e);
      }
    }, 100);
    
    return () => {
      // Não remover o callback ao desmontar
      console.log('[useTEFPaymentResult] Componente desmontando, mantendo callback');
    };
  }, [processResult]); // Depende apenas de processResult que é estável
  
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
