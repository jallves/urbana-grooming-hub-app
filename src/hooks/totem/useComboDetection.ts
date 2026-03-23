import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ComboMatch {
  combo_service_id: string;
  combo_nome: string;
  combo_preco: number;
  /** IDs dos serviços individuais que formam o combo */
  component_ids: string[];
  /** Soma dos preços individuais (sem combo) */
  individual_total: number;
  /** Economia ao usar o combo */
  savings: number;
}

interface DetectComboResult {
  found: boolean;
  combo: ComboMatch | null;
}

/**
 * Hook para detectar combos de serviços no checkout do totem.
 * Dado o serviço principal + extras, verifica se existe um combo
 * cadastrado que cubra todos esses serviços — e se o preço do combo
 * é menor que a soma individual.
 */
export function useComboDetection() {
  // Cache dos combos para não re-buscar a cada chamada
  const comboCacheRef = useRef<Array<{
    combo_service_id: string;
    combo_nome: string;
    combo_preco: number;
    component_ids: string[];
  }> | null>(null);

  const loadCombos = useCallback(async () => {
    if (comboCacheRef.current) return comboCacheRef.current;

    // Buscar todos os combos com seus componentes
    const { data, error } = await supabase
      .from('combo_service_items')
      .select('combo_service_id, component_service_id');

    if (error || !data || data.length === 0) {
      comboCacheRef.current = [];
      return [];
    }

    // Agrupar por combo
    const comboMap = new Map<string, string[]>();
    for (const row of data) {
      const list = comboMap.get(row.combo_service_id) || [];
      list.push(row.component_service_id);
      comboMap.set(row.combo_service_id, list);
    }

    // Buscar nomes e preços dos combos
    const comboIds = Array.from(comboMap.keys());
    const { data: services } = await supabase
      .from('painel_servicos')
      .select('id, nome, preco')
      .in('id', comboIds);

    const result = comboIds.map((comboId) => {
      const svc = services?.find((s) => s.id === comboId);
      return {
        combo_service_id: comboId,
        combo_nome: svc?.nome || 'Combo',
        combo_preco: Number(svc?.preco) || 0,
        component_ids: comboMap.get(comboId) || [],
      };
    });

    comboCacheRef.current = result;
    return result;
  }, []);

  /**
   * Detecta o melhor combo disponível para um conjunto de serviços.
   * @param mainServiceId - ID do serviço principal do agendamento
   * @param mainServicePreco - Preço do serviço principal
   * @param extraServiceIds - IDs dos serviços extras adicionados
   * @param extraServicesPrices - Map de ID -> preço para os extras
   */
  const detectCombo = useCallback(async (
    mainServiceId: string,
    mainServicePreco: number,
    extraServiceIds: string[],
    extraServicesPrices: Record<string, number>,
  ): Promise<DetectComboResult> => {
    if (extraServiceIds.length === 0) {
      return { found: false, combo: null };
    }

    const combos = await loadCombos();
    if (combos.length === 0) {
      return { found: false, combo: null };
    }

    // Todos os serviços que o cliente vai receber
    const allServiceIds = new Set([mainServiceId, ...extraServiceIds]);

    // Encontrar o melhor combo (maior economia)
    let bestMatch: ComboMatch | null = null;

    for (const combo of combos) {
      const comboComponents = new Set(combo.component_ids);

      // Verificar se TODOS os componentes do combo estão nos serviços selecionados
      const allComponentsPresent = combo.component_ids.every((id) => allServiceIds.has(id));
      if (!allComponentsPresent) continue;

      // Calcular soma individual dos componentes do combo
      let individualTotal = 0;
      for (const componentId of combo.component_ids) {
        if (componentId === mainServiceId) {
          individualTotal += mainServicePreco;
        } else {
          individualTotal += extraServicesPrices[componentId] || 0;
        }
      }

      const savings = individualTotal - combo.combo_preco;

      // Só considerar se o combo é mais barato
      if (savings <= 0) continue;

      // Preferir o combo com maior economia
      if (!bestMatch || savings > bestMatch.savings) {
        bestMatch = {
          combo_service_id: combo.combo_service_id,
          combo_nome: combo.combo_nome,
          combo_preco: combo.combo_preco,
          component_ids: combo.component_ids,
          individual_total: individualTotal,
          savings,
        };
      }
    }

    return {
      found: !!bestMatch,
      combo: bestMatch,
    };
  }, [loadCombos]);

  return { detectCombo };
}
