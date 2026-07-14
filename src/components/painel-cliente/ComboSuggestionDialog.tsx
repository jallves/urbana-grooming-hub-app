import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Check, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComboCandidate {
  combo_service_id: string;
  combo_nome: string;
  combo_preco: number;
  /** Serviços que faltam ser adicionados para completar o combo */
  missing: Array<{ id: string; nome: string; preco: number; duracao: number }>;
  /** Soma individual (main + missing) */
  individual_total: number;
  /** Economia */
  savings: number;
}

interface ComboSuggestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mainServiceId: string | null;
  mainServicePrice: number;
  /** Chamado quando cliente aceita adicionar os serviços faltantes */
  onAccept: (added: Array<{ id: string; nome: string; preco: number; duracao: number }>) => void;
  /** Chamado quando o cliente prefere adicionar um serviço avulso (fora do combo) */
  onAddOther?: () => void;
}

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Cache module-level: carrega todos os combos + serviços uma única vez
// e reutiliza entre aberturas do popup.
interface ComboMeta {
  combo_service_id: string;
  combo_nome: string;
  combo_preco: number;
  component_ids: string[];
}
interface ServiceMeta { id: string; nome: string; preco: number; duracao: number; active: boolean }

let combosCache: { combos: ComboMeta[]; services: Map<string, ServiceMeta>; topServiceIds: string[] } | null = null;
let combosCachePromise: Promise<{ combos: ComboMeta[]; services: Map<string, ServiceMeta>; topServiceIds: string[] }> | null = null;

export async function preloadComboSuggestions() {
  if (combosCache) return combosCache;
  if (combosCachePromise) return combosCachePromise;
  combosCachePromise = (async () => {
    const sinceIso = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const [{ data: items }, { data: services }, { data: ranking }] = await Promise.all([
      supabase.from('combo_service_items').select('combo_service_id, component_service_id'),
      supabase.from('painel_servicos').select('id, nome, preco, duracao, is_active, ativo'),
      supabase
        .from('painel_agendamentos')
        .select('servico_id')
        .eq('status', 'concluido')
        .gte('data', sinceIso)
        .not('servico_id', 'is', null)
        .limit(5000),
    ]);
    const svcMap = new Map<string, ServiceMeta>();
    (services || []).forEach((s: any) => {
      svcMap.set(s.id, {
        id: s.id,
        nome: s.nome,
        preco: Number(s.preco) || 0,
        duracao: Number(s.duracao) || 0,
        active: s.is_active !== false && s.ativo !== false,
      });
    });
    const grouped = new Map<string, string[]>();
    (items || []).forEach((it: any) => {
      const arr = grouped.get(it.combo_service_id) || [];
      arr.push(it.component_service_id);
      grouped.set(it.combo_service_id, arr);
    });
    const combos: ComboMeta[] = [];
    grouped.forEach((component_ids, combo_service_id) => {
      const svc = svcMap.get(combo_service_id);
      if (!svc) return;
      combos.push({
        combo_service_id,
        combo_nome: svc.nome,
        combo_preco: svc.preco,
        component_ids,
      });
    });
    // Ranking de serviços mais executados (últimos 90 dias).
    // Excluímos apenas os próprios combos (serviços "pai"); componentes individuais
    // como "Barba" permanecem no ranking mesmo fazendo parte de um combo.
    const comboIds = new Set(combos.map(c => c.combo_service_id));
    const counts = new Map<string, number>();
    (ranking || []).forEach((r: any) => {
      const id = r.servico_id;
      if (!id) return;
      counts.set(id, (counts.get(id) || 0) + 1);
    });
    const topServiceIds = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .filter(id => {
        const s = svcMap.get(id);
        return !!s && s.active && !comboIds.has(id);
      });
    combosCache = { combos, services: svcMap, topServiceIds };
    return combosCache;
  })();
  try {
    return await combosCachePromise;
  } finally {
    combosCachePromise = null;
  }
}

const ComboSuggestionDialog: React.FC<ComboSuggestionDialogProps> = ({
  isOpen,
  onClose,
  mainServiceId,
  mainServicePrice,
  onAccept,
  onAddOther,
}) => {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<ComboCandidate[]>([]);
  const [selectedComboId, setSelectedComboId] = useState<string | null>(null);
  const [topExtras, setTopExtras] = useState<Array<{ id: string; nome: string; preco: number; duracao: number }>>([]);
  const [selectedExtraIds, setSelectedExtraIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen || !mainServiceId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setSelectedComboId(null);
      setSelectedExtraIds(new Set());
      try {
        const { combos, services } = await preloadComboSuggestions();
        const result: ComboCandidate[] = [];
        for (const combo of combos) {
          if (!combo.component_ids.includes(mainServiceId)) continue;
          const missing = combo.component_ids
            .filter(id => id !== mainServiceId)
            .map(id => services.get(id))
            .filter((s): s is ServiceMeta => !!s && s.active)
            .map(s => ({ id: s.id, nome: s.nome, preco: s.preco, duracao: s.duracao }));
          if (missing.length === 0) continue;
          const individualTotal = mainServicePrice + missing.reduce((s, m) => s + m.preco, 0);
          const savings = individualTotal - combo.combo_preco;
          if (savings <= 0) continue;
          result.push({
            combo_service_id: combo.combo_service_id,
            combo_nome: combo.combo_nome,
            combo_preco: combo.combo_preco,
            missing,
            individual_total: individualTotal,
            savings,
          });
        }

        // Ordenar por maior economia
        result.sort((a, b) => b.savings - a.savings);

        // Top serviços populares (excluindo apenas o serviço principal).
        // Mesmo quando há combo, mostramos serviços avulsos populares (ex.: Barba)
        // — o cliente pode preferir adicionar só um deles em vez do combo inteiro.
        const cache = combosCache;
        const excluded = new Set<string>([mainServiceId]);
        const limit = result.length > 0 ? 2 : 3;
        const tops: Array<{ id: string; nome: string; preco: number; duracao: number }> = [];
        if (cache) {
          for (const id of cache.topServiceIds) {
            if (excluded.has(id)) continue;
            const s = cache.services.get(id);
            if (!s) continue;
            tops.push({ id: s.id, nome: s.nome, preco: s.preco, duracao: s.duracao });
            if (tops.length >= limit) break;
          }
          // Fallback: se não houver ranking suficiente, completa com serviços ativos aleatórios
          if (tops.length < limit) {
            for (const s of cache.services.values()) {
              if (tops.length >= limit) break;
              if (excluded.has(s.id) || !s.active) continue;
              if (tops.some(t => t.id === s.id)) continue;
              tops.push({ id: s.id, nome: s.nome, preco: s.preco, duracao: s.duracao });
            }
          }
        }

        if (!cancelled) {
          setCandidates(result);
          if (result.length > 0) setSelectedComboId(result[0].combo_service_id);
          setTopExtras(tops);
        }
      } catch (err) {
        console.error('[ComboSuggestionDialog] erro:', err);
        if (!cancelled) { setCandidates([]); setTopExtras([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, mainServiceId, mainServicePrice]);

  // Se realmente não há nada a sugerir, fecha automaticamente
  useEffect(() => {
    if (isOpen && !loading && candidates.length === 0 && topExtras.length === 0) {
      onClose();
    }
  }, [isOpen, loading, candidates.length, topExtras.length, onClose]);

  const selected = candidates.find(c => c.combo_service_id === selectedComboId) || null;

  const handleAccept = () => {
    if (!selected) return;
    onAccept(selected.missing);
  };

  const toggleExtra = (id: string) => {
    setSelectedExtraIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAddSelectedExtras = () => {
    const picked = topExtras.filter(t => selectedExtraIds.has(t.id));
    if (picked.length === 0) return;
    onAccept(picked);
  };

  if (!isOpen || (candidates.length === 0 && topExtras.length === 0 && !loading)) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[94vw] sm:max-w-[460px] p-0 overflow-hidden border-0 bg-gradient-to-br from-amber-50 via-white to-amber-50 max-h-[95dvh] flex flex-col rounded-2xl [&>button[type='button']:last-child]:hidden"
      >
        <div className="sr-only">
          <DialogTitle>Combo disponível</DialogTitle>
          <DialogDescription>Complete seu combo e economize</DialogDescription>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-2.5 right-2.5 z-30 h-9 w-9 rounded-full bg-white/95 shadow-lg border border-amber-200 flex items-center justify-center active:scale-95 transition"
        >
          <X className="h-5 w-5 text-amber-700" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-white pr-14 shrink-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">
              {candidates.length > 0 ? 'Combo disponível' : 'Combine e aproveite'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold leading-tight">
            {candidates.length > 0 ? 'Que tal completar seu combo?' : 'Quer adicionar mais um serviço?'}
          </h2>
          {selected ? (
            <p className="text-[12px] sm:text-sm text-white/90 mt-0.5">
              Adicione e economize <b>{formatBRL(selected.savings)}</b>
            </p>
          ) : (
            <p className="text-[12px] sm:text-sm text-white/90 mt-0.5">
              Sugestões populares para complementar seu atendimento
            </p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {loading ? (
            <div className="py-6 text-center text-sm text-gray-500">
              Verificando combos disponíveis...
            </div>
          ) : (
            <>
              {/* Seletor de combo (só aparece se houver 2+ candidatos) */}
              {candidates.length > 1 && (
                <div className="space-y-2">
                  {candidates.map((c) => (
                    <button
                      key={c.combo_service_id}
                      type="button"
                      onClick={() => setSelectedComboId(c.combo_service_id)}
                      className={cn(
                        'w-full text-left rounded-xl border-2 p-3 transition-all bg-white',
                        selectedComboId === c.combo_service_id
                          ? 'border-amber-500 shadow-sm bg-amber-50/60'
                          : 'border-gray-200'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{c.combo_nome}</span>
                        <span className="text-xs font-bold text-emerald-700">
                          -{formatBRL(c.savings)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        Combo por <b>{formatBRL(c.combo_preco)}</b> · {c.missing.length} serviço{c.missing.length > 1 ? 's' : ''} a adicionar
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {selected && (
                <div className="rounded-xl border-2 border-amber-300 bg-white p-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                    Serviços que serão adicionados
                  </p>
                  {selected.missing.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-900">
                        <Plus className="h-3.5 w-3.5 text-amber-600" strokeWidth={3} />
                        {m.nome}
                      </span>
                      <span className="text-gray-600">{formatBRL(m.preco)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Total avulso</span>
                      <span className="line-through">{formatBRL(selected.individual_total)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-amber-700">
                      <span>Total no combo</span>
                      <span>{formatBRL(selected.combo_preco)}</span>
                    </div>
                  </div>
                </div>
              )}

              {topExtras.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    {candidates.length > 0 ? 'Ou adicione um popular' : 'Mais executados'}
                  </p>
                  {topExtras.map((t) => {
                    const active = selectedExtraIds.has(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleExtra(t.id)}
                        className={cn(
                          'w-full flex items-center justify-between rounded-xl border-2 p-3 transition-all text-left',
                          active
                            ? 'border-amber-500 bg-amber-50/70'
                            : 'border-gray-200 bg-white'
                        )}
                      >
                        <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <span className={cn(
                            'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                            active ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300 text-transparent'
                          )}>
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          {t.nome}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">{formatBRL(t.preco)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (selected || topExtras.length > 0) && (
          <div className="shrink-0 border-t border-amber-200/60 bg-white/90 backdrop-blur-sm p-3 sm:p-4 space-y-2">
            {selected && (
              <Button
                type="button"
                onClick={handleAccept}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold h-11 text-xs sm:text-sm"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Adicionar combo e economizar
              </Button>
            )}
            {selectedExtraIds.size > 0 && (
              <Button
                type="button"
                onClick={handleAddSelectedExtras}
                className="w-full bg-urbana-black hover:bg-urbana-black/90 text-white font-semibold h-11 text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Adicionar selecionado{selectedExtraIds.size > 1 ? 's' : ''} ({selectedExtraIds.size})
              </Button>
            )}
            {onAddOther && (
              <Button
                type="button"
                variant="outline"
                onClick={onAddOther}
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 h-11 text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Ver todos os serviços e produtos
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-full text-gray-600 hover:bg-gray-100 h-10 text-xs sm:text-sm"
            >
              Continuar sem adicionar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ComboSuggestionDialog;