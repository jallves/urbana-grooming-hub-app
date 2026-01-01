import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  isAndroidTEFAvailable,
  iniciarPagamentoAndroid,
  cancelarPagamentoAndroid,
  verificarPinpad,
  registrarListenersPinpad,
  mapPaymentMethod,
  reaisToCentavos,
  savePendingDataToLocalStorage,
  TEFResultado,
  TEFPinpadStatus
} from '@/lib/tef/tefAndroidBridge';

interface UseTEFAndroidOptions {
  onSuccess?: (resultado: TEFResultado) => void;
  onError?: (erro: string, resultadoCompleto?: TEFResultado) => void;
  onCancelled?: () => void;
}

interface UseTEFAndroidReturn {
  isAndroidAvailable: boolean;
  isPinpadConnected: boolean;
  isProcessing: boolean;
  pinpadStatus: TEFPinpadStatus | null;
  androidVersion: string | null;
  iniciarPagamento: (params: {
    ordemId: string;
    valor: number; // em reais
    tipo: 'credit' | 'debit' | 'pix';
    parcelas?: number;
  }) => Promise<boolean>;
  cancelarPagamento: () => void;
  verificarConexao: () => TEFPinpadStatus | null;
}

// Flag global para evitar processamento duplicado
let globalLastProcessedResult: string | null = null;
let globalResultCallback: ((resultado: TEFResultado) => void) | null = null;

// Armazenar referência aos options de forma global para persistir entre renders
let globalOptionsRef: UseTEFAndroidOptions = {};

export function useTEFAndroid(options: UseTEFAndroidOptions = {}): UseTEFAndroidReturn {
  const [isAndroidAvailable, setIsAndroidAvailable] = useState(false);
  const [isPinpadConnected, setIsPinpadConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pinpadStatus, setPinpadStatus] = useState<TEFPinpadStatus | null>(null);
  const [androidVersion, setAndroidVersion] = useState<string | null>(null);
  
  // Refs para manter callbacks atualizados
  const optionsRef = useRef(options);
  const processingRef = useRef(false);
  const setIsProcessingRef = useRef(setIsProcessing);
  
  // Atualizar refs quando options mudar
  useEffect(() => {
    optionsRef.current = options;
    globalOptionsRef = options;
  }, [options]);
  
  useEffect(() => {
    processingRef.current = isProcessing;
  }, [isProcessing]);
  
  useEffect(() => {
    setIsProcessingRef.current = setIsProcessing;
  }, [setIsProcessing]);

  // Registrar callback global SEMPRE para receber resposta do PayGo
  // Este callback deve ser registrado uma única vez e persistir
  useEffect(() => {
    console.log('[useTEFAndroid] ═══════════════════════════════════════');
    console.log('[useTEFAndroid] Inicializando hook com callbacks');
    console.log('[useTEFAndroid] onSuccess definido:', !!options.onSuccess);
    console.log('[useTEFAndroid] onError definido:', !!options.onError);
    console.log('[useTEFAndroid] onCancelled definido:', !!options.onCancelled);
    console.log('[useTEFAndroid] ═══════════════════════════════════════');
    
    // Handler principal para receber resultado do PayGo
    // IMPORTANTE: Este handler deve ser registrado SEMPRE e usar refs/globals
    const handleTefResultado = (resultado: TEFResultado | Record<string, unknown>) => {
      console.log('[useTEFAndroid] ═══════════════════════════════════════');
      console.log('[useTEFAndroid] RESULTADO PAYGO RECEBIDO VIA CALLBACK GLOBAL');
      console.log('[useTEFAndroid] Dados:', JSON.stringify(resultado, null, 2));
      console.log('[useTEFAndroid] isProcessing (ref):', processingRef.current);
      console.log('[useTEFAndroid] ═══════════════════════════════════════');

      // IMPORTANTE: Salvar dados de pendência ANTES de normalizar
      // Isso captura providerName, merchantId, localNsu, etc. para resolução posterior
      const rawData = resultado as Record<string, unknown>;
      if (rawData.providerName || rawData.merchantId || rawData.terminalNsu) {
        console.log('[useTEFAndroid] 💾 Salvando dados de pendência para resolução futura');
        savePendingDataToLocalStorage(rawData);
      }

      // Normalizar resultado
      const normalizedResult = normalizePayGoResult(resultado as Record<string, unknown>);
      console.log('[useTEFAndroid] Resultado normalizado:', JSON.stringify(normalizedResult, null, 2));

      // Se NÃO há operação em andamento e também não há promise aguardando,
      // não disparar UI/toasts (ex: chamadas administrativas como resolverPendencia).
      // Mantemos apenas o log para diagnóstico.
      if (!processingRef.current && !globalResultCallback) {
        console.log('[useTEFAndroid] Resultado recebido sem operação ativa — ignorando callbacks de UI.');
        return;
      }

      // Evitar processamento duplicado usando chave mais robusta
      // Para transações aprovadas: usa NSU + autorização
      // Para outras: usa timestamp + status + valor
      const timestamp = normalizedResult.timestamp || Date.now();
      const resultKey = normalizedResult.nsu && normalizedResult.autorizacao
        ? `${normalizedResult.nsu}_${normalizedResult.autorizacao}`
        : `${timestamp}_${normalizedResult.status}_${normalizedResult.valor || ''}`;

      if (globalLastProcessedResult === resultKey) {
        console.log('[useTEFAndroid] ⚠️ Resultado já processado, ignorando duplicata:', resultKey);
        return;
      }
      globalLastProcessedResult = resultKey;

      // Limpar chave após 3 segundos para permitir novas transações
      setTimeout(() => {
        if (globalLastProcessedResult === resultKey) {
          globalLastProcessedResult = null;
        }
      }, 3000);

      // Atualizar estado via ref para garantir que funciona mesmo após re-render
      console.log('[useTEFAndroid] Atualizando isProcessing para false');
      setIsProcessingRef.current(false);

      // Chamar callback interno se existir (para resolver promise)
      if (globalResultCallback) {
        console.log('[useTEFAndroid] Chamando callback interno registrado');
        globalResultCallback(normalizedResult);
        globalResultCallback = null;
      }

      // Chamar callbacks do options usando a referência global
      const opts = globalOptionsRef;
      console.log('[useTEFAndroid] Verificando callbacks: onSuccess=', !!opts.onSuccess, 'onError=', !!opts.onError);

      switch (normalizedResult.status) {
        case 'aprovado':
          console.log('[useTEFAndroid] ✅ Pagamento APROVADO - chamando onSuccess');
          if (opts.onSuccess) {
            opts.onSuccess(normalizedResult);
          } else {
            console.warn('[useTEFAndroid] onSuccess não definido!');
          }
          break;

        case 'negado':
          console.log('[useTEFAndroid] ❌ Pagamento NEGADO - chamando onError');
          if (opts.onError) {
            // Passar resultado completo para permitir acesso aos dados da pendência
            opts.onError(normalizedResult.mensagem || 'Pagamento negado', normalizedResult);
          }
          break;

        case 'cancelado':
          console.log('[useTEFAndroid] ⚠️ Pagamento CANCELADO - chamando onCancelled');
          if (opts.onCancelled) {
            opts.onCancelled();
          }
          break;

        case 'erro':
          console.log('[useTEFAndroid] ❌ ERRO no pagamento - chamando onError');
          if (opts.onError) {
            // Passar resultado completo para permitir acesso aos dados da pendência
            opts.onError(normalizedResult.mensagem || 'Erro desconhecido', normalizedResult);
          }
          break;
      }
    };
    
    // SEMPRE registrar o callback global no window
    console.log('[useTEFAndroid] Registrando window.onTefResultado');
    (window as any).onTefResultado = handleTefResultado;
    
    // Também registrar no window.TEF se existir para garantir
    if ((window as any).TEF) {
      console.log('[useTEFAndroid] window.TEF existe, registrando handler adicional');
    }
    
    // Também ouvir evento customizado como backup
    const handleCustomEvent = (event: CustomEvent) => {
      console.log('[useTEFAndroid] CustomEvent tefPaymentResult recebido:', event.detail);
      if (event.detail) {
        handleTefResultado(event.detail);
      }
    };
    
    window.addEventListener('tefPaymentResult', handleCustomEvent as EventListener);
    document.addEventListener('tefPaymentResult', handleCustomEvent as EventListener);
    
    // Verificar se há resultado pendente no sessionStorage (caso PayGo tenha retornado antes do hook montar)
    const checkPendingResult = () => {
      try {
        const lastResult = sessionStorage.getItem('lastTefResult');
        const lastTime = sessionStorage.getItem('lastTefResultTime');
        if (lastResult && lastTime) {
          const timeDiff = Date.now() - parseInt(lastTime, 10);
          // Se o resultado foi salvo nos últimos 5 segundos, processar
          if (timeDiff < 5000) {
            console.log('[useTEFAndroid] Encontrado resultado pendente no sessionStorage');
            const pendingResult = JSON.parse(lastResult);
            sessionStorage.removeItem('lastTefResult');
            sessionStorage.removeItem('lastTefResultTime');
            handleTefResultado(pendingResult);
          }
        }
      } catch (e) {
        console.error('[useTEFAndroid] Erro ao verificar resultado pendente:', e);
      }
    };
    
    // Verificar após um pequeno delay
    setTimeout(checkPendingResult, 100);
    
    return () => {
      console.log('[useTEFAndroid] Cleanup - removendo event listeners (mas mantendo window.onTefResultado)');
      window.removeEventListener('tefPaymentResult', handleCustomEvent as EventListener);
      document.removeEventListener('tefPaymentResult', handleCustomEvent as EventListener);
      // NÃO remover window.onTefResultado para manter compatibilidade com retornos tardios
    };
  }, []);

  // Verificar disponibilidade do Android TEF
  useEffect(() => {
    const checkAvailability = () => {
      const available = isAndroidTEFAvailable();
      console.log('[useTEFAndroid] ========== VERIFICAÇÃO TEF ==========');
      console.log('[useTEFAndroid] window.TEF existe?', typeof window.TEF !== 'undefined');
      console.log('[useTEFAndroid] isAndroidAvailable:', available);
      setIsAndroidAvailable(available);
      
      if (available) {
        const status = verificarPinpad();
        console.log('[useTEFAndroid] Pinpad status:', JSON.stringify(status));
        setPinpadStatus(status);
        
        const connected = status?.conectado ?? false;
        setIsPinpadConnected(connected);
        console.log('[useTEFAndroid] isPinpadConnected:', connected);
        
        if (window.TEF?.isReady) {
          try {
            const ready = window.TEF.isReady();
            console.log('[useTEFAndroid] TEF.isReady():', ready);
            if (ready && !connected) {
              setIsPinpadConnected(true);
            }
          } catch (e) {
            console.warn('[useTEFAndroid] Erro ao chamar isReady:', e);
          }
        }
      } else {
        console.log('[useTEFAndroid] TEF NÃO disponível - window.TEF:', window.TEF);
      }
      console.log('[useTEFAndroid] =====================================');
    };

    checkAvailability();

    const timeout1 = setTimeout(checkAvailability, 500);
    const timeout2 = setTimeout(checkAvailability, 1000);
    const timeout3 = setTimeout(checkAvailability, 2000);
    const timeout4 = setTimeout(checkAvailability, 3000);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
    };
  }, []);

  // Registrar listeners de eventos do pinpad
  useEffect(() => {
    if (!isAndroidAvailable) return;

    const cleanup = registrarListenersPinpad({
      onConnected: (data) => {
        console.log('[useTEFAndroid] Pinpad conectado:', data);
        setIsPinpadConnected(true);
        toast.success('Pinpad conectado', {
          description: data.modelo ? `Modelo: ${data.modelo}` : undefined
        });
      },
      onDisconnected: () => {
        console.log('[useTEFAndroid] Pinpad desconectado');
        setIsPinpadConnected(false);
        toast.warning('Pinpad desconectado');
      },
      onError: (data) => {
        console.error('[useTEFAndroid] Erro do pinpad:', data);
        toast.error('Erro no pinpad', {
          description: data.erro
        });
      },
      onAndroidReady: (version) => {
        console.log('[useTEFAndroid] Android TEF pronto, versão:', version);
        setAndroidVersion(version);
        
        const status = verificarPinpad();
        setPinpadStatus(status);
        setIsPinpadConnected(status?.conectado || false);
      }
    });

    return cleanup;
  }, [isAndroidAvailable]);

  // Iniciar pagamento
  const iniciarPagamento = useCallback(async (params: {
    ordemId: string;
    valor: number;
    tipo: 'credit' | 'debit' | 'pix';
    parcelas?: number;
  }): Promise<boolean> => {
    if (!isAndroidAvailable) {
      console.warn('[useTEFAndroid] Android TEF não disponível');
      return false;
    }

    if (!isPinpadConnected) {
      toast.error('Pinpad não conectado');
      return false;
    }

    if (isProcessing) {
      toast.warning('Já existe um pagamento em processamento');
      return false;
    }

    // Limpar resultado anterior
    globalLastProcessedResult = null;
    try {
      sessionStorage.removeItem('lastTefResult');
      sessionStorage.removeItem('lastTefResultTime');
    } catch {
      // ignore
    }
    
    setIsProcessing(true);
    console.log('[useTEFAndroid] Iniciando pagamento TEF:', params);

    return new Promise((resolve) => {
      // Registrar callback interno para resolver a promise
      globalResultCallback = (resultado) => {
        console.log('[useTEFAndroid] Promise resolvida com resultado:', resultado.status);
        resolve(resultado.status === 'aprovado');
      };
      
      // Chamar Android TEF
      const success = iniciarPagamentoAndroid(
        {
          ordemId: params.ordemId,
          valorCentavos: reaisToCentavos(params.valor),
          metodo: mapPaymentMethod(params.tipo, params.parcelas),
          parcelas: params.parcelas
        },
        (resultado) => {
          // Este callback é chamado pela bridge - pode não ser necessário
          // pois o callback global vai receber o resultado
          console.log('[useTEFAndroid] Callback da bridge recebido:', resultado);
        }
      );

      if (!success) {
        setIsProcessing(false);
        globalResultCallback = null;
        toast.error('Falha ao iniciar pagamento');
        resolve(false);
      } else {
        console.log('[useTEFAndroid] Pagamento iniciado, aguardando resposta do PayGo...');
      }
    });
  }, [isAndroidAvailable, isPinpadConnected, isProcessing]);

  // Cancelar pagamento
  const cancelarPagamento = useCallback(() => {
    if (!isProcessing) {
      return;
    }

    const success = cancelarPagamentoAndroid();
    if (!success) {
      toast.error('Falha ao cancelar pagamento');
    }
  }, [isProcessing]);

  // Verificar conexão do pinpad
  const verificarConexao = useCallback((): TEFPinpadStatus | null => {
    const status = verificarPinpad();
    setPinpadStatus(status);
    setIsPinpadConnected(status?.conectado || false);
    return status;
  }, []);

  return {
    isAndroidAvailable,
    isPinpadConnected,
    isProcessing,
    pinpadStatus,
    androidVersion,
    iniciarPagamento,
    cancelarPagamento,
    verificarConexao
  };
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
