import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCrossSellProducts, CrossSellProduct } from '@/hooks/useCrossSellProducts';
import { Check, Plus, Sparkles, X, Package } from 'lucide-react';
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
        className="max-w-[95vw] sm:max-w-[560px] p-0 overflow-hidden border-0 bg-gradient-to-br from-amber-50 via-white to-amber-50 max-h-[92vh] overflow-y-auto [&>button[type='button']:last-child]:hidden"
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
          className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
              Oferta exclusiva
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            Que tal levar um produto?
          </h2>
          <p className="text-sm text-white/90 mt-1">
            Adicione ao seu agendamento e pague tudo no checkout. 
          </p>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {products.map((p) => {
                  const selected = selectedIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggle(p.id)}
                      disabled={isSubmitting}
                      className={cn(
                        'relative text-left rounded-xl border-2 bg-white overflow-hidden transition-all',
                        'hover:shadow-lg hover:-translate-y-0.5',
                        selected
                          ? 'border-amber-500 ring-2 ring-amber-200 shadow-md'
                          : 'border-gray-200'
                      )}
                    >
                      {/* Selected badge */}
                      {selected && (
                        <div className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow">
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </div>
                      )}

                      {/* Imagem */}
                      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                        {p.imagem_url ? (
                          <img
                            src={p.imagem_url}
                            alt={p.nome}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="h-10 w-10 text-gray-300" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-2.5">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
                          {p.nome}
                        </p>
                        <p className="text-base font-bold text-amber-600 mt-1">
                          {formatBRL(p.preco)}
                        </p>
                        <div
                          className={cn(
                            'mt-2 flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-semibold transition-colors',
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
                  );
                })}
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