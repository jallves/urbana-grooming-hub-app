import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, Minus, Package, Plus, ShoppingBag, Sparkles, Scissors } from "lucide-react";
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
      setLoading(true);
      try {
        // Ranking: serviços mais executados e produtos mais vendidos (últimos 90 dias)
        const since = new Date();
        since.setDate(since.getDate() - 90);
        const sinceStr = since.toISOString().slice(0, 10);

        const [servicesRes, productsRes, servicesRankRes, productsRankRes] = await Promise.all([
          supabase
            .from("painel_servicos")
            .select("id, nome, preco, duracao, imagens")
            .eq("ativo", true),
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
            .limit(5000),
          supabase
            .from("vendas_itens")
            .select("item_id, quantidade")
            .eq("tipo", "produto")
            .limit(2000),
        ]);
        if (servicesRes.error) throw servicesRes.error;
        if (productsRes.error) throw productsRes.error;

        // Ranking de serviços por execuções
        const svcRank = new Map<string, number>();
        (servicesRankRes.data || []).forEach((row: any) => {
          if (!row.servico_id) return;
          svcRank.set(row.servico_id, (svcRank.get(row.servico_id) || 0) + 1);
        });

        // Ranking de produtos por unidades vendidas
        const prodRank = new Map<string, number>();
        (productsRankRes.data || []).forEach((row: any) => {
          if (!row.item_id) return;
          prodRank.set(
            row.item_id,
            (prodRank.get(row.item_id) || 0) + (Number(row.quantidade) || 1)
          );
        });

        const orderedServices = ((servicesRes.data || []) as any[])
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

        const orderedProducts = ((productsRes.data || []) as Product[])
          .slice()
          .sort((a, b) => {
            const ra = prodRank.get(a.id) || 0;
            const rb = prodRank.get(b.id) || 0;
            if (rb !== ra) return rb - ra;
            return a.nome.localeCompare(b.nome, "pt-BR");
          })
          .slice(0, 20);

        setAvailableServices(orderedServices);
        setAvailableProducts(orderedProducts);
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
              <div className="py-10 text-center text-urbana-light/70">Carregando...</div>
            ) : activeTab === "services" ? (
              <div className="grid grid-cols-2 gap-2">
                {availableServices.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-urbana-light/60">Nenhum serviço extra disponível</div>
                ) : (
                  availableServices.map((service) => {
                    const qty = serviceQty(service.id);
                    return (
                      <Card
                        key={service.id}
                        className={cn(
                          "overflow-hidden border-2 bg-urbana-black/50 transition-all",
                          qty > 0
                            ? "border-urbana-gold ring-2 ring-urbana-gold/40 shadow-lg shadow-urbana-gold/20"
                            : "border-urbana-gold/20"
                        )}
                      >
                        <div className="aspect-square bg-gradient-to-br from-urbana-black/60 to-urbana-brown/40 relative">
                          {service.imagem ? (
                            <img src={service.imagem} alt={service.nome} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Scissors className="w-10 h-10 text-urbana-gold/40" />
                            </div>
                          )}
                          {typeof service.duracao === "number" && service.duracao > 0 && (
                            <div className="absolute bottom-1 right-1 bg-urbana-black/80 text-urbana-light px-1.5 py-0.5 rounded text-[10px]">
                              {service.duracao} min
                            </div>
                          )}
                          {qty > 0 && (
                            <div className="absolute top-1 right-1 px-1.5 h-5 min-w-5 rounded-full bg-urbana-gold flex items-center justify-center text-[10px] font-bold text-urbana-black">
                              {qty}x
                            </div>
                          )}
                        </div>
                        <div className="p-2 space-y-1.5">
                          <h4 className="font-bold text-xs text-urbana-light line-clamp-2 min-h-[2rem]">{service.nome}</h4>
                          <p className="text-lg font-bold text-urbana-gold">R$ {service.preco.toFixed(2)}</p>
                          {qty > 0 ? (
                            <div className="flex items-center gap-1">
                              <Button onClick={() => removeService(service.id)} size="sm" className="flex-1 h-8 bg-red-500/20 text-red-300 border border-red-500/40 text-xs">
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-base font-bold text-urbana-gold w-6 text-center">{qty}</span>
                              <Button onClick={() => addService(service)} size="sm" className="flex-1 h-8 bg-urbana-gold/30 text-urbana-gold border border-urbana-gold/50 text-xs">
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button onClick={() => addService(service)} size="sm" className="w-full h-8 bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold text-urbana-black font-bold text-xs">
                              <Plus className="w-3 h-3 mr-1" /> Adicionar
                            </Button>
                          )}
                        </div>
                      </Card>
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
