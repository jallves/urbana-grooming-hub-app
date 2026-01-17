import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Plus, Minus, Package, Sparkles, ShoppingBag, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import barbershopBg from '@/assets/barbershop-background.jpg';
import { cn } from '@/lib/utils';

interface ExtraService {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface Product {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  imagem_url?: string;
  categoria?: string;
}

interface CartProduct {
  product: Product;
  quantity: number;
}

const TotemUpsell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment, client, session } = location.state || {};

  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedServices, setSelectedServices] = useState<ExtraService[]>([]);
  const [productCart, setProductCart] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');

    if (!appointment || !client || !session) {
      console.warn('TotemUpsell: dados incompletos, redirecionando');
      navigate('/totem/home');
      return;
    }

    loadData();

    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, [appointment, client, session]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Buscar serviços extras (excluindo o serviço principal)
      const { data: servicesData, error: servicesError } = await supabase
        .from('painel_servicos')
        .select('id, nome, preco, duracao')
        .eq('ativo', true)
        .neq('id', appointment.servico_id || appointment.servico?.id || '')
        .order('preco', { ascending: true })
        .limit(8);

      if (servicesError) throw servicesError;
      setExtraServices(servicesData || []);

      // Buscar produtos disponíveis
      const { data: productsData, error: productsError } = await supabase
        .from('painel_produtos')
        .select('id, nome, preco, estoque, imagem_url, categoria')
        .eq('ativo', true)
        .gt('estoque', 0)
        .order('nome', { ascending: true })
        .limit(12);

      if (productsError) throw productsError;
      setProducts(productsData || []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar opções');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = useCallback((service: ExtraService) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      }
      return [...prev, service];
    });
  }, []);

  const isServiceSelected = useCallback((serviceId: string) => {
    return selectedServices.some(s => s.id === serviceId);
  }, [selectedServices]);

  const addProductToCart = useCallback((product: Product) => {
    setProductCart(prev => {
      const existing = prev.find(p => p.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.estoque) {
          toast.error('Estoque insuficiente');
          return prev;
        }
        return prev.map(p =>
          p.product.id === product.id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeProductFromCart = useCallback((productId: string) => {
    setProductCart(prev => {
      const existing = prev.find(p => p.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(p =>
          p.product.id === productId
            ? { ...p, quantity: p.quantity - 1 }
            : p
        );
      }
      return prev.filter(p => p.product.id !== productId);
    });
  }, []);

  const getProductQuantity = useCallback((productId: string) => {
    const item = productCart.find(p => p.product.id === productId);
    return item?.quantity || 0;
  }, [productCart]);

  // Totais
  const servicesTotal = selectedServices.reduce((sum, s) => sum + s.preco, 0);
  const productsTotal = productCart.reduce((sum, p) => sum + (p.product.preco * p.quantity), 0);
  const extrasTotal = servicesTotal + productsTotal;

  const handleContinue = async () => {
    try {
      // Os serviços extras e produtos serão passados via state para o checkout
      // O checkout irá processar e criar os registros na venda
      console.log('📦 Continuando para checkout com:', {
        extraServices: selectedServices.length,
        products: productCart.reduce((sum, p) => sum + p.quantity, 0)
      });

      // Navegar para checkout com produtos no state
      navigate('/totem/checkout', {
        state: {
          appointment,
          client,
          session,
          extraServices: selectedServices,
          productCart: productCart.map(p => ({
            id: p.product.id,
            nome: p.product.nome,
            preco: p.product.preco,
            quantidade: p.quantity
          }))
        }
      });
    } catch (error) {
      console.error('Erro ao continuar:', error);
      toast.error('Erro ao processar. Tente novamente.');
    }
  };

  const handleSkip = () => {
    navigate('/totem/checkout', {
      state: {
        appointment,
        client,
        session,
        extraServices: [],
        productCart: []
      }
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mx-auto" />
          <p className="text-2xl text-urbana-light font-poppins">Carregando opções...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-4 font-poppins relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/90 via-urbana-black/85 to-urbana-brown/80" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 z-10">
        <Button
          onClick={handleSkip}
          variant="ghost"
          className="text-urbana-light hover:text-urbana-gold"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Pular
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-urbana-light">
          <Sparkles className="w-6 h-6 inline-block mr-2 text-urbana-gold" />
          Complete seu Visual
        </h1>
        <div className="w-24" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 z-10">
        <Button
          onClick={() => setActiveTab('services')}
          className={cn(
            'flex-1 h-14 text-lg font-bold rounded-xl transition-all',
            activeTab === 'services'
              ? 'bg-urbana-gold text-urbana-black'
              : 'bg-urbana-black/50 text-urbana-light border-2 border-urbana-gold/30'
          )}
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Serviços Extras
          {selectedServices.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-urbana-black/30 rounded-full text-sm">
              {selectedServices.length}
            </span>
          )}
        </Button>
        <Button
          onClick={() => setActiveTab('products')}
          className={cn(
            'flex-1 h-14 text-lg font-bold rounded-xl transition-all',
            activeTab === 'products'
              ? 'bg-urbana-gold text-urbana-black'
              : 'bg-urbana-black/50 text-urbana-light border-2 border-urbana-gold/30'
          )}
        >
          <ShoppingBag className="w-5 h-5 mr-2" />
          Produtos
          {productCart.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-urbana-black/30 rounded-full text-sm">
              {productCart.reduce((sum, p) => sum + p.quantity, 0)}
            </span>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto z-10">
        {activeTab === 'services' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {extraServices.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Sparkles className="w-16 h-16 text-urbana-gold/30 mx-auto mb-4" />
                <p className="text-xl text-urbana-light/60">Nenhum serviço extra disponível</p>
              </div>
            ) : (
              extraServices.map(service => {
                const selected = isServiceSelected(service.id);
                return (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service)}
                    className={cn(
                      'relative p-4 rounded-xl border-2 transition-all duration-200 text-left',
                      'active:scale-95',
                      selected
                        ? 'bg-urbana-gold/20 border-urbana-gold shadow-lg shadow-urbana-gold/20'
                        : 'bg-urbana-black/50 border-urbana-gold/20 active:border-urbana-gold/40'
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
                      <span className="text-xl font-bold text-urbana-gold">
                        R$ {service.preco.toFixed(2)}
                      </span>
                      <span className="text-xs text-urbana-light/60">
                        {service.duracao} min
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Package className="w-16 h-16 text-urbana-gold/30 mx-auto mb-4" />
                <p className="text-xl text-urbana-light/60">Nenhum produto disponível</p>
              </div>
            ) : (
              products.map(product => {
                const quantity = getProductQuantity(product.id);
                return (
                  <Card
                    key={product.id}
                    className="bg-urbana-black/50 border-2 border-urbana-gold/20 overflow-hidden"
                  >
                    {/* Product Image */}
                    <div className="aspect-square bg-gradient-to-br from-urbana-black/60 to-urbana-brown/40 relative">
                      {product.imagem_url ? (
                        <img
                          src={product.imagem_url}
                          alt={product.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-urbana-gold/40" />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-urbana-black/80 text-urbana-light px-2 py-1 rounded text-xs">
                        Estoque: {product.estoque}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-3 space-y-2">
                      <h4 className="font-bold text-sm text-urbana-light line-clamp-2 min-h-[2.5rem]">
                        {product.nome}
                      </h4>
                      <p className="text-xl font-bold text-urbana-gold">
                        R$ {product.preco.toFixed(2)}
                      </p>

                      {/* Add/Remove Controls */}
                      {quantity > 0 ? (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => removeProductFromCart(product.id)}
                            size="sm"
                            className="flex-1 h-10 bg-red-500/20 text-red-300 border border-red-500/40"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="text-xl font-bold text-urbana-gold w-8 text-center">
                            {quantity}
                          </span>
                          <Button
                            onClick={() => addProductToCart(product)}
                            size="sm"
                            className="flex-1 h-10 bg-urbana-gold/30 text-urbana-gold border border-urbana-gold/50"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => addProductToCart(product)}
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

      {/* Footer Summary */}
      <div className="z-10 pt-4 space-y-3">
        {/* Summary */}
        {extrasTotal > 0 && (
          <Card className="p-4 bg-urbana-gold/10 border-2 border-urbana-gold/40">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                {selectedServices.length > 0 && (
                  <p className="text-sm text-urbana-light/70">
                    {selectedServices.length} serviço(s) extra: R$ {servicesTotal.toFixed(2)}
                  </p>
                )}
                {productCart.length > 0 && (
                  <p className="text-sm text-urbana-light/70">
                    {productCart.reduce((sum, p) => sum + p.quantity, 0)} produto(s): R$ {productsTotal.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-urbana-light/60">Total extras</p>
                <p className="text-2xl font-bold text-urbana-gold">
                  + R$ {extrasTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 h-14 text-lg font-bold border-2 border-urbana-light/30 text-urbana-light"
          >
            Continuar sem extras
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black"
          >
            Continuar
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TotemUpsell;
