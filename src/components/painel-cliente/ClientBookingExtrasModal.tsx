import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, Clock, Minus, Package, Plus, ShoppingBag, Sparkles, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { resolveProductImageUrl } from "@/utils/productImages";

export interface ClientExtraService {
  id: string;
  nome: string;
  preco: number;
  duracao?: number;
  quantidade?: number;
  imagem?: string | null;
}

export interface ClientProductCartItem {
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

interface ExtrasCatalog {
  services: ClientExtraService[];
  products: Product[];
}

let extrasCatalogCache: ExtrasCatalog | null = null;
let extrasCatalogPromise: Promise<ExtrasCatalog> | null = null;

const parseServiceImage = (raw: any): string | null => {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] || null;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;
    if (t.startsWith("[")) {
      try {
        const arr = JSON.parse(t);
        return Array.isArray(arr) ? arr[0] || null : t;
      } catch {
        return t;
      }
    }
    return t;
  }
  return null;
};

export async function preloadClientBookingExtras(): Promise<ExtrasCatalog> {
  if (extrasCatalogCache) return extrasCatalogCache;
  if (extrasCatalogPromise) return extrasCatalogPromise;

  extrasCatalogPromise = (async () => {
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const sinceStr = since.toISOString().slice(0, 10);

    const [servicesRes, productsRes, servicesRankRes, productsRankRes] = await Promise.all([
      supabase
        .from("painel_servicos")
        .select("id, nome, preco, duracao, imagens, ativo, is_active")
        .gt("preco", 0),
      supabase
        .from("painel_produtos")
        .select("id, nome, preco, estoque, imagem_url, categoria")
        .eq("ativo", true)
        .gt("estoque", 0),
      supabase
        .from("painel_agendamentos")
        .select("servico_id")
        .eq("status", "concluido")
        .gte("data", sinceStr)
        .limit(3000),
      supabase
        .from("vendas_itens")
        .select("item_id, quantidade")
        .eq("tipo", "produto")
        .limit(1500),
    ]);

    if (servicesRes.error) throw servicesRes.error;
    if (productsRes.error) throw productsRes.error;

    const svcRank = new Map<string, number>();
    (servicesRankRes.data || []).forEach((row: any) => {
      if (!row.servico_id) return;
      svcRank.set(row.servico_id, (svcRank.get(row.servico_id) || 0) + 1);
    });

    const prodRank = new Map<string, number>();
    (productsRankRes.data || []).forEach((row: any) => {
      if (!row.item_id) return;
      prodRank.set(row.item_id, (prodRank.get(row.item_id) || 0) + (Number(row.quantidade) || 1));
    });

    const services = ((servicesRes.data || []) as any[])
      .filter((s) => s.ativo !== false && s.is_active !== false)
      .map((s) => ({
        id: s.id,
        nome: s.nome,
        preco: Number(s.preco) || 0,
        duracao: Number(s.duracao) || 0,
        imagem: parseServiceImage(s.imagens),
      }) as ClientExtraService)
      .sort((a, b) => {
        const ra = svcRank.get(a.id) || 0;
        const rb = svcRank.get(b.id) || 0;
        if (rb !== ra) return rb - ra;
        return a.nome.localeCompare(b.nome, "pt-BR");
      });

    const products = ((productsRes.data || []) as Product[])
      .slice()
      .sort((a, b) => {
        const ra = prodRank.get(a.id) || 0;
        const rb = prodRank.get(b.id) || 0;
        if (rb !== ra) return rb - ra;
        return a.nome.localeCompare(b.nome, "pt-BR");
      })
      .slice(0, 20);

    extrasCatalogCache = { services, products };
    return extrasCatalogCache;
  })();

  try {
    return await extrasCatalogPromise;
  } finally {
    extrasCatalogPromise = null;
  }
}

interface ClientBookingExtrasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mainServiceId: string;
  initialExtraServices: ClientExtraService[];
  initialProducts: ClientProductCartItem[];
  onApply: (payload: {
    extraServices: ClientExtraService[];
    products: ClientProductCartItem[];
  }) => void;
}

const ClientBookingExtrasModal: React.FC<ClientBookingExtrasModalProps> = ({
  open,
  onOpenChange,
  mainServiceId,
  initialExtraServices,
  initialProducts,
  onApply,
}) => {
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");
  const [loading, setLoading] = useState(false);
  const [availableServices, setAvailableServices] = useState<ClientExtraService[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedServices, setSelectedServices] = useState<ClientExtraService[]>(
    initialExtraServices.map(s => ({ ...s, quantidade: s.quantidade || 1 }))
  );
  const [productCart, setProductCart] = useState<ClientProductCartItem[]>(initialProducts);

  useEffect(() => {
    if (!open) return;
    setSelectedServices(initialExtraServices.map(s => ({ ...s, quantidade: s.quantidade || 1 })));
    setProductCart(initialProducts);
  }, [open, initialExtraServices, initialProducts]);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      if (extrasCatalogCache) {
        setAvailableServices(extrasCatalogCache.services.filter((s) => s.id !== mainServiceId));
        setAvailableProducts(extrasCatalogCache.products);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const catalog = await preloadClientBookingExtras();
        setAvailableServices(catalog.services.filter((s) => s.id !== mainServiceId));
        setAvailableProducts(catalog.products);
      } catch (e) {
        console.error("[ClientBookingExtrasModal] Erro:", e);
        toast.error("Erro ao carregar opções");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, mainServiceId]);

  const serviceQty = useCallback(
    (id: string) => selectedServices.find((s) => s.id === id)?.quantidade || 0,
    [selectedServices]
  );

  const addService = useCallback((service: ClientExtraService) => {
    setSelectedServices((prev) => {
      const existing = prev.find((s) => s.id === service.id);
      if (existing) {
        return prev.map((s) =>
          s.id === service.id ? { ...s, quantidade: (s.quantidade || 1) + 1 } : s
        );
      }
      return [...prev, { ...service, quantidade: 1 }];
    });
  }, []);

  const removeService = useCallback((id: string) => {
    setSelectedServices((prev) => {
      const existing = prev.find((s) => s.id === id);
      if (!existing) return prev;
      const q = existing.quantidade || 1;
      if (q <= 1) return prev.filter((s) => s.id !== id);
      return prev.map((s) => (s.id === id ? { ...s, quantidade: q - 1 } : s));
    });
  }, []);

  const productQty = useCallback(
    (id: string) => productCart.find((p) => p.id === id)?.quantidade || 0,
    [productCart]
  );

  const addProduct = useCallback((p: Product) => {
    setProductCart((prev) => {
      const existing = prev.find((x) => x.id === p.id);
      if (existing) {
        if (existing.quantidade >= p.estoque) {
          toast.error("Estoque insuficiente");
          return prev;
        }
        return prev.map((x) => x.id === p.id ? { ...x, quantidade: x.quantidade + 1 } : x);
      }
      return [...prev, { id: p.id, nome: p.nome, preco: p.preco, quantidade: 1 }];
    });
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProductCart((prev) => {
      const existing = prev.find((x) => x.id === id);
      if (!existing) return prev;
      if (existing.quantidade <= 1) return prev.filter((x) => x.id !== id);
      return prev.map((x) => x.id === id ? { ...x, quantidade: x.quantidade - 1 } : x);
    });
  }, []);

  const totals = useMemo(() => {
    const servicesTotal = selectedServices.reduce(
      (s, x) => s + (Number(x.preco) || 0) * (x.quantidade || 1),
      0
    );
    const productsTotal = productCart.reduce((s, x) => s + (Number(x.preco) || 0) * x.quantidade, 0);
    return { servicesTotal, productsTotal, extrasTotal: servicesTotal + productsTotal };
  }, [selectedServices, productCart]);

  const handleApply = () => {
    onApply({ extraServices: selectedServices, products: productCart });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg max-h-[90vh] m-0 p-0 rounded-2xl bg-urbana-black/95 border border-urbana-gold/30 text-urbana-light overflow-hidden [&>button]:hidden">
        <div className="flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-urbana-gold/20">
            <Button onClick={() => onOpenChange(false)} variant="ghost" size="sm" className="text-urbana-light hover:text-urbana-gold">
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
            <h2 className="text-base font-bold">Adicionar Extras</h2>
            <Button onClick={handleApply} size="sm" className="bg-urbana-gold text-urbana-black font-bold text-xs" disabled={loading}>
              Aplicar
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-4 py-2">
            <Button
              onClick={() => setActiveTab("services")}
              size="sm"
              className={cn(
                "flex-1 h-10 text-sm font-bold rounded-xl",
                activeTab === "services"
                  ? "bg-urbana-gold text-urbana-black"
                  : "bg-urbana-black/50 text-urbana-light border border-urbana-gold/20"
              )}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Serviços
              {selectedServices.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-urbana-black/30 rounded-full text-xs">
                  {selectedServices.reduce((s, x) => s + (x.quantidade || 1), 0)}
                </span>
              )}
            </Button>
            <Button
              onClick={() => setActiveTab("products")}
              size="sm"
              className={cn(
                "flex-1 h-10 text-sm font-bold rounded-xl",
                activeTab === "products"
                  ? "bg-urbana-gold text-urbana-black"
                  : "bg-urbana-black/50 text-urbana-light border border-urbana-gold/20"
              )}
            >
              <ShoppingBag className="w-4 h-4 mr-1" />
              Produtos
              {productCart.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-urbana-black/30 rounded-full text-xs">
                  {productCart.reduce((s, p) => s + p.quantidade, 0)}
                </span>
              )}
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-20">
            {loading ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`extras-skeleton-${i}`}
                    className="aspect-[3/4] rounded-2xl border border-urbana-gold/15 bg-white/5 animate-pulse overflow-hidden"
                  >
                    <div className="h-3/5 bg-white/10" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 rounded bg-white/10" />
                      <div className="h-3 w-2/3 rounded bg-white/10" />
                      <div className="h-4 w-1/2 rounded bg-urbana-gold/20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeTab === "services" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableServices.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-urbana-light/60">Nenhum serviço extra disponível</div>
                ) : (
                  availableServices.map((service, index) => {
                    const qty = serviceQty(service.id);
                    const selected = qty > 0;
                    return (
                      <div
                        key={service.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => addService(service)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            addService(service);
                          }
                        }}
                        aria-label={`Adicionar ${service.nome}`}
                        className={cn(
                          "group relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 bg-urbana-black-soft shadow-[0_8px_32px_rgba(0,0,0,0.4)] touch-manipulation active:scale-[0.98] transition-all text-left",
                          selected
                            ? "border-urbana-gold ring-2 ring-urbana-gold/40 shadow-urbana-gold/25"
                            : "border-urbana-gold/35 hover:border-urbana-gold"
                        )}
                      >
                        {service.imagem ? (
                          <img
                            src={service.imagem}
                            alt={service.nome}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading={index < 4 ? "eager" : "lazy"}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-urbana-black-soft to-urbana-black">
                            <Scissors className="w-14 h-14 text-urbana-gold/60" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/5" />

                        <div className="absolute top-2 left-2 h-7 w-7 rounded-full bg-urbana-black/75 border border-urbana-gold/50 text-urbana-gold flex items-center justify-center shadow-lg">
                          {selected ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" strokeWidth={3} />}
                        </div>

                        {selected && (
                          <div className="absolute top-2 right-2 min-w-7 h-7 px-2 rounded-full bg-urbana-gold text-urbana-black flex items-center justify-center text-xs font-black shadow-lg">
                            {qty}x
                          </div>
                        )}

                        {selected && (
                          <div className="absolute left-2 right-2 top-11 flex items-center justify-end gap-1.5">
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeService(service.id);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeService(service.id);
                                }
                              }}
                              aria-label="Diminuir"
                              className="h-8 w-8 rounded-lg bg-red-500/25 text-red-200 border border-red-400/40 flex items-center justify-center active:scale-95"
                            >
                              <Minus className="w-3.5 h-3.5" strokeWidth={3} />
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                addService(service);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addService(service);
                                }
                              }}
                              aria-label="Aumentar"
                              className="h-8 w-8 rounded-lg bg-urbana-gold/35 text-urbana-gold border border-urbana-gold/60 flex items-center justify-center active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3">
                          <h4 className="text-urbana-light font-bold text-sm sm:text-base leading-tight line-clamp-2 drop-shadow min-h-[2.25rem]">
                            {service.nome}
                          </h4>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-urbana-gold font-black text-base sm:text-lg">
                              R$ {service.preco.toFixed(2)}
                            </span>
                            {typeof service.duracao === "number" && service.duracao > 0 && (
                              <span className="text-urbana-light/85 text-[10px] sm:text-xs flex items-center gap-1 whitespace-nowrap">
                                <Clock className="w-3 h-3" />
                                {service.duracao}min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableProducts.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-urbana-light/60">Nenhum produto disponível</div>
                ) : (
                  availableProducts.map((p) => {
                    const qty = productQty(p.id);
                    return (
                      <Card key={p.id} className="bg-urbana-black/50 border border-urbana-gold/20 overflow-hidden">
                        <div className="aspect-square bg-gradient-to-br from-urbana-black/60 to-urbana-brown/40 relative">
                          {resolveProductImageUrl(p.imagem_url) ? (
                            <img src={resolveProductImageUrl(p.imagem_url)!} alt={p.nome} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-10 h-10 text-urbana-gold/40" />
                            </div>
                          )}
                          <div className="absolute bottom-1 right-1 bg-urbana-black/80 text-urbana-light px-1.5 py-0.5 rounded text-[10px]">
                            Estoque: {p.estoque}
                          </div>
                        </div>
                        <div className="p-2 space-y-1.5">
                          <h4 className="font-bold text-xs text-urbana-light line-clamp-2 min-h-[2rem]">{p.nome}</h4>
                          <p className="text-lg font-bold text-urbana-gold">R$ {p.preco.toFixed(2)}</p>
                          {qty > 0 ? (
                            <div className="flex items-center gap-1">
                              <Button onClick={() => removeProduct(p.id)} size="sm" className="flex-1 h-8 bg-red-500/20 text-red-300 border border-red-500/40 text-xs">
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-base font-bold text-urbana-gold w-6 text-center">{qty}</span>
                              <Button onClick={() => addProduct(p)} size="sm" className="flex-1 h-8 bg-urbana-gold/30 text-urbana-gold border border-urbana-gold/50 text-xs">
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button onClick={() => addProduct(p)} size="sm" className="w-full h-8 bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold text-urbana-black font-bold text-xs">
                              <Plus className="w-3 h-3 mr-1" /> Adicionar
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
          {(selectedServices.length > 0 || productCart.length > 0) && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-urbana-black/95 border-t border-urbana-gold/20">
              <div className="flex items-center justify-between">
                <div className="text-xs text-urbana-light/70 space-y-0.5">
                  {selectedServices.length > 0 && <div>{selectedServices.length} serviço(s): R$ {totals.servicesTotal.toFixed(2)}</div>}
                  {productCart.length > 0 && <div>{productCart.reduce((s, p) => s + p.quantidade, 0)} produto(s): R$ {totals.productsTotal.toFixed(2)}</div>}
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-urbana-light/60">Total extras</div>
                  <div className="text-xl font-bold text-urbana-gold">+ R$ {totals.extrasTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientBookingExtrasModal;
