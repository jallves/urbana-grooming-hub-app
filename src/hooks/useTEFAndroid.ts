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
  confirmarTransacaoTEF,
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
      // SALVAR SEMPRE que tiver dados relevantes (aprovado OU erro com pendência)
      const rawData = resultado as Record<string, unknown>;
      const hasRelevantData = rawData.providerName || rawData.merchantId || 
                              rawData.terminalNsu || rawData.localNsu || 
                              rawData.transactionNsu;
      
      if (hasRelevantData) {
        console.log('[useTEFAndroid] 💾 Salvando dados de pendência para resolução futura');
        console.log('[useTEFAndroid] Dados brutos:', JSON.stringify({
          providerName: rawData.providerName,
          merchantId: rawData.merchantId,
          localNsu: rawData.localNsu || rawData.terminalNsu,
          transactionNsu: rawData.transactionNsu || rawData.nsu,
          hostNsu: rawData.hostNsu,
        }));
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

      // ═══════════════════════════════════════════════════════════════════
      // CRÍTICO: Propagar resultado para useTEFPaymentResult via CustomEvent + storage
      // Isso resolve o conflito de window.onTefResultado sendo sobrescrito
      // ═══════════════════════════════════════════════════════════════════
      try {
        console.log('[useTEFAndroid] 📡 Propagando resultado via CustomEvent + storage');
        
        // 1. CustomEvent (mecanismo preferido - síncrono e confiável)
        const customEvent = new CustomEvent('tefPaymentResult', { detail: resultado });
        window.dispatchEvent(customEvent);
        document.dispatchEvent(customEvent);
        
        // 2. SessionStorage + localStorage (fallback para polling)
        const resultJson = JSON.stringify(resultado);
        const now = Date.now().toString();
        sessionStorage.setItem('lastTefResult', resultJson);
        sessionStorage.setItem('lastTefResultTime', now);
        localStorage.setItem('lastTefResult', resultJson);
        localStorage.setItem('lastTefResultTime', now);
      } catch (propagateError) {
        console.warn('[useTEFAndroid] Erro ao propagar resultado:', propagateError);
      }

      switch (normalizedResult.status) {
        case 'aprovado':
          console.log('[useTEFAndroid] ✅ Pagamento APROVADO - chamando onSuccess');
          
          // ═══════════════════════════════════════════════════════════════
          // CRÍTICO: Confirmar transação IMEDIATAMENTE após aprovação!
          // Se a confirmação for adiada (ex: esperar comprovante), o terminal
          // PayGo mantém a transação como "pendente" e a PRÓXIMA transação
          // recebe "negado 90". A confirmação DEVE ser síncrona com a aprovação.
          // 
          // IMPORTANTE: Tentar TODOS os métodos disponíveis, não apenas
          // confirmarTransacaoTEF (que depende de confirmationTransactionId).
          // Muitas vezes o PayGo não envia esse campo, causando falha silenciosa.
          // ═══════════════════════════════════════════════════════════════
          {
            let confirmed = false;
            const TEF = (window as any).TEF;
            
            // Método 1: confirmarTransacao com confirmationTransactionId (campo específico do PayGo)
            const confId = (normalizedResult.confirmationTransactionId || '').trim();
            if (confId) {
              console.log('[useTEFAndroid] 🔐 Método 1: confirmarTransacao com ID:', confId);
              confirmed = confirmarTransacaoTEF(confId, 'CONFIRMADO_AUTOMATICO');
            }
            
            // Método 2: confirmarTransacao usando ordemId como fallback
            // Muitas vezes o PayGo não retorna confirmationTransactionId mas aceita o ordemId
            if (!confirmed && normalizedResult.ordemId) {
              console.log('[useTEFAndroid] 🔐 Método 2: confirmarTransacao com ordemId:', normalizedResult.ordemId);
              confirmed = confirmarTransacaoTEF(normalizedResult.ordemId, 'CONFIRMADO_AUTOMATICO');
            }
            
            // Método 3: confirmApprovedTransaction (APK >= v1.10)
            if (!confirmed && TEF?.confirmApprovedTransaction) {
              console.log('[useTEFAndroid] 🔐 Método 3: confirmApprovedTransaction()');
              try {
                TEF.confirmApprovedTransaction();
                confirmed = true;
              } catch (e) {
                console.warn('[useTEFAndroid] Método 3 falhou:', e);
              }
            }
            
            // Método 4: confirmarTransacao direto SEM ID (alguns APKs aceitam vazio)
            if (!confirmed && TEF?.confirmarTransacao) {
              console.log('[useTEFAndroid] 🔐 Método 4: confirmarTransacao direto sem ID');
              try {
                TEF.confirmarTransacao('', 'CONFIRMADO_AUTOMATICO');
                confirmed = true;
              } catch (e) {
                console.warn('[useTEFAndroid] Método 4 falhou:', e);
              }
            }
            
            // Método 5: resolverPendencia como último fallback
            if (!confirmed && TEF?.resolverPendencia) {
              console.log('[useTEFAndroid] 🔐 Método 5: resolverPendencia(CONFIRMADO_AUTOMATICO)');
              try {
                TEF.resolverPendencia('CONFIRMADO_AUTOMATICO');
                confirmed = true;
              } catch (e) {
                console.warn('[useTEFAndroid] Método 5 falhou:', e);
              }
            }
            
            console.log('[useTEFAndroid] 🔐 Confirmação resultado:', confirmed ? '✅ OK' : '⚠️ Nenhum método confirmou');
            
            if (!confirmed) {
              console.error('[useTEFAndroid] ❌ ALERTA: Nenhum método de confirmação funcionou!');
              console.error('[useTEFAndroid] Dados disponíveis:', JSON.stringify({
                confirmationTransactionId: confId,
                ordemId: normalizedResult.ordemId,
                nsu: normalizedResult.nsu,
                requiresConfirmation: normalizedResult.requiresConfirmation,
                tefMethods: {
                  confirmApprovedTransaction: !!TEF?.confirmApprovedTransaction,
                  confirmarTransacao: !!TEF?.confirmarTransacao,
                  resolverPendencia: !!TEF?.resolverPendencia,
                }
              }));
            }
          }
          
          if (opts.onSuccess) {
            opts.onSuccess(normalizedResult);
          } else {
            console.warn('[useTEFAndroid] onSuccess não definido!');
          }
          break;

        case 'negado':
          console.log('[useTEFAndroid] ❌ Pagamento NEGADO - chamando onError');
          if (opts.onError) {
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
    
    // NÃO escutar CustomEvent aqui - isso criava loop circular
    // (useTEFAndroid dispara CustomEvent E escutava ele mesmo)
    // O useTEFPaymentResult é o único consumer de CustomEvent/storage
    
    return () => {
      console.log('[useTEFAndroid] Cleanup - mantendo window.onTefResultado');
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

    // CRÍTICO: PIX pode funcionar sem Pinpad físico (usa QR Code no terminal)
    // Apenas cartão (credit/debit) requer Pinpad conectado
    if (!isPinpadConnected && params.tipo !== 'pix') {
      console.warn('[useTEFAndroid] Pinpad não conectado (obrigatório para cartão)');
      toast.error('Pinpad não conectado');
      return false;
    }

    if (isProcessing) {
      toast.warning('Já existe um pagamento em processamento');
      return false;
    }

    // ========================================================================
    // IMPORTANTE: Verificar e resolver pendências ANTES de iniciar novo pagamento
    // Isso evita erros "negado código 70/90" e similares
    // DOCUMENTAÇÃO PayGo: Cooldown de 5 SEGUNDOS após resolução é OBRIGATÓRIO
    // para que o terminal limpe sua base interna
    // ========================================================================
    let pendingResolved = false;
    try {
      const TEF = (window as any).TEF;
      
      // Método 1: Verificar via hasPendingTransaction (novo)
      if (TEF?.hasPendingTransaction && TEF.hasPendingTransaction()) {
        console.log('[useTEFAndroid] ⚠️ Pendência detectada via hasPendingTransaction - resolvendo...');
        if (TEF.autoResolvePending) {
          TEF.autoResolvePending();
          pendingResolved = true;
        } else if (TEF.resolverPendencia) {
          TEF.resolverPendencia('CONFIRMADO_MANUAL');
          pendingResolved = true;
        }
      }
      
      // Método 2: Verificar via getPendingInfo (legado)
      if (!pendingResolved && TEF?.getPendingInfo) {
        try {
          const pendingInfo = TEF.getPendingInfo();
          if (pendingInfo && pendingInfo !== '{}' && pendingInfo !== 'null') {
            const parsed = JSON.parse(pendingInfo);
            if (parsed && Object.keys(parsed).length > 0) {
              console.log('[useTEFAndroid] ⚠️ Pendência detectada via getPendingInfo - resolvendo...');
              if (TEF.autoResolvePending) {
                TEF.autoResolvePending();
              } else if (TEF.resolverPendencia) {
                TEF.resolverPendencia('CONFIRMADO_MANUAL');
              }
              pendingResolved = true;
            }
          }
        } catch (e) {
          // Ignorar erro de parsing
        }
      }

      // CRÍTICO: Se resolveu pendência, aguardar 5 segundos (cooldown obrigatório PayGo)
      // Sem esse cooldown, o terminal nega a próxima transação (código 70/90)
      if (pendingResolved) {
        console.log('[useTEFAndroid] ⏳ Aguardando 5s cooldown obrigatório PayGo...');
        toast.info('Preparando terminal...', { description: 'Resolvendo pendência anterior', duration: 4000 });
        await new Promise(r => setTimeout(r, 5000));
        console.log('[useTEFAndroid] ✅ Cooldown concluído');
      }
    } catch (pendingCheckError) {
      console.warn('[useTEFAndroid] Erro ao verificar pendências (não crítico):', pendingCheckError);
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
/**
 * Normaliza o resultado do PayGo para o formato esperado
 * IMPORTANTE: Esta função deve ser consistente com a versão em tefAndroidBridge.ts
 */
function normalizePayGoResult(raw: Record<string, unknown>): TEFResultado {
  // Se já tem status formatado como string válida, usar diretamente
  if (raw.status && typeof raw.status === 'string' && 
      ['aprovado', 'negado', 'cancelado', 'erro'].includes(raw.status as string)) {
    return {
      status: raw.status as TEFResultado['status'],
      valor: typeof raw.valor === 'number' ? raw.valor : 
             typeof raw.amount === 'number' ? raw.amount : undefined,
      bandeira: (raw.bandeira || raw.cardName || '') as string,
      nsu: (raw.nsu || raw.transactionNsu || '') as string,
      autorizacao: (raw.autorizacao || raw.authorizationCode || '') as string,
      codigoResposta: raw.transactionResult?.toString() || raw.codigoResposta?.toString(),
      codigoErro: raw.codigoErro?.toString(),
      mensagem: (raw.mensagem || raw.resultMessage || '') as string,
      comprovanteCliente: (raw.comprovanteCliente || raw.cardholderReceipt || '') as string,
      comprovanteLojista: (raw.comprovanteLojista || raw.merchantReceipt || '') as string,
      ordemId: raw.ordemId as string,
      timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : Date.now(),
      // Dados de confirmação - IMPORTANTES para resolver pendências
      confirmationTransactionId: (raw.confirmationTransactionId || '') as string,
      requiresConfirmation: raw.requiresConfirmation === true || raw.requiresConfirmation === 'true'
    };
  }
  
  // Converter de formato PayGo bruto (quando recebemos transactionResult numérico)
  // ATENÇÃO: transactionResult pode não existir - NÃO usar -99 como default que vira 'erro'
  let transactionResult: number | undefined;
  
  if (typeof raw.transactionResult === 'number') {
    transactionResult = raw.transactionResult;
  } else if (typeof raw.transactionResult === 'string' && raw.transactionResult !== '') {
    transactionResult = parseInt(raw.transactionResult, 10);
  }
  
  // Determinar status baseado no transactionResult do PayGo
  // Códigos PayGo:
  // 0 = Aprovado
  // 1-99 = Negado (diversos motivos)
  // -1 = Cancelado pelo usuário
  // undefined = Verificar outros campos
  let status: TEFResultado['status'];
  
  if (transactionResult !== undefined) {
    if (transactionResult === 0) {
      status = 'aprovado';
    } else if (transactionResult === -1) {
      status = 'cancelado';
    } else if (transactionResult >= 1 && transactionResult <= 99) {
      status = 'negado';
    } else {
      status = 'erro';
    }
  } else {
    // Fallback: se não tem transactionResult, verificar se tem NSU/autorização
    // Se tem, provavelmente foi aprovado
    const hasApprovalData = raw.transactionNsu || raw.nsu || raw.authorizationCode || raw.autorizacao;
    if (hasApprovalData) {
      status = 'aprovado';
    } else if (raw.cancelled === true) {
      status = 'cancelado';
    } else {
      // Se não temos nenhum dado, assumir erro
      status = 'erro';
    }
  }
  
  return {
    status,
    valor: typeof raw.amount === 'number' ? raw.amount : 
           typeof raw.valor === 'number' ? raw.valor : undefined,
    bandeira: (raw.cardName || raw.bandeira || '') as string,
    nsu: (raw.transactionNsu || raw.nsu || '') as string,
    autorizacao: (raw.authorizationCode || raw.autorizacao || '') as string,
    codigoResposta: transactionResult?.toString() || '',
    codigoErro: raw.codigoErro?.toString(),
    mensagem: (raw.resultMessage || raw.mensagem || '') as string,
    comprovanteCliente: (raw.cardholderReceipt || raw.comprovanteCliente || '') as string,
    comprovanteLojista: (raw.merchantReceipt || raw.comprovanteLojista || '') as string,
    timestamp: Date.now(),
    // Dados de confirmação
    confirmationTransactionId: (raw.confirmationTransactionId || '') as string,
    requiresConfirmation: raw.requiresConfirmation === true || raw.requiresConfirmation === 'true'
  };
}
