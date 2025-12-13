import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  isAndroidTEFAvailable,
  iniciarPagamentoAndroid,
  cancelarPagamentoAndroid,
  verificarPinpad,
  registrarListenersPinpad,
  mapPaymentMethod,
  reaisToCentavos,
  TEFResultado,
  TEFPinpadStatus
} from '@/lib/tef/tefAndroidBridge';

interface UseTEFAndroidOptions {
  onSuccess?: (resultado: TEFResultado) => void;
  onError?: (erro: string) => void;
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

export function useTEFAndroid(options: UseTEFAndroidOptions = {}): UseTEFAndroidReturn {
  const [isAndroidAvailable, setIsAndroidAvailable] = useState(false);
  const [isPinpadConnected, setIsPinpadConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pinpadStatus, setPinpadStatus] = useState<TEFPinpadStatus | null>(null);
  const [androidVersion, setAndroidVersion] = useState<string | null>(null);

  // Verificar disponibilidade do Android TEF
  useEffect(() => {
    const checkAvailability = () => {
      const available = isAndroidTEFAvailable();
      console.log('[useTEFAndroid] ========== VERIFICAÇÃO TEF ==========');
      console.log('[useTEFAndroid] window.TEF existe?', typeof window.TEF !== 'undefined');
      console.log('[useTEFAndroid] isAndroidAvailable:', available);
      setIsAndroidAvailable(available);
      
      if (available) {
        // IMPORTANTE: Se window.TEF existe, PayGo está disponível
        // O PayGo gerencia o pinpad internamente
        const status = verificarPinpad();
        console.log('[useTEFAndroid] Pinpad status:', JSON.stringify(status));
        setPinpadStatus(status);
        
        // Se window.TEF existe e PayGo está instalado, consideramos conectado
        const connected = status?.conectado ?? false;
        setIsPinpadConnected(connected);
        console.log('[useTEFAndroid] isPinpadConnected:', connected);
        
        // Verificar também via isReady se disponível
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

    // Verificar imediatamente
    checkAvailability();

    // Verificar novamente após delays progressivos
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
        
        // Verificar pinpad quando Android estiver pronto
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

    setIsProcessing(true);

    return new Promise((resolve) => {
      const success = iniciarPagamentoAndroid(
        {
          ordemId: params.ordemId,
          valorCentavos: reaisToCentavos(params.valor),
          metodo: mapPaymentMethod(params.tipo, params.parcelas),
          parcelas: params.parcelas
        },
        (resultado) => {
          setIsProcessing(false);

          switch (resultado.status) {
            case 'aprovado':
              toast.success('Pagamento aprovado!', {
                description: `NSU: ${resultado.nsu}`
              });
              options.onSuccess?.(resultado);
              resolve(true);
              break;

            case 'negado':
              toast.error('Pagamento negado', {
                description: resultado.mensagem || 'Tente novamente'
              });
              options.onError?.(resultado.mensagem || 'Pagamento negado');
              resolve(false);
              break;

            case 'cancelado':
              toast.info('Pagamento cancelado');
              options.onCancelled?.();
              resolve(false);
              break;

            case 'erro':
              toast.error('Erro no pagamento', {
                description: resultado.mensagem
              });
              options.onError?.(resultado.mensagem || 'Erro desconhecido');
              resolve(false);
              break;

            default:
              toast.error('Status desconhecido');
              resolve(false);
          }
        }
      );

      if (!success) {
        setIsProcessing(false);
        toast.error('Falha ao iniciar pagamento');
        resolve(false);
      }
    });
  }, [isAndroidAvailable, isPinpadConnected, isProcessing, options]);

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
