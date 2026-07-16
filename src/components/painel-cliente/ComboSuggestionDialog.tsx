import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Check, X, Plus, Minus, Scissors, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComboCandidate {
  combo_service_id: string;
  combo_nome: string;
  combo_preco: number;
  /** Serviços que faltam ser adicionados para completar o combo */
  missing: Array<{ id: string; nome: string; preco: number; duracao: number; imagem?: string | null }>;
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
  mainServiceName?: string | null;
  mainServiceDuration?: number | null;
  mainServiceImage?: string | null;
  /** Quantidade já selecionada do serviço principal (default: 1) */
  mainServiceQty?: number;
  /** Quantidades já selecionadas de outros serviços (map id → qty) */
  initialExtraQuantities?: Record<string, number>;
  /** Chamado quando cliente aceita adicionar os serviços faltantes */
  onAccept: (added: Array<{ id: string; nome: string; preco: number; duracao: number; imagem?: string | null; quantidade?: number }>) => void;
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
interface ServiceMeta { id: string; nome: string; preco: number; duracao: number; active: boolean; imagem?: string | null }

let combosCache: { combos: ComboMeta[]; services: Map<string, ServiceMeta>; topServiceIds: string[] } | null = null;
let combosCachePromise: Promise<{ combos: ComboMeta[]; services: Map<string, ServiceMeta>; topServiceIds: string[] }> | null = null;

export async function preloadComboSuggestions() {
  if (combosCache) return combosCache;
  if (combosCachePromise) return combosCachePromise;
  combosCachePromise = (async () => {
    const sinceIso = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const [{ data: items }, { data: services }, { data: ranking }] = await Promise.all([
      supabase.from('combo_service_items').select('combo_service_id, component_service_id'),
      supabase.from('painel_servicos').select('id, nome, preco, duracao, is_active, ativo, imagens'),
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
      let imagem: string | null = null;
      const raw = s.imagens;
      if (Array.isArray(raw)) imagem = raw[0] || null;
      else if (typeof raw === 'string' && raw.trim()) {
        const t = raw.trim();
        if (t.startsWith('[')) {
          try { const arr = JSON.parse(t); imagem = Array.isArray(arr) ? arr[0] || null : t; } catch { imagem = t; }
        } else imagem = t;
      }
      svcMap.set(s.id, {
        id: s.id,
        nome: s.nome,
        preco: Number(s.preco) || 0,
        duracao: Number(s.duracao) || 0,
        active: s.is_active !== false && s.ativo !== false,
        imagem,
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
  mainServiceName,
  mainServiceDuration,
  mainServiceImage,
  mainServiceQty = 1,
  initialExtraQuantities,
  onAccept,
  onAddOther,
}) => {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<ComboCandidate[]>([]);
  const [selectedComboId, setSelectedComboId] = useState<string | null>(null);
  const [topExtras, setTopExtras] = useState<Array<{ id: string; nome: string; preco: number; duracao: number; imagem?: string | null }>>([]);
  const [extraQtyMap, setExtraQtyMap] = useState<Record<string, number>>({});
  /** Quantidade extra do serviço principal (0 = apenas o já selecionado; 1 = +1 duplicata, etc.) */
  const [mainExtraQty, setMainExtraQty] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !mainServiceId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setSelectedComboId(null);
      // Preserva a quantidade extra do principal escolhida na tela anterior.
      setMainExtraQty(Math.max(0, (mainServiceQty || 1) - 1));
      // Semeia quantidades de outros serviços já pré-selecionados.
      setExtraQtyMap(() => {
        const seed: Record<string, number> = {};
        if (initialExtraQuantities) {
          for (const [id, q] of Object.entries(initialExtraQuantities)) {
            if (id === mainServiceId) continue;
            if (q && q > 0) seed[id] = q;
          }
        }
        return seed;
      });
      try {
        const { combos, services } = await preloadComboSuggestions();
        const result: ComboCandidate[] = [];
        for (const combo of combos) {
          if (!combo.component_ids.includes(mainServiceId)) continue;
          const missing = combo.component_ids
            .filter(id => id !== mainServiceId)
            .map(id => services.get(id))
            .filter((s): s is ServiceMeta => !!s && s.active)
            .map(s => ({ id: s.id, nome: s.nome, preco: s.preco, duracao: s.duracao, imagem: s.imagem }));
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
        const tops: Array<{ id: string; nome: string; preco: number; duracao: number; imagem?: string | null }> = [];
        if (cache) {
          for (const id of cache.topServiceIds) {
            if (excluded.has(id)) continue;
            const s = cache.services.get(id);
            if (!s) continue;
            tops.push({ id: s.id, nome: s.nome, preco: s.preco, duracao: s.duracao, imagem: s.imagem });
            if (tops.length >= limit) break;
          }
          // Fallback: se não houver ranking suficiente, completa com serviços ativos aleatórios
          if (tops.length < limit) {
            for (const s of cache.services.values()) {
              if (tops.length >= limit) break;
              if (excluded.has(s.id) || !s.active) continue;
              if (tops.some(t => t.id === s.id)) continue;
              tops.push({ id: s.id, nome: s.nome, preco: s.preco, duracao: s.duracao, imagem: s.imagem });
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
    const items: Array<{ id: string; nome: string; preco: number; duracao: number; imagem?: string | null; quantidade?: number }> = [];
    if (selected) {
      for (const m of selected.missing) items.push({ ...m, quantidade: 1 });
    }
    if (mainExtraQty > 0 && mainServiceId) {
      items.push({
        id: mainServiceId,
        nome: mainServiceName || 'Serviço',
        preco: mainServicePrice,
        duracao: mainServiceDuration || 0,
        imagem: mainServiceImage || null,
        quantidade: mainExtraQty,
      });
    }
    for (const [id, qty] of Object.entries(extraQtyMap)) {
      if (!qty) continue;
      const t = topExtras.find(x => x.id === id);
      if (!t) continue;
      items.push({ ...t, quantidade: qty });
    }
    if (items.length === 0) return;
    onAccept(items);
  };

  const incExtra = (id: string) =>
    setExtraQtyMap(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const decExtra = (id: string) =>
    setExtraQtyMap(prev => {
      const next = { ...prev };
      const v = (next[id] || 0) - 1;
      if (v <= 0) delete next[id]; else next[id] = v;
      return next;
    });

  const totalExtraCount = mainExtraQty
    + Object.values(extraQtyMap).reduce((a, b) => a + b, 0)
    + (selected ? selected.missing.length : 0);

  if (!isOpen || (candidates.length === 0 && topExtras.length === 0 && !loading)) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[94vw] sm:max-w-[460px] p-0 overflow-hidden border border-urbana-gold/30 bg-gradient-to-br from-urbana-black via-urbana-black-soft to-urbana-black max-h-[95dvh] flex flex-col rounded-2xl shadow-2xl shadow-urbana-gold/20 [&>button[type='button']:last-child]:hidden"
      >
        <div className="sr-only">
          <DialogTitle>Combo disponível</DialogTitle>
          <DialogDescription>Complete seu combo e economize</DialogDescription>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-2.5 right-2.5 z-30 h-9 w-9 rounded-full bg-urbana-black-soft/95 shadow-lg border border-urbana-gold/40 flex items-center justify-center active:scale-95 transition"
        >
          <X className="h-5 w-5 text-urbana-gold" />
        </button>

        {/* Header */}
        <div className="relative bg-gradient-to-r from-urbana-black-soft via-urbana-black to-urbana-black-soft border-b border-urbana-gold/30 px-4 py-3 pr-14 shrink-0 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[radial-gradient(circle_at_top_right,_hsl(43_65%_60%),_transparent_60%)]" />
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="h-4 w-4 text-urbana-gold" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-urbana-gold">
              {candidates.length > 0 ? 'Combo disponível' : 'Combine e aproveite'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold leading-tight text-urbana-light">
            {candidates.length > 0 ? 'Que tal completar seu combo?' : 'Quer adicionar mais um serviço?'}
          </h2>
          {selected ? (
            <p className="text-[12px] sm:text-sm text-urbana-light/70 mt-0.5">
              Adicione e economize <b className="text-urbana-gold">{formatBRL(selected.savings)}</b>
            </p>
          ) : (
            <p className="text-[12px] sm:text-sm text-urbana-light/70 mt-0.5">
              Sugestões populares para complementar seu atendimento
            </p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {loading ? (
            <div className="py-6 text-center text-sm text-urbana-light/50">
              Verificando combos disponíveis...
            </div>
          ) : (
            <>
              {/* Serviço já selecionado — permite adicionar duplicatas (ex.: 2x corte) */}
              {mainServiceId && mainServiceName && (
                <div className="rounded-xl border-2 border-urbana-gold/40 bg-urbana-black-soft/70 p-2 flex gap-2 items-center">
                  <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-urbana-black">
                    {mainServiceImage ? (
                      <img src={mainServiceImage} alt={mainServiceName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-urbana-black to-urbana-brown/60">
                        <Scissors className="w-6 h-6 text-urbana-gold/60" />
                      </div>
                    )}
                    <div className="absolute top-0.5 left-0.5 text-[9px] font-bold px-1 rounded bg-urbana-gold text-urbana-black shadow">
                      SELECIONADO
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-urbana-light leading-tight line-clamp-2">
                      {mainServiceName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-urbana-gold">{formatBRL(mainServicePrice)}</span>
                      {mainServiceDuration ? (
                        <span className="text-[10px] text-urbana-light/60 flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />{mainServiceDuration}min
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[10px] text-urbana-light/50 mt-0.5">
                      Quer repetir esse serviço? Some quantas vezes precisar.
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1 bg-urbana-black rounded-lg border border-urbana-gold/40 px-1 py-0.5">
                      <button
                        type="button"
                        onClick={() => setMainExtraQty(q => Math.max(0, q - 1))}
                        className="h-7 w-7 flex items-center justify-center text-urbana-gold disabled:opacity-30"
                        disabled={mainExtraQty === 0}
                        aria-label="Diminuir"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-bold text-urbana-light w-6 text-center">
                        {1 + mainExtraQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMainExtraQty(q => q + 1)}
                        className="h-7 w-7 flex items-center justify-center text-urbana-gold"
                        aria-label="Aumentar"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {mainExtraQty > 0 && (
                      <span className="text-[9px] text-urbana-gold/80 font-semibold uppercase">
                        +{mainExtraQty} extra{mainExtraQty > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Seletor de combo (só aparece se houver 2+ candidatos) */}
              {candidates.length > 1 && (
                <div className="space-y-2">
                  {candidates.map((c) => (
                    <button
                      key={c.combo_service_id}
                      type="button"
                      onClick={() => setSelectedComboId(c.combo_service_id)}
                      className={cn(
                        'w-full text-left rounded-xl border-2 p-3 transition-all',
                        selectedComboId === c.combo_service_id
                          ? 'border-urbana-gold bg-urbana-gold/10 shadow-[0_0_0_1px_hsl(43_65%_60%/0.3)]'
                          : 'border-urbana-gold/20 bg-urbana-black-soft/60'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-urbana-light text-sm">{c.combo_nome}</span>
                        <span className="text-xs font-bold text-urbana-gold">
                          -{formatBRL(c.savings)}
                        </span>
                      </div>
                      <p className="text-[11px] text-urbana-light/60 mt-0.5">
                        Combo por <b className="text-urbana-light/90">{formatBRL(c.combo_preco)}</b> · {c.missing.length} serviço{c.missing.length > 1 ? 's' : ''} a adicionar
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {selected && (
                <div className="rounded-xl border-2 border-urbana-gold/50 bg-urbana-black-soft/70 p-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-urbana-gold">
                    Serviços que serão adicionados
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.missing.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-xl overflow-hidden border-2 border-urbana-gold/40 bg-gradient-to-b from-white/5 to-transparent shadow-md"
                      >
                        <div className="relative aspect-[4/3] bg-urbana-black overflow-hidden">
                          {m.imagem ? (
                            <img src={m.imagem} alt={m.nome} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-urbana-black to-urbana-brown/60">
                              <Scissors className="w-8 h-8 text-urbana-gold/50" />
                            </div>
                          )}
                          <div className="absolute top-1.5 left-1.5 h-6 w-6 rounded-full bg-urbana-gold text-urbana-black flex items-center justify-center shadow">
                            <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                          </div>
                        </div>
                        <div className="p-2 space-y-0.5">
                          <p className="text-[13px] font-semibold text-urbana-light leading-tight line-clamp-2 min-h-[2.2em]">
                            {m.nome}
                          </p>
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-sm font-bold text-urbana-gold">{formatBRL(m.preco)}</span>
                            <span className="text-[10px] text-urbana-light/60 flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {m.duracao}min
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-urbana-gold/20 pt-2 mt-2 space-y-1">
                    <div className="flex justify-between text-xs text-urbana-light/50">
                      <span>Total avulso</span>
                      <span className="line-through">{formatBRL(selected.individual_total)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-urbana-gold">
                      <span>Total no combo</span>
                      <span>{formatBRL(selected.combo_preco)}</span>
                    </div>
                  </div>
                </div>
              )}

              {topExtras.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-urbana-light/50 pt-1">
                    {candidates.length > 0 ? 'Ou adicione um popular' : 'Mais executados'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {topExtras.map((t) => {
                      const qty = extraQtyMap[t.id] || 0;
                      const active = qty > 0;
                      return (
                        <div
                          key={t.id}
                          className={cn(
                            'text-left rounded-xl overflow-hidden border-2 transition-all shadow-md',
                            active
                              ? 'border-urbana-gold bg-urbana-gold/10 ring-2 ring-urbana-gold/40'
                              : 'border-urbana-gold/20 bg-white/5'
                          )}
                        >
                          <div className="relative aspect-[4/3] bg-urbana-black overflow-hidden">
                            {t.imagem ? (
                              <img src={t.imagem} alt={t.nome} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-urbana-black to-urbana-brown/60">
                                <Scissors className="w-8 h-8 text-urbana-gold/50" />
                              </div>
                            )}
                            {active && (
                              <div className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-urbana-gold text-urbana-black shadow">
                                x{qty}
                              </div>
                            )}
                          </div>
                          <div className="p-2 space-y-0.5">
                            <p className="text-[13px] font-semibold text-urbana-light leading-tight line-clamp-2 min-h-[2.2em]">
                              {t.nome}
                            </p>
                            <div className="flex items-center justify-between pt-0.5">
                              <span className="text-sm font-bold text-urbana-gold">{formatBRL(t.preco)}</span>
                              <span className="text-[10px] text-urbana-light/60 flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {t.duracao}min
                              </span>
                            </div>
                            <div className="flex items-center justify-center gap-1 mt-1 bg-urbana-black rounded-md border border-urbana-gold/30 px-1 py-0.5">
                              <button
                                type="button"
                                onClick={() => decExtra(t.id)}
                                disabled={!active}
                                aria-label="Diminuir"
                                className="h-6 w-6 flex items-center justify-center text-urbana-gold disabled:opacity-30"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="text-xs font-bold text-urbana-light w-5 text-center">{qty}</span>
                              <button
                                type="button"
                                onClick={() => incExtra(t.id)}
                                aria-label="Aumentar"
                                className="h-6 w-6 flex items-center justify-center text-urbana-gold"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (selected || topExtras.length > 0 || (mainServiceId && !!mainServiceName)) && (
          <div className="shrink-0 border-t border-urbana-gold/25 bg-urbana-black/95 backdrop-blur-sm p-3 sm:p-4 space-y-2">
            {(selected || mainExtraQty > 0 || Object.values(extraQtyMap).some(v => v > 0)) && (
              <Button
                type="button"
                onClick={handleAccept}
                className="w-full bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold hover:from-urbana-gold-dark hover:to-urbana-gold-dark text-urbana-black font-bold h-12 text-sm sm:text-base shadow-lg shadow-urbana-gold/30 border border-urbana-gold-light"
              >
                <Check className="w-5 h-5 mr-2" strokeWidth={3} />
                {selected
                  ? 'Adicionar combo e economizar'
                  : `Adicionar ${totalExtraCount} serviço${totalExtraCount > 1 ? 's' : ''}`}
              </Button>
            )}
            {onAddOther && (
              <Button
                type="button"
                onClick={onAddOther}
                className="w-full bg-urbana-black-soft hover:bg-urbana-brown-light text-urbana-gold hover:text-urbana-gold-light font-semibold h-12 text-sm sm:text-base border-2 border-urbana-gold/60 shadow-md shadow-black/40"
              >
                <Plus className="w-5 h-5 mr-2" strokeWidth={3} />
                Ver todos os serviços e produtos
              </Button>
            )}
            <Button
              type="button"
              onClick={onClose}
              className="w-full bg-urbana-gray/40 hover:bg-urbana-gray/60 text-urbana-light font-semibold h-12 text-sm sm:text-base border border-urbana-light/20"
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