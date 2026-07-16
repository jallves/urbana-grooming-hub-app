import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCrossSellProducts, CrossSellProduct } from '@/hooks/useCrossSellProducts';
import { Plus, Minus, Sparkles, X, Package, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCrossSellDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedProducts: (CrossSellProduct & { quantidade: number })[]) => void;
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
  // Mapa: produto.id -> quantidade selecionada
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) setQuantities({});
  }, [isOpen]);

  const setQty = (id: string, max: number, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      const copy = { ...prev };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  };

  const selectedProducts = products
    .filter(p => (quantities[p.id] || 0) > 0)
    .map(p => ({ ...p, quantidade: quantities[p.id] }));
  const total = selectedProducts.reduce((sum, p) => sum + p.preco * p.quantidade, 0);
  const totalItems = selectedProducts.reduce((sum, p) => sum + p.quantidade, 0);

  const handleSkip = () => {
    setQuantities({});
    onConfirm([]);
  };

  const handleConfirm = () => {
    onConfirm(selectedProducts);
  };

  // Se não há produtos disponíveis, fecha automaticamente
  useEffect(() => {
    if (!loading && isOpen && products.length === 0) {
      onConfirm([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, products.length, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent
        className="max-w-[94vw] sm:max-w-[520px] p-0 overflow-hidden border border-urbana-gold/30 bg-gradient-to-br from-urbana-black via-urbana-black-soft to-urbana-black max-h-[95dvh] flex flex-col rounded-2xl shadow-2xl shadow-urbana-gold/20 [&>button[type='button']:last-child]:hidden"
      >
        <div className="sr-only">
          <DialogTitle>Que tal levar um produto?</DialogTitle>
          <DialogDescription>Sugestões de produtos para complementar seu agendamento</DialogDescription>
        </div>

        {/* Botão fechar */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Fechar e continuar sem produtos"
          className="absolute top-2.5 right-2.5 z-30 h-9 w-9 rounded-full bg-urbana-black-soft/95 shadow-lg border border-urbana-gold/40 flex items-center justify-center active:scale-95 transition disabled:opacity-50"
        >
          <X className="h-5 w-5 text-urbana-gold" />
        </button>

        {/* Header */}
        <div className="relative bg-gradient-to-r from-urbana-black-soft via-urbana-black to-urbana-black-soft border-b border-urbana-gold/30 px-4 py-3 pr-14 shrink-0 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[radial-gradient(circle_at_top_right,_hsl(43_65%_60%),_transparent_60%)]" />
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="h-4 w-4 text-urbana-gold" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-urbana-gold">
              Sugestões para você
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold leading-tight text-urbana-light">
            Quer levar algum produto?
          </h2>
          <p className="text-[12px] sm:text-sm text-urbana-light/70 mt-0.5">
            Adicione e pague tudo junto no checkout.
          </p>
        </div>

        {/* Body — grid de cards no estilo Totem */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {loading ? (
            <div className="py-8 text-center text-sm text-urbana-light/50">
              Carregando sugestões...
            </div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center text-sm text-urbana-light/50">
              Nenhum produto disponível no momento.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => {
                const qty = quantities[p.id] || 0;
                const isSelected = qty > 0;
                const maxStock = Math.min(p.estoque, 9);
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'relative overflow-hidden rounded-2xl border-2 bg-white/10 backdrop-blur-xl transition-all shadow-lg',
                      isSelected
                        ? 'border-urbana-gold ring-2 ring-urbana-gold/40 shadow-urbana-gold/30'
                        : 'border-white/20 hover:border-urbana-gold/60'
                    )}
                  >
                    {/* Imagem */}
                    <div className="relative aspect-square bg-gradient-to-br from-urbana-black/60 to-urbana-brown/40 overflow-hidden">
                      {p.imagem_url ? (
                        <img
                          src={p.imagem_url}
                          alt={p.nome}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-urbana-gold/40" />
                        </div>
                      )}
                      <div className="absolute bottom-1.5 right-1.5 bg-urbana-black/90 backdrop-blur-sm text-urbana-light px-2 py-0.5 rounded-md text-[10px] font-bold border border-urbana-gold/50">
                        <Package className="w-2.5 h-2.5 inline-block mr-0.5" />
                        {p.estoque}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-2.5 space-y-1.5 bg-gradient-to-b from-white/5 to-transparent">
                      <p className="text-[13px] font-bold text-urbana-light line-clamp-2 leading-tight min-h-[2.2em]">
                        {p.nome}
                      </p>
                      <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light">
                        {formatBRL(p.preco)}
                      </p>
                      {/* Controle de quantidade / Adicionar */}
                      {isSelected ? (
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setQty(p.id, maxStock, -1)}
                            disabled={isSubmitting}
                            aria-label="Diminuir"
                            className="flex-1 h-9 rounded-lg bg-red-500/20 text-red-300 border-2 border-red-500/40 active:scale-95 transition flex items-center justify-center"
                          >
                            <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                          </button>
                          <div className="min-w-[36px] text-center">
                            <span className="text-lg font-black text-urbana-gold">{qty}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setQty(p.id, maxStock, 1)}
                            disabled={isSubmitting || qty >= maxStock}
                            aria-label="Aumentar"
                            className="flex-1 h-9 rounded-lg bg-urbana-gold/30 text-urbana-gold border-2 border-urbana-gold/50 active:scale-95 transition flex items-center justify-center disabled:opacity-50"
                          >
                            <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setQty(p.id, maxStock, 1)}
                          disabled={isSubmitting}
                          className="w-full h-9 rounded-lg bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold text-urbana-black font-bold text-xs active:scale-95 transition shadow flex items-center justify-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={3} /> Incluir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer fixo */}
        {!loading && products.length > 0 && (
          <div className="shrink-0 border-t border-urbana-gold/25 bg-urbana-black/95 backdrop-blur-sm p-3 sm:p-4 space-y-2">
            {totalItems > 0 && (
              <div className="flex items-center justify-between px-1">
                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-urbana-light">
                  <ShoppingBag className="h-4 w-4" />
                  {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                </span>
                <span className="text-base sm:text-lg font-bold text-urbana-gold">
                  {formatBRL(total)}
                </span>
              </div>
            )}

            <div className="flex flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="flex-1 h-11 text-xs sm:text-sm bg-urbana-gray/40 hover:bg-urbana-gray/60 text-urbana-light border border-urbana-light/20"
              >
                Não, obrigado
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="flex-[1.5] bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold hover:from-urbana-gold-dark hover:to-urbana-gold-dark text-urbana-black font-bold h-11 text-xs sm:text-sm shadow-lg shadow-urbana-gold/30 border border-urbana-gold-light"
              >
                {isSubmitting
                  ? 'Confirmando...'
                  : totalItems > 0
                    ? `Confirmar com ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`
                    : 'Confirmar agendamento'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductCrossSellDialog;