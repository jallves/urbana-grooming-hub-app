/**
 * useTEFPendingManager - Gerenciamento de Transações Pendentes TEF
 * 
 * Implementação conforme documentação oficial PayGo:
 * - Verificação automática na inicialização
 * - Verificação antes de cada nova venda
 * - Persistência do estado vendaCommitada
 * - Decisão automática CONFIRMAR/DESFAZER baseada em vendaCommitada
 * - Bloqueio de novas vendas com pendência ativa
 * - Logs detalhados para homologação
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isAndroidTEFAvailable,
  getPendingInfoAndroid,
  resolverPendenciaAndroid,
  confirmarTransacaoTEF
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
}

export interface TEFPendingLog {
  timestamp: string;
  type: 'check' | 'detect' | 'decision' | 'resolve' | 'error' | 'block';
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
  onError?: (error: string) => void;
}

export function useTEFPendingManager(options: UseTEFPendingManagerOptions = {}) {
  const { autoResolve = true, onPendingDetected, onPendingResolved, onError } = options;

  // Estado
  const [vendaState, setVendaState] = useState<VendaState | null>(() => loadVendaState());
  const [pendingState, setPendingState] = useState<PendingState>({
    hasPending: false,
    pendingData: null,
    lastCheck: 0,
    resolving: false,
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
  // VERIFICAÇÃO DE PENDÊNCIA
  // ============================================================================

  const checkPending = useCallback((): { hasPending: boolean; data: Record<string, unknown> | null } => {
    if (!isAndroidTEFAvailable()) {
      addLog('check', 'TEF Android não disponível - verificação ignorada');
      return { hasPending: false, data: null };
    }

    addLog('check', 'Verificando transação pendente...');

    try {
      const info = getPendingInfoAndroid();
      
      if (!info) {
        addLog('check', 'Nenhuma informação de pendência retornada');
        return { hasPending: false, data: null };
      }

      // Verificar se existe pendência real
      const hasPendingData = info.hasPendingData === true;
      const hasConfirmationId = !!(info.lastConfirmationId || info.confirmationId);
      const pendingData = info.pendingData as Record<string, unknown> | undefined;
      
      const hasPending = hasPendingData || hasConfirmationId;

      addLog('check', `Resultado da verificação: ${hasPending ? 'PENDÊNCIA DETECTADA' : 'Sem pendências'}`, {
        hasPendingData,
        hasConfirmationId,
        confirmationId: info.lastConfirmationId || info.confirmationId,
        pendingData: pendingData ? 'presente' : 'ausente',
      });

      setPendingState(prev => ({
        ...prev,
        hasPending,
        pendingData: info,
        lastCheck: Date.now(),
      }));

      if (hasPending) {
        setIsBlocked(true);
        addLog('detect', 'TRANSAÇÃO PENDENTE DETECTADA - Bloqueando novas vendas', info);
        
        if (optionsRef.current.onPendingDetected) {
          optionsRef.current.onPendingDetected(info);
        }
      } else {
        setIsBlocked(false);
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
    
    addLog('decision', 'Decidindo resolução de pendência...', {
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
  // RESOLVER PENDÊNCIA
  // ============================================================================

  const resolvePending = useCallback(async (
    acao: 'confirmar' | 'desfazer',
    confirmationId?: string
  ): Promise<boolean> => {
    if (pendingState.resolving) {
      addLog('block', 'Resolução já em andamento - ignorando');
      return false;
    }

    setPendingState(prev => ({ ...prev, resolving: true }));
    
    const status = acao === 'confirmar' ? 'CONFIRMADO_MANUAL' : 'DESFEITO_MANUAL';
    
    addLog('resolve', `Resolvendo pendência: ${acao.toUpperCase()}`, {
      status,
      confirmationId: confirmationId || 'automático',
    });

    try {
      let success = false;

      // Tentar com confirmationId específico primeiro
      if (confirmationId) {
        success = confirmarTransacaoTEF(confirmationId, status as any);
        addLog('resolve', success 
          ? `✅ confirmarTransacaoTEF(${confirmationId}, ${status}) - sucesso`
          : `❌ confirmarTransacaoTEF falhou`);
      }

      // Fallback: usar resolverPendenciaAndroid
      if (!success) {
        success = resolverPendenciaAndroid(acao);
        addLog('resolve', success 
          ? `✅ resolverPendenciaAndroid(${acao}) - sucesso`
          : `❌ resolverPendenciaAndroid falhou`);
      }

      if (success) {
        // Limpar estados
        setVendaState(null);
        saveVendaState(null);
        setIsBlocked(false);
        setPendingState({
          hasPending: false,
          pendingData: null,
          lastCheck: Date.now(),
          resolving: false,
        });

        if (optionsRef.current.onPendingResolved) {
          optionsRef.current.onPendingResolved(acao === 'confirmar' ? 'confirmado' : 'desfeito');
        }

        addLog('resolve', `✅ Pendência resolvida com ${acao.toUpperCase()}`);
      } else {
        addLog('error', 'Falha ao resolver pendência');
        if (optionsRef.current.onError) {
          optionsRef.current.onError('Falha ao resolver pendência');
        }
      }

      return success;
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
  }, [pendingState.resolving, addLog]);

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
    
    // Obter confirmationId dos dados de pendência
    const confirmationId = data?.lastConfirmationId as string | undefined 
      || data?.confirmationId as string | undefined
      || (data?.pendingData as Record<string, unknown>)?.confirmationTransactionId as string | undefined;

    return resolvePending(acao, confirmationId);
  }, [checkPending, autoResolve, decideResolution, resolvePending, addLog]);

  // ============================================================================
  // GERENCIAMENTO DE ESTADO DA VENDA
  // ============================================================================

  const startVenda = useCallback((ordemId: string, valor: number, metodo: string): boolean => {
    // BLOQUEIO: Não permitir nova venda com pendência ativa
    if (isBlocked || pendingState.hasPending) {
      addLog('block', 'BLOQUEADO: Tentativa de nova venda com pendência ativa', {
        ordemId,
        valor,
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
    addLog('check', `Venda iniciada: ${ordemId} - R$ ${(valor / 100).toFixed(2)}`, { ordemId, valor, metodo });

    return true;
  }, [isBlocked, pendingState.hasPending, addLog]);

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
  // VERIFICAÇÃO NA INICIALIZAÇÃO
  // ============================================================================

  useEffect(() => {
    if (!isAndroidTEFAvailable()) {
      return;
    }

    addLog('check', '═══════════════════════════════════════');
    addLog('check', 'INICIALIZAÇÃO DO GERENCIADOR DE PENDÊNCIAS');
    addLog('check', '═══════════════════════════════════════');

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
