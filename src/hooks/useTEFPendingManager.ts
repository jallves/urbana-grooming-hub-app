/**
 * useTEFPendingManager - Gerenciamento de Transações Pendentes TEF
 * 
 * Implementação COMPLETA conforme documentação oficial PayGo:
 * 
 * REGRA FUNDAMENTAL: Enquanto existir qualquer transação pendente, 
 * o PayGo bloqueia novas vendas. O PDV deve obrigatoriamente resolver
 * a pendência antes de continuar.
 * 
 * FLUXO OBRIGATÓRIO:
 * 1. No BOOT do PDV: verificar pendência
 * 2. Antes de CADA venda: verificar pendência
 * 3. Se venda retornar -2599: resolver pendência
 * 4. Após resolução: VALIDAR que pendência foi realmente limpa
 * 5. Só então permitir nova venda
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isAndroidTEFAvailable,
  getPendingInfoAndroid,
  resolverPendenciaAndroid,
  confirmarTransacaoTEF,
  savePendingDataToLocalStorage,
  clearSavedPendingData,
  limparPendingDataCompleto
} from '@/lib/tef/tefAndroidBridge';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface VendaState {
  ordemId: string;
  valor: number;
  metodo: string;
  timestamp: number;
  status: 'iniciada' | 'aprovada' | 'finalizada' | 'falhou';
  vendaCommitada: boolean;
  confirmationId?: string;
  nsu?: string;
  autorizacao?: string;
}

export interface PendingState {
  hasPending: boolean;
  pendingData: Record<string, unknown> | null;
  lastCheck: number;
  resolving: boolean;
  lastResolutionAttempt?: number;
  resolutionValidated?: boolean;
}

export interface TEFPendingLog {
  timestamp: string;
  type: 'check' | 'detect' | 'decision' | 'resolve' | 'validate' | 'error' | 'block';
  message: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  VENDA_STATE: 'tef_venda_state',
  PENDING_STATE: 'tef_pending_state',
  PENDING_LOGS: 'tef_pending_logs',
  PENDING_DATA: 'tef_pending_data',
  LAST_CONFIRMATION_ID: 'tef_last_confirmation_id',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function saveVendaState(state: VendaState | null): void {
  try {
    if (state) {
      localStorage.setItem(STORAGE_KEYS.VENDA_STATE, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEYS.VENDA_STATE);
    }
  } catch (e) {
    console.error('[TEFPending] Erro ao salvar vendaState:', e);
  }
}

function loadVendaState(): VendaState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VENDA_STATE);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error('[TEFPending] Erro ao carregar vendaState:', e);
    return null;
  }
}

function savePendingLogs(logs: TEFPendingLog[]): void {
  try {
    // Manter apenas os últimos 100 logs
    const trimmed = logs.slice(-100);
    localStorage.setItem(STORAGE_KEYS.PENDING_LOGS, JSON.stringify(trimmed));
  } catch (e) {
    console.error('[TEFPending] Erro ao salvar logs:', e);
  }
}

function loadPendingLogs(): TEFPendingLog[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PENDING_LOGS);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

interface UseTEFPendingManagerOptions {
  autoResolve?: boolean; // Se true, resolve automaticamente baseado em vendaCommitada
  onPendingDetected?: (info: Record<string, unknown>) => void;
  onPendingResolved?: (status: 'confirmado' | 'desfeito') => void;
  onResolutionFailed?: (reason: string) => void;
  onError?: (error: string) => void;
}

export function useTEFPendingManager(options: UseTEFPendingManagerOptions = {}) {
  const { autoResolve = true, onPendingDetected, onPendingResolved, onResolutionFailed, onError } = options;

  // Estado
  const [vendaState, setVendaState] = useState<VendaState | null>(() => loadVendaState());
  const [pendingState, setPendingState] = useState<PendingState>({
    hasPending: false,
    pendingData: null,
    lastCheck: 0,
    resolving: false,
    resolutionValidated: false,
  });
  const [logs, setLogs] = useState<TEFPendingLog[]>(() => loadPendingLogs());
  const [isBlocked, setIsBlocked] = useState(false);

  // Refs para callbacks
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // ============================================================================
  // LOGGING
  // ============================================================================

  const addLog = useCallback((
    type: TEFPendingLog['type'],
    message: string,
    data?: Record<string, unknown>
  ) => {
    const log: TEFPendingLog = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
    };
    console.log(`[TEFPending][${type.toUpperCase()}]`, message, data || '');
    
    setLogs(prev => {
      const updated = [...prev, log];
      savePendingLogs(updated);
      return updated;
    });
  }, []);

  // ============================================================================
  // VERIFICAÇÃO DE PENDÊNCIA (paygoPendingCheckUri)
  // ============================================================================

  const checkPending = useCallback((): { hasPending: boolean; data: Record<string, unknown> | null } => {
    if (!isAndroidTEFAvailable()) {
      addLog('check', 'TEF Android não disponível - verificação ignorada');
      return { hasPending: false, data: null };
    }

    addLog('check', '🔍 Verificando transação pendente (paygoPendingCheckUri)...');

    try {
      const info = getPendingInfoAndroid();
      
      if (!info) {
        addLog('check', 'Nenhuma informação de pendência retornada');
        setPendingState(prev => ({
          ...prev,
          hasPending: false,
          pendingData: null,
          lastCheck: Date.now(),
        }));
        setIsBlocked(false);
        return { hasPending: false, data: null };
      }

      // ════════════════════════════════════════════════════════════════════════
      // VERIFICAÇÃO DE PENDÊNCIA - PRIORIZAR RESPOSTA DO APK
      // ════════════════════════════════════════════════════════════════════════
      // O APK consulta o PayGo SDK real via getPendingInfo()
      // Se o APK diz hasPendingData: false, devemos confiar nele
      // localStorage é apenas fallback para quando APK não está disponível
      // ════════════════════════════════════════════════════════════════════════
      
      const hasPendingData = info.hasPendingData === true;
      const pendingData = info.pendingData as Record<string, unknown> | undefined;
      
      // REMOVIDO: hasConfirmationId - causa falsos positivos
      // O confirmationId no localStorage é apenas para referência, não indica pendência real
      // A pendência real é determinada APENAS pelo APK (que consulta PayGo SDK)
      
      const hasPending = hasPendingData;

      addLog('check', `Resultado: ${hasPending ? '⚠️ PENDÊNCIA DETECTADA' : '✅ Sem pendências'}`, {
        hasPendingData,
        source: info.source || 'APK',
        pendingData: pendingData ? 'presente' : 'ausente',
      });

      setPendingState(prev => ({
        ...prev,
        hasPending,
        pendingData: info,
        lastCheck: Date.now(),
        resolutionValidated: !hasPending,
      }));

      if (hasPending) {
        setIsBlocked(true);
        addLog('detect', '🚫 BLOQUEANDO NOVAS VENDAS - Pendência ativa', info);
        
        // Salvar dados de pendência para uso na resolução
        if (info) {
          savePendingDataToLocalStorage(info);
        }
        
        if (optionsRef.current.onPendingDetected) {
          optionsRef.current.onPendingDetected(info);
        }
      } else {
        setIsBlocked(false);
        
        // Se não há pendência, garantir que dados locais estão limpos
        clearSavedPendingData();
      }

      return { hasPending, data: info };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog('error', `Erro ao verificar pendência: ${errorMsg}`);
      return { hasPending: false, data: null };
    }
  }, [addLog]);

  // ============================================================================
  // DECISÃO CONFIRMAR/DESFAZER
  // ============================================================================

  const decideResolution = useCallback((): 'confirmar' | 'desfazer' => {
    const state = loadVendaState();
    
    addLog('decision', '🤔 Decidindo resolução de pendência...', {
      vendaState: state ? {
        ordemId: state.ordemId,
        status: state.status,
        vendaCommitada: state.vendaCommitada,
        timestamp: state.timestamp,
      } : null,
    });

    // REGRA PRINCIPAL (conforme documentação PayGo):
    // ✅ CONFIRMAR: se a venda foi registrada com sucesso (vendaCommitada = true)
    // ❌ DESFAZER: se houve falha, reinício, ou na dúvida

    if (!state) {
      addLog('decision', '❌ Nenhum estado de venda encontrado → DESFAZER');
      return 'desfazer';
    }

    // Verificar se a venda é recente (últimas 2 horas)
    const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 horas
    const age = Date.now() - state.timestamp;
    
    if (age > MAX_AGE_MS) {
      addLog('decision', `❌ Venda muito antiga (${Math.round(age / 60000)} min) → DESFAZER`);
      return 'desfazer';
    }

    // Decisão baseada em vendaCommitada
    if (state.vendaCommitada && state.status === 'finalizada') {
      addLog('decision', '✅ vendaCommitada=true e status=finalizada → CONFIRMAR');
      return 'confirmar';
    }

    if (state.status === 'aprovada' && !state.vendaCommitada) {
      addLog('decision', '❌ status=aprovada mas vendaCommitada=false → DESFAZER (venda não persistida)');
      return 'desfazer';
    }

    if (state.status === 'falhou') {
      addLog('decision', '❌ status=falhou → DESFAZER');
      return 'desfazer';
    }

    // Na dúvida, DESFAZER (regra da documentação)
    addLog('decision', '❌ Situação incerta → DESFAZER (padrão seguro)');
    return 'desfazer';
  }, [addLog]);

  // ============================================================================
  // RESOLVER PENDÊNCIA (paygoPendingConfirmUri / paygoPendingVoidUri)
  // ============================================================================

  const resolvePending = useCallback(async (
    acao: 'confirmar' | 'desfazer',
    pendingDataFromJS?: Record<string, unknown>
  ): Promise<boolean> => {
    if (pendingState.resolving) {
      addLog('block', 'Resolução já em andamento - ignorando');
      return false;
    }

    setPendingState(prev => ({ ...prev, resolving: true, lastResolutionAttempt: Date.now() }));
    
    const status = acao === 'confirmar' ? 'CONFIRMADO_MANUAL' : 'DESFEITO_MANUAL';
    
    addLog('resolve', `🔄 Resolvendo pendência: ${acao.toUpperCase()}`, {
      status,
      hasPendingData: !!pendingDataFromJS,
    });

    try {
      // ====================================================================
      // PASSO 1: Enviar comando de resolução via URI
      // ====================================================================
      const success = resolverPendenciaAndroid(acao, undefined, pendingDataFromJS);
      
      if (!success) {
        addLog('error', `❌ Falha ao enviar comando ${acao.toUpperCase()}`);
        if (optionsRef.current.onError) {
          optionsRef.current.onError(`Falha ao enviar comando ${acao}`);
        }
        return false;
      }
      
      addLog('resolve', `✅ Comando ${acao.toUpperCase()} enviado ao PayGo`);

      // ====================================================================
      // PASSO 2: VALIDAÇÃO PÓS-RESOLUÇÃO (OBRIGATÓRIO)
      // 
      // PROBLEMA IDENTIFICADO: O APK limpa seus dados internos após chamar
      // resolverPendenciaComDados(), mas o PayGo SDK pode ainda ter pendência.
      // 
      // SOLUÇÃO TEMPORÁRIA: Fazer múltiplas verificações com intervalos maiores
      // para dar tempo ao PayGo processar e ao APK sincronizar.
      // 
      // SOLUÇÃO DEFINITIVA: APK precisa chamar transacao.obtemDadosTransacaoPendente()
      // do PayGo SDK real para verificar se ainda existe pendência.
      // ====================================================================
      addLog('validate', '⏳ Aguardando validação pós-resolução (múltiplas verificações)...');
      
      // Aguardar 2 segundos iniciais para o PayGo processar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fazer até 3 verificações com intervalos de 1 segundo
      let stillPending = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        addLog('validate', `🔄 Verificação ${attempt}/3...`);
        const result = checkPending();
        stillPending = result.hasPending;
        
        if (!stillPending) {
          addLog('validate', `✅ Verificação ${attempt}/3: Sem pendência`);
          break;
        }
        
        addLog('validate', `⚠️ Verificação ${attempt}/3: Pendência ainda detectada`, result.data);
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (stillPending) {
        // ❌ PENDÊNCIA NÃO FOI RESOLVIDA
        addLog('validate', '❌ VALIDAÇÃO FALHOU após 3 tentativas: Pendência ainda existe!', {
          acao,
          observacao: 'O PayGo não processou a resolução. APK precisa atualização para consultar SDK real.'
        });
        
        // IMPORTANTE: Não limpar os dados locais - manter para nova tentativa
        
        if (optionsRef.current.onResolutionFailed) {
          optionsRef.current.onResolutionFailed('Pendência não foi resolvida pelo PayGo - APK precisa atualização');
        }
        
        return false;
      }

      // ✅ PENDÊNCIA RESOLVIDA COM SUCESSO
      addLog('validate', '✅ VALIDAÇÃO OK: Pendência resolvida com sucesso!');
      
      // ════════════════════════════════════════════════════════════════════
      // LIMPAR DADOS DE PENDÊNCIA DO APK E LOCALSTORAGE
      // Agora que confirmamos que o PayGo processou, podemos limpar
      // ════════════════════════════════════════════════════════════════════
      addLog('resolve', '🗑️ Limpando dados de pendência (APK + localStorage)...');
      limparPendingDataCompleto();
      
      // Limpar estados do hook
      setVendaState(null);
      saveVendaState(null);
      setIsBlocked(false);
      setPendingState({
        hasPending: false,
        pendingData: null,
        lastCheck: Date.now(),
        resolving: false,
        resolutionValidated: true,
      });

      if (optionsRef.current.onPendingResolved) {
        optionsRef.current.onPendingResolved(acao === 'confirmar' ? 'confirmado' : 'desfeito');
      }

      addLog('resolve', `🎉 Pendência resolvida com ${acao.toUpperCase()} e VALIDADA`);
      return true;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog('error', `Erro ao resolver pendência: ${errorMsg}`);
      if (optionsRef.current.onError) {
        optionsRef.current.onError(errorMsg);
      }
      return false;
    } finally {
      setPendingState(prev => ({ ...prev, resolving: false }));
    }
  }, [pendingState.resolving, addLog, checkPending]);

  // ============================================================================
  // RESOLUÇÃO AUTOMÁTICA
  // ============================================================================

  const autoResolvePending = useCallback(async (): Promise<boolean> => {
    const { hasPending, data } = checkPending();
    
    if (!hasPending) {
      return true; // Sem pendência = sucesso
    }

    if (!autoResolve) {
      addLog('block', 'Resolução automática desabilitada - aguardando ação manual');
      return false;
    }

    // Decidir ação baseada em vendaCommitada
    const acao = decideResolution();
    
    // Usar dados de pendência disponíveis
    const pendingData = data?.pendingData as Record<string, unknown> | undefined || data;

    return resolvePending(acao, pendingData);
  }, [checkPending, autoResolve, decideResolution, resolvePending, addLog]);

  // ============================================================================
  // GERENCIAMENTO DE ESTADO DA VENDA
  // ============================================================================

  const startVenda = useCallback((ordemId: string, valor: number, metodo: string): boolean => {
    // ====================================================================
    // VERIFICAÇÃO OBRIGATÓRIA ANTES DE INICIAR VENDA
    // Conforme documentação: "Sempre antes de disparar paygoSaleUri(...)"
    // ====================================================================
    addLog('check', '🔍 Verificação pré-venda obrigatória...');
    const { hasPending } = checkPending();
    
    if (hasPending || isBlocked) {
      addLog('block', '🚫 BLOQUEADO: Não é possível iniciar venda com pendência ativa', {
        ordemId,
        valor,
        hasPending,
        isBlocked,
      });
      return false;
    }

    const state: VendaState = {
      ordemId,
      valor,
      metodo,
      timestamp: Date.now(),
      status: 'iniciada',
      vendaCommitada: false,
    };

    setVendaState(state);
    saveVendaState(state);
    addLog('check', `✅ Venda iniciada: ${ordemId} - R$ ${(valor / 100).toFixed(2)}`, { ordemId, valor, metodo });

    return true;
  }, [isBlocked, checkPending, addLog]);

  const setVendaAprovada = useCallback((confirmationId: string, nsu: string, autorizacao: string) => {
    setVendaState(prev => {
      if (!prev) return null;
      
      const updated: VendaState = {
        ...prev,
        status: 'aprovada',
        confirmationId,
        nsu,
        autorizacao,
        // vendaCommitada ainda é false - será true após persistir no banco
      };
      
      saveVendaState(updated);
      addLog('check', 'Venda aprovada - aguardando persistência', { confirmationId, nsu });
      
      return updated;
    });
  }, [addLog]);

  const setVendaCommitada = useCallback((commitada: boolean = true) => {
    setVendaState(prev => {
      if (!prev) return null;
      
      const updated: VendaState = {
        ...prev,
        status: commitada ? 'finalizada' : 'falhou',
        vendaCommitada: commitada,
      };
      
      saveVendaState(updated);
      addLog('check', commitada 
        ? '✅ vendaCommitada=true - Venda persistida com sucesso'
        : '❌ vendaCommitada=false - Falha ao persistir venda', 
        { ordemId: prev.ordemId }
      );
      
      return updated;
    });
  }, [addLog]);

  const clearVendaState = useCallback(() => {
    setVendaState(null);
    saveVendaState(null);
    addLog('check', 'Estado de venda limpo');
  }, [addLog]);

  // ============================================================================
  // VERIFICAÇÃO NA INICIALIZAÇÃO (BOOT DO PDV)
  // ============================================================================

  useEffect(() => {
    if (!isAndroidTEFAvailable()) {
      return;
    }

    addLog('check', '╔═══════════════════════════════════════════════════════════╗');
    addLog('check', '║   INICIALIZAÇÃO DO PDV - VERIFICAÇÃO DE PENDÊNCIAS        ║');
    addLog('check', '╚═══════════════════════════════════════════════════════════╝');

    // Verificar e resolver pendências na inicialização
    autoResolvePending();
  }, []);

  // ============================================================================
  // FUNÇÕES PÚBLICAS
  // ============================================================================

  const canStartNewTransaction = useCallback((): boolean => {
    if (isBlocked) {
      addLog('block', 'Verificação canStartNewTransaction: BLOQUEADO');
      return false;
    }
    
    // Re-verificar pendência antes de permitir nova transação
    const { hasPending } = checkPending();
    return !hasPending;
  }, [isBlocked, checkPending, addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    savePendingLogs([]);
  }, []);

  // ============================================================================
  // RETORNO DO HOOK
  // ============================================================================

  return {
    // Estado
    vendaState,
    pendingState,
    isBlocked,
    logs,

    // Verificação
    checkPending,
    canStartNewTransaction,

    // Resolução
    resolvePending,
    autoResolvePending,
    decideResolution,

    // Gerenciamento de venda
    startVenda,
    setVendaAprovada,
    setVendaCommitada,
    clearVendaState,

    // Utilitários
    addLog,
    clearLogs,
  };
}

// Exportar tipos
export type { UseTEFPendingManagerOptions };
