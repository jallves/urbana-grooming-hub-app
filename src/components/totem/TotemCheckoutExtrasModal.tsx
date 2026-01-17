import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, Minus, Package, Plus, ShoppingBag, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface CheckoutExtraService {
  id: string;
  nome: string;
  preco: number;
  duracao?: number;
}

export interface CheckoutProductCartItem {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
}

interface Product {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  imagem_url?: string;
  categoria?: string;
}

export interface TotemCheckoutExtrasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mainServiceId?: string | null;
  initialExtraServices: CheckoutExtraService[];
  initialProducts: CheckoutProductCartItem[];
  onApply: (payload: {
    extraServices: CheckoutExtraService[];
    products: CheckoutProductCartItem[];
  }) => void;
}

const TotemCheckoutExtrasModal: React.FC<TotemCheckoutExtrasModalProps> = ({
  open,
  onOpenChange,
  mainServiceId,
  initialExtraServices,
  initialProducts,
  onApply,
}) => {
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");
  const [loading, setLoading] = useState(false);

  const [availableServices, setAvailableServices] = useState<CheckoutExtraService[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  const [selectedServices, setSelectedServices] = useState<CheckoutExtraService[]>(initialExtraServices);
  const [productCart, setProductCart] = useState<CheckoutProductCartItem[]>(initialProducts);

  // Reset state when opening
  useEffect(() => {
    if (!open) return;
    setSelectedServices(initialExtraServices);
    setProductCart(initialProducts);
  }, [open, initialExtraServices, initialProducts]);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data: servicesData, error: servicesError } = await supabase
          .from("painel_servicos")
          .select("id, nome, preco, duracao")
          .eq("ativo", true)
          .neq("id", mainServiceId || "")
          .order("preco", { ascending: true })
          .limit(12);

        if (servicesError) throw servicesError;
        setAvailableServices((servicesData || []) as any);

        const { data: productsData, error: productsError } = await supabase
          .from("painel_produtos")
          .select("id, nome, preco, estoque, imagem_url, categoria")
          .eq("ativo", true)
          .gt("estoque", 0)
          .order("nome", { ascending: true })
          .limit(16);

        if (productsError) throw productsError;
        setAvailableProducts((productsData || []) as any);
      } catch (e) {
        console.error("[TotemCheckoutExtrasModal] Erro ao carregar opções:", e);
        toast.error("Erro ao carregar opções");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, mainServiceId]);

  const isServiceSelected = useCallback(
    (serviceId: string) => selectedServices.some((s) => s.id === serviceId),
    [selectedServices]
  );

  const toggleService = useCallback((service: CheckoutExtraService) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      if (exists) return prev.filter((s) => s.id !== service.id);
      return [...prev, service];
    });
  }, []);

  const productQty = useCallback(
    (productId: string) => productCart.find((p) => p.id === productId)?.quantidade || 0,
    [productCart]
  );

  const addProduct = useCallback(
    (p: Product) => {
      setProductCart((prev) => {
        const existing = prev.find((x) => x.id === p.id);
        if (existing) {
          if (existing.quantidade >= p.estoque) {
            toast.error("Estoque insuficiente");
            return prev;
          }
          return prev.map((x) => (x.id === p.id ? { ...x, quantidade: x.quantidade + 1 } : x));
        }
        return [...prev, { id: p.id, nome: p.nome, preco: p.preco, quantidade: 1 }];
      });
    },
    []
  );

  const removeProduct = useCallback((productId: string) => {
    setProductCart((prev) => {
      const existing = prev.find((x) => x.id === productId);
      if (!existing) return prev;
      if (existing.quantidade <= 1) return prev.filter((x) => x.id !== productId);
      return prev.map((x) => (x.id === productId ? { ...x, quantidade: x.quantidade - 1 } : x));
    });
  }, []);

  const totals = useMemo(() => {
    const servicesTotal = selectedServices.reduce((sum, s) => sum + (Number(s.preco) || 0), 0);
    const productsTotal = productCart.reduce((sum, p) => sum + (Number(p.preco) || 0) * (p.quantidade || 0), 0);
    return { servicesTotal, productsTotal, extrasTotal: servicesTotal + productsTotal };
  }, [selectedServices, productCart]);

  const handleApply = () => {
    onApply({ extraServices: selectedServices, products: productCart });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none m-0 p-0 rounded-none bg-urbana-black/95 border-0 text-urbana-light [&>button]:hidden">
        <div className="h-full w-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-urbana-gold/20">
            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              className="text-urbana-light hover:text-urbana-gold"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
            <h2 className="text-xl font-bold">Adicionar itens</h2>
            <Button
              onClick={handleApply}
              className="bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black font-bold"
              disabled={loading}
            >
              Aplicar
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-4 py-3">
            <Button
              onClick={() => setActiveTab("services")}
              className={cn(
                "flex-1 h-12 text-base font-bold rounded-xl",
                activeTab === "services"
                  ? "bg-urbana-gold text-urbana-black"
                  : "bg-urbana-black/50 text-urbana-light border-2 border-urbana-gold/20"
              )}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Serviços
              {selectedServices.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-urbana-black/30 rounded-full text-sm">
                  {selectedServices.length}
                </span>
              )}
            </Button>
            <Button
              onClick={() => setActiveTab("products")}
              className={cn(
                "flex-1 h-12 text-base font-bold rounded-xl",
                activeTab === "products"
                  ? "bg-urbana-gold text-urbana-black"
                  : "bg-urbana-black/50 text-urbana-light border-2 border-urbana-gold/20"
              )}
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Produtos
              {productCart.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-urbana-black/30 rounded-full text-sm">
                  {productCart.reduce((sum, p) => sum + p.quantidade, 0)}
                </span>
              )}
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-24">
            {loading ? (
              <div className="py-10 text-center text-urbana-light/70">Carregando...</div>
            ) : activeTab === "services" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableServices.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-urbana-light/60">
                    Nenhum serviço extra disponível
                  </div>
                ) : (
                  availableServices.map((service) => {
                    const selected = isServiceSelected(service.id);
                    return (
                      <button
                        key={service.id}
                        onClick={() => toggleService(service)}
                        className={cn(
                          "relative p-4 rounded-xl border-2 transition-all duration-150 text-left active:scale-95",
                          selected
                            ? "bg-urbana-gold/20 border-urbana-gold shadow-lg shadow-urbana-gold/20"
                            : "bg-urbana-black/50 border-urbana-gold/20 active:border-urbana-gold/40"
                        )}
                      >
                        {selected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-urbana-gold flex items-center justify-center">
                            <Check className="w-4 h-4 text-urbana-black" strokeWidth={3} />
                          </div>
                        )}
                        <h4 className="text-base font-semibold text-urbana-light mb-2 pr-6">
                          {service.nome}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-urbana-gold">R$ {service.preco.toFixed(2)}</span>
                          {typeof service.duracao === "number" && (
                            <span className="text-xs text-urbana-light/60">{service.duracao} min</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableProducts.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-urbana-light/60">
                    Nenhum produto disponível
                  </div>
                ) : (
                  availableProducts.map((p) => {
                    const qty = productQty(p.id);
                    return (
                      <Card key={p.id} className="bg-urbana-black/50 border-2 border-urbana-gold/20 overflow-hidden">
                        <div className="aspect-square bg-gradient-to-br from-urbana-black/60 to-urbana-brown/40 relative">
                          {p.imagem_url ? (
                            <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-12 h-12 text-urbana-gold/40" />
                            </div>
                          )}
                          <div className="absolute bottom-2 right-2 bg-urbana-black/80 text-urbana-light px-2 py-1 rounded text-xs">
                            Estoque: {p.estoque}
                          </div>
                        </div>

                        <div className="p-3 space-y-2">
                          <h4 className="font-bold text-sm text-urbana-light line-clamp-2 min-h-[2.5rem]">{p.nome}</h4>
                          <p className="text-xl font-bold text-urbana-gold">R$ {p.preco.toFixed(2)}</p>

                          {qty > 0 ? (
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => removeProduct(p.id)}
                                size="sm"
                                className="flex-1 h-10 bg-red-500/20 text-red-300 border border-red-500/40"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="text-xl font-bold text-urbana-gold w-8 text-center">{qty}</span>
                              <Button
                                onClick={() => addProduct(p)}
                                size="sm"
                                className="flex-1 h-10 bg-urbana-gold/30 text-urbana-gold border border-urbana-gold/50"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => addProduct(p)}
                              size="sm"
                              className="w-full h-10 bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold text-urbana-black font-bold"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Adicionar
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-urbana-black/95 border-t border-urbana-gold/20">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="text-sm text-urbana-light/70">
                {selectedServices.length > 0 && (
                  <div>{selectedServices.length} serviço(s): R$ {totals.servicesTotal.toFixed(2)}</div>
                )}
                {productCart.length > 0 && (
                  <div>
                    {productCart.reduce((sum, p) => sum + p.quantidade, 0)} produto(s): R$ {totals.productsTotal.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-urbana-light/60">Total extras</div>
                <div className="text-2xl font-bold text-urbana-gold">+ R$ {totals.extrasTotal.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TotemCheckoutExtrasModal;
