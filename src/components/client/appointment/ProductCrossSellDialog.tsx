import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCrossSellProducts, CrossSellProduct } from '@/hooks/useCrossSellProducts';
import { Check, Plus, Sparkles, X, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCrossSellDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedProducts: CrossSellProduct[]) => void;
  isSubmitting?: boolean;
}

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ProductCrossSellDialog: React.FC<ProductCrossSellDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const { products, loading } = useCrossSellProducts(4);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Reset índice quando abrir/fechar
  useEffect(() => {
    if (isOpen) setCurrentIdx(0);
  }, [isOpen]);

  const goPrev = () => {
    if (products.length === 0) return;
    setCurrentIdx((i) => (i - 1 + products.length) % products.length);
  };
  const goNext = () => {
    if (products.length === 0) return;
    setCurrentIdx((i) => (i + 1) % products.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      delta > 0 ? goPrev() : goNext();
    }
    touchStartX.current = null;
  };

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedProducts = products.filter(p => selectedIds.has(p.id));
  const total = selectedProducts.reduce((sum, p) => sum + p.preco, 0);

  const handleSkip = () => {
    setSelectedIds(new Set());
    onConfirm([]);
  };

  const handleConfirm = () => {
    onConfirm(selectedProducts);
  };

  // Se não há produtos, fecha automaticamente confirmando vazio
  React.useEffect(() => {
    if (!loading && isOpen && products.length === 0) {
      onConfirm([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, products.length, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent
        className="max-w-[94vw] sm:max-w-[480px] p-0 overflow-hidden border-0 bg-gradient-to-br from-amber-50 via-white to-amber-50 max-h-[95vh] overflow-y-auto rounded-2xl [&>button[type='button']:last-child]:hidden"
      >
        <div className="sr-only">
          <DialogTitle>Que tal levar um produto?</DialogTitle>
          <DialogDescription>Sugestões de produtos para complementar seu agendamento</DialogDescription>
        </div>

        {/* Botão fechar grande e visível */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Fechar e continuar sem produtos"
          className="absolute top-2.5 right-2.5 z-30 h-9 w-9 rounded-full bg-white/95 shadow-lg border border-amber-200 flex items-center justify-center active:scale-95 transition disabled:opacity-50"
        >
          <X className="h-5 w-5 text-amber-700" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-white pr-14">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">
              Oferta exclusiva
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold leading-tight">
            Que tal levar um produto?
          </h2>
          <p className="text-[11px] sm:text-xs text-white/90 mt-0.5">
            Adicione ao agendamento e pague tudo no checkout.
          </p>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4">
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Carregando sugestões...
            </div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Nenhum produto disponível no momento.
            </div>
          ) : (
            <>
              {/* Carrossel — 1 produto por vez com loop infinito */}
              <div className="relative">
                {/* Viewport do carrossel — full-width no mobile, setas sobrepostas */}
                <div
                  className="overflow-hidden rounded-xl touch-pan-y"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <div
                    className="flex transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${currentIdx * 100}%)` }}
                  >
                    {products.map((p) => {
                      const selected = selectedIds.has(p.id);
                      return (
                        <div key={p.id} className="w-full flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => toggle(p.id)}
                            disabled={isSubmitting}
                            className={cn(
                              'relative w-full text-left rounded-xl border-2 bg-white overflow-hidden transition-all duration-200',
                              'active:scale-[0.99] flex flex-row sm:flex-col',
                              selected
                                ? 'border-amber-500 ring-2 ring-amber-200 shadow-md'
                                : 'border-gray-200 shadow-sm'
                            )}
                          >
                            {selected && (
                              <div className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow">
                                <Check className="h-4 w-4" strokeWidth={3} />
                              </div>
                            )}

                            {/* Imagem — quadrada lateral no mobile, topo no desktop */}
                            <div className="w-32 h-32 sm:w-full sm:h-auto sm:aspect-square shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden">
                              {p.imagem_url ? (
                                <img
                                  src={p.imagem_url}
                                  alt={p.nome}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <Package className="h-12 w-12 text-gray-300" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 p-2.5 sm:p-3 flex flex-col justify-between">
                              <div>
                                <p className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 leading-tight">
                                  {p.nome}
                                </p>
                                <p className="text-lg sm:text-xl font-bold text-amber-600 mt-1.5">
                                  {formatBRL(p.preco)}
                                </p>
                              </div>
                              <div
                                className={cn(
                                  'mt-2 flex items-center justify-center gap-1 rounded-lg py-2 text-xs sm:text-sm font-semibold transition-colors',
                                  selected
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-amber-100 text-amber-700'
                                )}
                              >
                                {selected ? (
                                  <>
                                    <Check className="h-3.5 w-3.5" /> Adicionado
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-3.5 w-3.5" /> Adicionar
                                  </>
                                )}
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Setas + Bullets em uma única linha de controle */}
                {products.length > 1 && (
                  <div className="flex items-center justify-between gap-3 mt-3 px-1">
                    <button
                      type="button"
                      onClick={goPrev}
                      disabled={isSubmitting}
                      aria-label="Produto anterior"
                      className="h-10 w-10 shrink-0 rounded-full bg-white shadow border border-amber-200 flex items-center justify-center active:scale-95 transition disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5 text-amber-700" />
                    </button>

                    {/* Bullets */}
                    <div className="flex items-center justify-center gap-1.5 flex-1">
                      {products.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCurrentIdx(i)}
                          aria-label={`Ir para produto ${i + 1}`}
                          className={cn(
                            'h-2 rounded-full transition-all',
                            i === currentIdx ? 'w-6 bg-amber-500' : 'w-2 bg-amber-200'
                          )}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={goNext}
                      disabled={isSubmitting}
                      aria-label="Próximo produto"
                      className="h-10 w-10 shrink-0 rounded-full bg-white shadow border border-amber-200 flex items-center justify-center active:scale-95 transition disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5 text-amber-700" />
                    </button>
                  </div>
                )}
              </div>

              {/* Total */}
              {selectedProducts.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-900">
                    {selectedProducts.length}{' '}
                    {selectedProducts.length === 1 ? 'produto adicionado' : 'produtos adicionados'}
                  </span>
                  <span className="text-lg font-bold text-amber-700">
                    {formatBRL(total)}
                  </span>
                </div>
              )}

              {/* Ações */}
              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="flex-1 border-gray-300"
                >
                  Não, obrigado
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold"
                >
                  {isSubmitting
                    ? 'Confirmando...'
                    : selectedProducts.length > 0
                      ? `Confirmar com ${selectedProducts.length} ${selectedProducts.length === 1 ? 'produto' : 'produtos'}`
                      : 'Confirmar agendamento'}
                </Button>
              </div>

              <p className="mt-3 text-[11px] text-center text-gray-500">
                ✓ O pagamento será feito apenas no momento do checkout na barbearia
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductCrossSellDialog;