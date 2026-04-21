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
        className="max-w-[94vw] sm:max-w-[440px] p-0 overflow-hidden border-0 bg-gradient-to-br from-amber-50 via-white to-amber-50 max-h-[95dvh] flex flex-col rounded-2xl [&>button[type='button']:last-child]:hidden"
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
          className="absolute top-2.5 right-2.5 z-30 h-9 w-9 rounded-full bg-white/95 shadow-lg border border-amber-200 flex items-center justify-center active:scale-95 transition disabled:opacity-50"
        >
          <X className="h-5 w-5 text-amber-700" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-white pr-14 shrink-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">
              Sugestões para você
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold leading-tight">
            Quer levar algum produto?
          </h2>
          <p className="text-[11px] sm:text-xs text-white/90 mt-0.5">
            Adicione e pague tudo junto no checkout.
          </p>
        </div>

        {/* Body — lista vertical scrollável */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Carregando sugestões...
            </div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Nenhum produto disponível no momento.
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((p) => {
                const qty = quantities[p.id] || 0;
                const isSelected = qty > 0;
                const maxStock = Math.min(p.estoque, 9);
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-xl border-2 bg-white transition-all',
                      isSelected
                        ? 'border-amber-500 shadow-sm bg-amber-50/40'
                        : 'border-gray-200'
                    )}
                  >
                    {/* Imagem */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                      {p.imagem_url ? (
                        <img
                          src={p.imagem_url}
                          alt={p.nome}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="h-7 w-7 text-gray-300" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                        {p.nome}
                      </p>
                      <p className="text-base font-bold text-amber-600 mt-0.5">
                        {formatBRL(p.preco)}
                      </p>
                    </div>

                    {/* Controle de quantidade / Adicionar */}
                    {isSelected ? (
                      <div className="flex items-center gap-1 shrink-0 bg-amber-500 rounded-full p-1 shadow-sm">
                        <button
                          type="button"
                          onClick={() => setQty(p.id, maxStock, -1)}
                          disabled={isSubmitting}
                          aria-label="Diminuir"
                          className="h-7 w-7 rounded-full bg-white text-amber-700 flex items-center justify-center active:scale-90 transition shadow-sm"
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                        </button>
                        <span className="min-w-[20px] text-center text-sm font-bold text-white px-1">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(p.id, maxStock, 1)}
                          disabled={isSubmitting || qty >= maxStock}
                          aria-label="Aumentar"
                          className="h-7 w-7 rounded-full bg-white text-amber-700 flex items-center justify-center active:scale-90 transition shadow-sm disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setQty(p.id, maxStock, 1)}
                        disabled={isSubmitting}
                        className="shrink-0 h-9 px-3 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={3} /> Incluir
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer fixo */}
        {!loading && products.length > 0 && (
          <div className="shrink-0 border-t border-amber-200/60 bg-white/80 backdrop-blur-sm p-3 sm:p-4 space-y-2">
            {totalItems > 0 && (
              <div className="flex items-center justify-between px-1">
                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-amber-900">
                  <ShoppingBag className="h-4 w-4" />
                  {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                </span>
                <span className="text-base sm:text-lg font-bold text-amber-700">
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
                className="flex-1 border-gray-300 h-11 text-xs sm:text-sm"
              >
                Não, obrigado
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="flex-[1.5] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold h-11 text-xs sm:text-sm"
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