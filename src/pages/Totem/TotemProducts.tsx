import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ShoppingCart, Plus, Minus, Package, Crown, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BarbershopProduct, CartItem } from '@/types/product';
import barbershopBg from '@/assets/barbershop-background.jpg';
import { resolveProductImageUrl } from '@/utils/productImages';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  description: string | null;
  billing_period: string;
  color: string | null;
  icon: string | null;
  credits_total: number;
}

const planColorMap: Record<string, { from: string; to: string; accent: string; bg: string; border: string; text: string; shadow: string }> = {
  amber: { from: 'from-amber-500', to: 'to-amber-700', accent: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-200', shadow: 'shadow-amber-500/30' },
  emerald: { from: 'from-emerald-500', to: 'to-emerald-700', accent: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-200', shadow: 'shadow-emerald-500/30' },
  violet: { from: 'from-violet-500', to: 'to-violet-700', accent: 'text-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-500/40', text: 'text-violet-200', shadow: 'shadow-violet-500/30' },
  blue: { from: 'from-blue-500', to: 'to-blue-700', accent: 'text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/40', text: 'text-blue-200', shadow: 'shadow-blue-500/30' },
  rose: { from: 'from-rose-500', to: 'to-rose-700', accent: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/40', text: 'text-rose-200', shadow: 'shadow-rose-500/30' },
};

const TotemProducts: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, cart: existingCart, barber } = location.state || {};
  
  const [products, setProducts] = useState<BarbershopProduct[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(existingCart || []);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [activeTab, setActiveTab] = useState<'produtos' | 'combos'>('produtos');

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_produtos')
        .select('*')
        .eq('ativo', true)
        .gt('estoque', 0)
        .order('nome', { ascending: true });
      if (error) throw error;
      setProducts((data || []) as BarbershopProduct[]);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      setPlans((data || []) as SubscriptionPlan[]);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    if (!client) {
      navigate('/totem/search');
      return;
    }
    loadProducts();
    loadPlans();

    const channel = supabase
      .channel('totem-products-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'painel_produtos' }, () => loadProducts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_plans' }, () => loadPlans())
      .subscribe();

    return () => {
      document.documentElement.classList.remove('totem-mode');
      supabase.removeChannel(channel);
    };
  }, []);

  const categories = ['todos', ...Array.from(new Set(products.map(p => p.categoria)))];

  const filteredProducts = selectedCategory === 'todos' 
    ? products 
    : products.filter(p => p.categoria === selectedCategory);

  const addToCart = (product: BarbershopProduct) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.estoque) {
        toast.error('Estoque insuficiente');
        return;
      }
      setCart(cart.map(item =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    toast.success(`${product.nome} adicionado ao carrinho`);
  };

  const removeFromCart = (productId: string) => {
    const item = cart.find(item => item.product.id === productId);
    if (item && item.quantity > 1) {
      setCart(cart.map(item =>
        item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      ));
    } else {
      setCart(cart.filter(item => item.product.id !== productId));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.preco * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }
    if (barber) {
      navigate('/totem/product-checkout', { state: { client, cart, barber } });
    } else {
      navigate('/totem/product-barber-select', { state: { client, cart } });
    }
  };

  const handleBuyPlan = (plan: SubscriptionPlan) => {
    // Redirecionar para seleção de barbeiro com o plano como "item"
    if (barber) {
      navigate('/totem/product-checkout', {
        state: { client, cart: [], barber, subscriptionPlan: plan }
      });
    } else {
      navigate('/totem/product-barber-select', {
        state: { client, cart: [], subscriptionPlan: plan }
      });
    }
  };

  const billingLabel: Record<string, string> = {
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    yearly: 'Anual',
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mx-auto" />
          <p className="text-2xl sm:text-3xl md:text-4xl text-urbana-light font-poppins">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 font-poppins overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl opacity-40" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 z-10">
        <Button
          onClick={() => navigate('/totem/home')}
          variant="ghost"
          size="lg"
          className="h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg text-urbana-light active:text-urbana-gold active:bg-urbana-gold/20"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light animate-shimmer" style={{ backgroundSize: '200% auto' }}>
          {activeTab === 'produtos' ? 'Loja de Produtos' : 'Combos & Assinaturas'}
        </h1>
        
        {activeTab === 'produtos' ? (
          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="relative h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black disabled:opacity-50 shadow-lg"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {cartItemsCount}
              </span>
            )}
          </Button>
        ) : (
          <div className="w-10 sm:w-14" />
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-3 z-10">
        <Button
          onClick={() => setActiveTab('produtos')}
          variant="outline"
          className={`flex-1 h-12 text-base font-bold rounded-xl transition-all ${
            activeTab === 'produtos'
              ? 'bg-urbana-gold text-urbana-black border-urbana-gold shadow-lg shadow-urbana-gold/30'
              : 'bg-urbana-black-soft/60 text-urbana-light border-urbana-gold/30'
          }`}
        >
          <Package className="w-5 h-5 mr-2" />
          Produtos
        </Button>
        <Button
          onClick={() => setActiveTab('combos')}
          variant="outline"
          className={`flex-1 h-12 text-base font-bold rounded-xl transition-all ${
            activeTab === 'combos'
              ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white border-purple-500 shadow-lg shadow-purple-500/30'
              : 'bg-urbana-black-soft/60 text-urbana-light border-purple-500/30'
          }`}
        >
          <Crown className="w-5 h-5 mr-2" />
          Combos
          {plans.length > 0 && (
            <span className="ml-2 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">
              {plans.length}
            </span>
          )}
        </Button>
      </div>

      {/* === TAB: PRODUTOS === */}
      {activeTab === 'produtos' && (
        <>
          {/* Categories */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 z-10">
            {categories.map(category => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant="outline"
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-urbana-gold text-urbana-black border-urbana-gold'
                    : 'bg-urbana-black-soft/80 text-urbana-light border-urbana-gold/30'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto z-10">
            {filteredProducts.length === 0 ? (
              <Card className="p-8 text-center bg-transparent backdrop-blur-md border-2 border-urbana-gold/30">
                <Package className="w-16 h-16 text-urbana-gold mx-auto mb-4" />
                <p className="text-xl text-urbana-light">Nenhum produto disponível nesta categoria</p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 pb-4">
                {filteredProducts.map(product => {
                  const cartItem = cart.find(item => item.product.id === product.id);
                  const inCart = cartItem ? cartItem.quantity : 0;
                  return (
                    <div key={product.id} className="group relative overflow-hidden bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:border-urbana-gold/80 rounded-2xl transition-all duration-300">
                      <div className="relative aspect-square bg-gradient-to-br from-urbana-black/60 to-urbana-brown/40 overflow-hidden">
                        {(() => {
                          const resolvedImageUrl = resolveProductImageUrl(product.imagem_url);
                          return resolvedImageUrl ? (
                            <img src={resolvedImageUrl} alt={product.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-urbana-black/80 to-urbana-brown/60">
                              <Package className="w-16 h-16 sm:w-20 sm:h-20 text-urbana-gold/40" />
                            </div>
                          );
                        })()}
                        <div className="absolute bottom-2 right-2 bg-urbana-black/90 backdrop-blur-sm text-urbana-light px-3 py-1.5 rounded-lg text-sm font-bold border-2 border-urbana-gold/50 shadow-lg z-10">
                          <Package className="w-3 h-3 inline-block mr-1" />{product.estoque}
                        </div>
                      </div>
                      <div className="p-3 space-y-2 bg-gradient-to-b from-white/5 to-transparent">
                        <h3 className="font-bold text-base sm:text-lg text-urbana-light line-clamp-2 min-h-[2.5rem]">{product.nome}</h3>
                        <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light">
                          R$ {product.preco.toFixed(2)}
                        </p>
                        <div className="pt-1">
                          {inCart > 0 ? (
                            <div className="flex items-center gap-2">
                              <Button onClick={(e) => { e.stopPropagation(); removeFromCart(product.id); }} size="sm" className="flex-1 h-10 bg-red-500/20 text-red-300 border-2 border-red-500/40">
                                <Minus className="w-4 h-4" />
                              </Button>
                              <div className="flex flex-col items-center min-w-[45px]">
                                <span className="text-xs text-urbana-light/60">Qtd</span>
                                <span className="text-xl font-black text-urbana-gold">{inCart}</span>
                              </div>
                              <Button onClick={(e) => { e.stopPropagation(); addToCart(product); }} size="sm" className="flex-1 h-10 bg-urbana-gold/30 text-urbana-gold border-2 border-urbana-gold/50">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button onClick={(e) => { e.stopPropagation(); addToCart(product); }} size="sm" className="w-full h-10 bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold text-urbana-black font-bold text-sm shadow-lg">
                              <ShoppingCart className="w-4 h-4 mr-1" />Adicionar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Summary Footer */}
          {cart.length > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-urbana-gold/10 via-urbana-gold/20 to-urbana-gold/10 border-2 border-urbana-gold/40 rounded-xl backdrop-blur-md z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-urbana-light/60">Total do Carrinho</p>
                  <p className="text-2xl sm:text-3xl font-black text-urbana-gold">R$ {cartTotal.toFixed(2)}</p>
                </div>
                <Button onClick={handleCheckout} size="lg" className="bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold text-urbana-black font-bold text-lg px-8">
                  Finalizar Compra
                  <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* === TAB: COMBOS === */}
      {activeTab === 'combos' && (
        <div className="flex-1 overflow-y-auto z-10">
          {plans.length === 0 ? (
            <Card className="p-8 text-center bg-transparent backdrop-blur-md border-2 border-purple-500/30">
              <Crown className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-xl text-urbana-light">Nenhum combo disponível no momento</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {plans.map(plan => {
                const c = planColorMap[plan.color || 'violet'] || planColorMap.violet;
                return (
                <div
                  key={plan.id}
                  className={`group relative overflow-hidden bg-gradient-to-br ${c.from}/20 ${c.to}/10 backdrop-blur-xl border-2 ${c.border} hover:border-opacity-100 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:${c.shadow}`}
                >
                  {/* Plan Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <div className={`flex items-center gap-1 px-3 py-1 ${c.bg} backdrop-blur-sm rounded-full border ${c.border}`}>
                      <Sparkles className={`w-3 h-3 ${c.accent}`} />
                      <span className={`text-xs font-bold ${c.text}`}>{billingLabel[plan.billing_period] || plan.billing_period}</span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Icon & Name */}
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${c.from} ${c.to} flex items-center justify-center shadow-lg ${c.shadow}`}>
                        <Crown className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">{plan.name}</h3>
                        <p className={`text-sm ${c.accent}/80`}>{plan.credits_total} serviços inclusos</p>
                      </div>
                    </div>

                    {/* Description */}
                    {plan.description && (
                      <p className={`text-sm ${c.text}/70 leading-relaxed`}>{plan.description}</p>
                    )}

                    {/* Benefits */}
                    <div className="space-y-2 py-2 border-t border-white/10">
                      <div className={`flex items-center gap-2 text-sm ${c.text}`}>
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <span className="text-green-400 text-xs">✓</span>
                        </div>
                        {plan.credits_total} créditos de serviço por mês
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${c.text}`}>
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <span className="text-green-400 text-xs">✓</span>
                        </div>
                        Pagamento sem fila no checkout
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${c.text}`}>
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <span className="text-green-400 text-xs">✓</span>
                        </div>
                        Atendimento prioritário
                      </div>
                    </div>

                    {/* Price */}
                    <div className={`text-center py-3 ${c.bg} rounded-xl border ${c.border}`}>
                      <p className={`text-sm ${c.accent}/60`}>Valor do combo</p>
                      <p className={`text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${c.from} ${c.to}`}>
                        R$ {plan.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Buy Button */}
                    <Button
                      onClick={() => handleBuyPlan(plan)}
                      size="lg"
                      className={`w-full h-14 text-lg font-bold bg-gradient-to-r ${c.from} ${c.to} hover:opacity-90 text-white shadow-xl ${c.shadow} rounded-xl`}
                    >
                      <Crown className="w-5 h-5 mr-2" />
                      Adquirir Combo
                    </Button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TotemProducts;
