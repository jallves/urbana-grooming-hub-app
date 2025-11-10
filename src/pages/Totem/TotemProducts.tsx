import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ShoppingCart, Plus, Minus, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BarbershopProduct, CartItem } from '@/types/product';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemProducts: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client } = location.state || {};
  
  const [products, setProducts] = useState<BarbershopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    if (!client) {
      navigate('/totem/search');
      return;
    }

    loadProducts();

    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_produtos')
        .select('*')
        .eq('is_active', true)
        .gt('estoque', 0)
        .order('destaque', { ascending: false })
        .order('nome', { ascending: true });

      if (error) throw error;
      
      // Convert Json to string[] for imagens
      const productsData = (data || []).map(p => ({
        ...p,
        imagens: Array.isArray(p.imagens) ? p.imagens : []
      })) as BarbershopProduct[];
      
      setProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

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
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
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
        item.product.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
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

    navigate('/totem/product-checkout', {
      state: { client, cart }
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mx-auto" />
          <p className="text-2xl sm:text-3xl md:text-4xl text-urbana-light font-poppins">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 font-poppins overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Premium background effects */}
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
          className="h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg text-urbana-light active:text-urbana-gold active:bg-urbana-gold/20 transition-all duration-100 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light animate-shimmer" style={{ backgroundSize: '200% auto' }}>
          Produtos Premium
        </h1>
        
        <Button
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="relative h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black active:from-urbana-gold-dark active:to-urbana-gold disabled:opacity-50 shadow-lg"
        >
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {cartItemsCount}
            </span>
          )}
        </Button>
      </div>

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
                : 'bg-urbana-black-soft/80 text-urbana-light border-urbana-gold/30 active:bg-urbana-gold/20'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-4">
            {filteredProducts.map(product => {
              const cartItem = cart.find(item => item.product.id === product.id);
              const inCart = cartItem ? cartItem.quantity : 0;

              return (
                <Card
                  key={product.id}
                  className="group relative overflow-hidden bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border-2 border-white/20 hover:border-urbana-gold/60 transition-all duration-300 hover:shadow-2xl hover:shadow-urbana-gold/20 hover:-translate-y-1"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-urbana-black/60 to-urbana-brown/40 overflow-hidden">
                    {product.imagens && product.imagens.length > 0 ? (
                      <>
                        <img
                          src={product.imagens[0]}
                          alt={product.nome}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {/* Image Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-urbana-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-urbana-black/80 to-urbana-brown/60">
                        <Package className="w-20 h-20 text-urbana-gold/40 group-hover:text-urbana-gold/60 transition-colors" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
                      {product.destaque && (
                        <div className="bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold text-urbana-black px-3 py-1.5 rounded-full text-xs font-black shadow-lg animate-pulse">
                          ⭐ DESTAQUE
                        </div>
                      )}
                      {product.estoque <= product.estoque_minimo && (
                        <div className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ml-auto">
                          Estoque Baixo
                        </div>
                      )}
                    </div>

                    {/* Stock Badge */}
                    <div className="absolute bottom-3 right-3 bg-urbana-black/80 backdrop-blur-sm text-urbana-light px-3 py-1.5 rounded-full text-xs font-semibold border border-urbana-gold/30">
                      {product.estoque} unid.
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 sm:p-5 space-y-3 bg-gradient-to-b from-transparent to-white/5">
                    {/* Category Tag */}
                    <div className="inline-block">
                      <span className="text-xs font-semibold text-urbana-gold/70 uppercase tracking-wider">
                        {product.categoria}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg sm:text-xl text-urbana-light line-clamp-2 group-hover:text-urbana-gold transition-colors leading-tight">
                      {product.nome}
                    </h3>
                    
                    {product.descricao && (
                      <p className="text-sm text-urbana-light/70 line-clamp-2 leading-relaxed">
                        {product.descricao}
                      </p>
                    )}

                    {/* Price */}
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-urbana-light/50 font-medium">A partir de</span>
                      </div>
                      <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light">
                        R$ {product.preco.toFixed(2)}
                      </p>
                    </div>

                    {/* Add to Cart Controls */}
                    <div className="pt-2">
                      {inCart > 0 ? (
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={() => removeFromCart(product.id)}
                            size="lg"
                            className="flex-1 h-12 bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 border-2 border-red-500/40 hover:bg-red-500/30 hover:border-red-400 transition-all shadow-lg"
                          >
                            <Minus className="w-5 h-5" />
                          </Button>
                          <div className="flex flex-col items-center min-w-[60px]">
                            <span className="text-xs text-urbana-light/60 font-medium">Qtd.</span>
                            <span className="text-2xl font-black text-urbana-gold">{inCart}</span>
                          </div>
                          <Button
                            onClick={() => addToCart(product)}
                            size="lg"
                            className="flex-1 h-12 bg-gradient-to-r from-urbana-gold/30 to-urbana-gold-vibrant/30 text-urbana-gold border-2 border-urbana-gold/50 hover:bg-urbana-gold/40 hover:border-urbana-gold transition-all shadow-lg"
                          >
                            <Plus className="w-5 h-5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => addToCart(product)}
                          size="lg"
                          className="w-full h-12 bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-dark text-urbana-black font-bold text-base hover:from-urbana-gold hover:to-urbana-gold-vibrant shadow-xl hover:shadow-2xl hover:shadow-urbana-gold/30 transition-all duration-300 group-hover:scale-105"
                        >
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Adicionar ao Carrinho
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
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
              <p className="text-2xl sm:text-3xl font-black text-urbana-gold">
                R$ {cartTotal.toFixed(2)}
              </p>
            </div>
            <Button
              onClick={handleCheckout}
              size="lg"
              className="bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold text-urbana-black font-bold text-lg px-8"
            >
              Finalizar Compra
              <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TotemProducts;
