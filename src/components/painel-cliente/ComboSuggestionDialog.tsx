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

  useEffect(() => {
    if (!isOpen || !mainServiceId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setSelectedComboId(null);
      try {
        // 1. Buscar todos os combos que contêm este serviço
        const { data: comboRefs } = await supabase
          .from('combo_service_items')
          .select('combo_service_id')
          .eq('component_service_id', mainServiceId);

        const comboIds = Array.from(new Set((comboRefs || []).map(r => r.combo_service_id)));
        if (comboIds.length === 0) {
          if (!cancelled) setCandidates([]);
          return;
        }

        // 2. Buscar TODOS os componentes destes combos + dados dos combos
        const [{ data: allItems }, { data: combosData }] = await Promise.all([
          supabase
            .from('combo_service_items')
            .select('combo_service_id, component_service_id')
            .in('combo_service_id', comboIds),
          supabase
            .from('painel_servicos')
            .select('id, nome, preco')
            .in('id', comboIds),
        ]);

        // 3. Buscar dados dos componentes (todos exceto o main)
        const missingIds = Array.from(new Set(
          (allItems || [])
            .filter(r => r.component_service_id !== mainServiceId)
            .map(r => r.component_service_id)
        ));

        const { data: missingData } = missingIds.length > 0
          ? await supabase
              .from('painel_servicos')
              .select('id, nome, preco, duracao, is_active, ativo')
              .in('id', missingIds)
          : { data: [] as any[] };

        // 4. Montar candidatos
        const result: ComboCandidate[] = [];
        for (const comboId of comboIds) {
          const comboInfo = combosData?.find(c => c.id === comboId);
          if (!comboInfo) continue;
          const components = (allItems || [])
            .filter(r => r.combo_service_id === comboId)
            .map(r => r.component_service_id);

          const missing = components
            .filter(id => id !== mainServiceId)
            .map(id => {
              const svc = missingData?.find((m: any) => m.id === id);
              if (!svc) return null;
              if ((svc as any).is_active === false || (svc as any).ativo === false) return null;
              return {
                id: svc.id,
                nome: svc.nome,
                preco: Number(svc.preco) || 0,
                duracao: Number(svc.duracao) || 0,
              };
            })
            .filter(Boolean) as ComboCandidate['missing'];

          // Combo com 0 faltantes (o próprio main já cobre tudo) — ignorar
          if (missing.length === 0) continue;

          const individualTotal = mainServicePrice + missing.reduce((s, m) => s + m.preco, 0);
          const comboPreco = Number(comboInfo.preco) || 0;
          const savings = individualTotal - comboPreco;

          // Só sugerir se houver economia real
          if (savings <= 0) continue;

          result.push({
            combo_service_id: comboId,
            combo_nome: comboInfo.nome,
            combo_preco: comboPreco,
            missing,
            individual_total: individualTotal,
            savings,
          });
        }

        // Ordenar por maior economia
        result.sort((a, b) => b.savings - a.savings);

        if (!cancelled) {
          setCandidates(result);
          if (result.length > 0) setSelectedComboId(result[0].combo_service_id);
        }
      } catch (err) {
        console.error('[ComboSuggestionDialog] erro:', err);
        if (!cancelled) setCandidates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, mainServiceId, mainServicePrice]);

  // Se não achou nada, fecha automaticamente sem incomodar
  useEffect(() => {
    if (isOpen && !loading && candidates.length === 0) {
      onClose();
    }
  }, [isOpen, loading, candidates.length, onClose]);

  const selected = candidates.find(c => c.combo_service_id === selectedComboId) || null;

  const handleAccept = () => {
    if (!selected) return;
    onAccept(selected.missing);
  };

  if (!isOpen || (candidates.length === 0 && !loading)) return null;

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
              Combo disponível
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold leading-tight">
            Que tal completar seu combo?
          </h2>
          {selected && (
            <p className="text-[12px] sm:text-sm text-white/90 mt-0.5">
              Adicione e economize <b>{formatBRL(selected.savings)}</b>
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
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && selected && (
          <div className="shrink-0 border-t border-amber-200/60 bg-white/90 backdrop-blur-sm p-3 sm:p-4 space-y-2">
            <Button
              type="button"
              onClick={handleAccept}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold h-11 text-xs sm:text-sm"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Adicionar combo e economizar
            </Button>
            {onAddOther && (
              <Button
                type="button"
                variant="outline"
                onClick={onAddOther}
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 h-11 text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Adicionar outro serviço
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-full text-gray-600 hover:bg-gray-100 h-10 text-xs sm:text-sm"
            >
              Continuar sem combo
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ComboSuggestionDialog;