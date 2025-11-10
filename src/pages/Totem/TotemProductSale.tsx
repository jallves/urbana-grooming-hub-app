import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Minus, ShoppingCart, CreditCard, DollarSign, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import barbershopBg from '@/assets/barbershop-background.jpg';
import TotemProductPaymentPixModal from '@/components/totem/TotemProductPaymentPixModal';
import TotemProductPaymentCardModal from '@/components/totem/TotemProductPaymentCardModal';

interface Product {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  imagens: string[];
  categoria: string;
  descricao?: string;
  destaque?: boolean;
  estoque_minimo?: number;
}

interface CartItem {
  product_id: string;
  nome: string;
  preco: number;
  quantidade: number;
}

const TotemProductSale: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client } = location.state || {};

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [showPixModal, setShowPixModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'credit' | 'debit'>('credit');
  const [currentSaleId, setCurrentSaleId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    if (!client) {
      navigate('/totem/home');
      return;
    }
    
    loadProducts();
    
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, [client]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_produtos')
        .select('*')
        .eq('is_active', true)
        .gt('estoque', 0)
        .order('destaque', { ascending: false })
        .order('nome');

      if (error) throw error;
      
      // Convert Json to string[] for imagens
      const productsData = (data || []).map(p => ({
        ...p,
        imagens: Array.isArray(p.imagens) ? p.imagens : []
      })) as Product[];
      
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

  const handleAddToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      if (existingItem.quantidade >= product.estoque) {
        toast.error('Estoque insuficiente');
        return;
      }
      
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        nome: product.nome,
        preco: product.preco,
        quantidade: 1
      }]);
    }
    
    toast.success(`${product.nome} adicionado!`);
  };

  const handleRemoveFromCart = (productId: string) => {
    const item = cart.find(item => item.product_id === productId);
    
    if (item && item.quantidade > 1) {
      setCart(cart.map(item =>
        item.product_id === productId
          ? { ...item, quantidade: item.quantidade - 1 }
          : item
      ));
    } else {
      setCart(cart.filter(item => item.product_id !== productId));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
  };

  const handlePayment = async (method: 'pix' | 'credit' | 'debit') => {
    if (cart.length === 0) {
      toast.error('Adicione produtos ao carrinho');
      return;
    }

    setProcessing(true);
    
    try {
      console.log('🛒 Iniciando venda de produtos:', cart);
      
      // Criar venda direta (sem agendamento)
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          cliente_id: client.id,
          agendamento_id: null,
          totem_session_id: null,
          subtotal: calculateTotal(),
          desconto: 0,
          total: calculateTotal(),
          status: 'ABERTA'
        })
        .select()
        .single();

      if (vendaError) throw vendaError;

      console.log('✅ Venda criada:', venda.id);

      // Adicionar produtos à venda
      const vendaItens = cart.map(item => ({
        venda_id: venda.id,
        tipo: 'PRODUTO',
        ref_id: item.product_id,
        nome: item.nome,
        quantidade: item.quantidade,
        preco_unit: item.preco,
        total: item.preco * item.quantidade
      }));

      const { error: itensError } = await supabase
        .from('vendas_itens')
        .insert(vendaItens);

      if (itensError) throw itensError;

      console.log('✅ Itens adicionados à venda');

      setCurrentSaleId(venda.id);

      // Abrir modal de pagamento
      if (method === 'pix') {
        setShowPixModal(true);
      } else {
        setPaymentType(method);
        setShowCardModal(true);
      }

    } catch (error: any) {
      console.error('❌ Erro ao processar venda:', error);
      toast.error('Erro ao processar venda', {
        description: error.message
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!currentSaleId) return;

    try {
      // Atualizar status da venda
      const { error: updateError } = await supabase
        .from('vendas')
        .update({ status: 'PAGA' })
        .eq('id', currentSaleId);

      if (updateError) throw updateError;

      // Diminuir estoque
      for (const item of cart) {
        const { error: stockError } = await supabase
          .rpc('decrease_product_stock', {
            p_product_id: item.product_id,
            p_quantity: item.quantidade
          });

        if (stockError) throw stockError;
      }

      // Redirecionar para tela de sucesso
      navigate('/totem/product-payment-success', {
        state: {
          sale: { id: currentSaleId, total: calculateTotal() },
          client
        }
      });

    } catch (error) {
      console.error('Erro ao finalizar pagamento:', error);
      toast.error('Erro ao finalizar pagamento');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex items-center justify-center">
        <div className="w-20 h-20 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin" />
      </div>
    );
  }

  const total = calculateTotal();
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantidade, 0);

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 font-poppins overflow-hidden relative">
      
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
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
          Loja de Produtos
        </h1>
        
        <Button
          onClick={() => cart.length > 0 && document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' })}
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
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              selectedCategory === category
                ? 'bg-urbana-gold text-urbana-black border-urbana-gold'
                : 'bg-urbana-black-soft/80 text-urbana-light border-urbana-gold/30 active:bg-urbana-gold/20'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto z-10 space-y-6">
        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="p-8 text-center bg-transparent backdrop-blur-md border-2 border-urbana-gold/30">
            <Package className="w-16 h-16 text-urbana-gold mx-auto mb-4" />
            <p className="text-xl text-urbana-light">Nenhum produto disponível nesta categoria</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.map(product => {
              const cartItem = cart.find(item => item.product_id === product.id);
              const inCart = cartItem ? cartItem.quantidade : 0;

              return (
                <div
                  key={product.id}
                  className="group relative overflow-hidden bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:border-urbana-gold/80 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-urbana-gold/30 hover:-translate-y-1"
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
                        <div className="absolute inset-0 bg-gradient-to-t from-urbana-black/90 via-urbana-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-urbana-black/80 to-urbana-brown/60">
                        <Package className="w-16 h-16 sm:w-20 sm:h-20 text-urbana-gold/40 group-hover:text-urbana-gold/60 transition-colors" />
                      </div>
                    )}
                    
                    {/* Badge Destaque */}
                    {product.destaque && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold text-urbana-black px-2 py-1 rounded-lg text-[10px] font-black shadow-lg z-10">
                        ⭐ DESTAQUE
                      </div>
                    )}

                    {/* Stock Badge - DESTAQUE MAIOR */}
                    <div className="absolute bottom-2 right-2 bg-urbana-black/90 backdrop-blur-sm text-urbana-light px-3 py-1.5 rounded-lg text-sm font-bold border-2 border-urbana-gold/50 shadow-lg z-10">
                      <Package className="w-3 h-3 inline-block mr-1" />
                      {product.estoque}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-3 space-y-2 bg-gradient-to-b from-white/5 to-transparent">
                    {/* Nome do Produto - DESTAQUE MAIOR */}
                    <h3 className="font-bold text-base sm:text-lg text-urbana-light line-clamp-2 group-hover:text-urbana-gold transition-colors leading-tight min-h-[2.5rem]">
                      {product.nome}
                    </h3>

                    {/* Price - GRANDE E DESTACADO */}
                    <div className="py-1">
                      <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light">
                        R$ {product.preco.toFixed(2)}
                      </p>
                    </div>

                    {/* Add to Cart Button */}
                    <div className="pt-1">
                      {inCart > 0 ? (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleRemoveFromCart(product.id)}
                            size="sm"
                            className="flex-1 h-10 bg-red-500/20 text-red-300 border-2 border-red-500/40 hover:bg-red-500/30 hover:border-red-400"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <div className="flex flex-col items-center min-w-[45px]">
                            <span className="text-xs text-urbana-light/60">Qtd</span>
                            <span className="text-xl font-black text-urbana-gold">{inCart}</span>
                          </div>
                          <Button
                            onClick={() => handleAddToCart(product)}
                            size="sm"
                            className="flex-1 h-10 bg-urbana-gold/30 text-urbana-gold border-2 border-urbana-gold/50 hover:bg-urbana-gold/40"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleAddToCart(product)}
                          size="sm"
                          className="w-full h-10 bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold text-urbana-black font-bold text-sm hover:from-urbana-gold hover:to-urbana-gold-vibrant shadow-lg"
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Adicionar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Payment Section */}
        {cart.length > 0 && (
          <div id="payment-section" className="space-y-4 pb-4">
            {/* Cart Summary */}
            <Card className="p-4 sm:p-6 bg-transparent backdrop-blur-md border-2 border-urbana-gold/30">
              <h2 className="text-xl sm:text-2xl font-bold text-urbana-light mb-4 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-urbana-gold" />
                Resumo do Carrinho
              </h2>
              
              <div className="space-y-3 mb-4">
                {cart.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-md rounded-lg border border-urbana-gold/20">
                    <div className="flex-1">
                      <p className="font-bold text-urbana-light">{item.nome}</p>
                      <p className="text-sm text-urbana-light/60">
                        {item.quantidade}x R$ {item.preco.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-urbana-gold">
                      R$ {(item.preco * item.quantidade).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t-2 border-urbana-gold/30">
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-urbana-light">Total</p>
                  <p className="text-3xl font-black text-urbana-gold">
                    R$ {total.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Payment Methods */}
            <Card className="p-4 sm:p-6 bg-transparent backdrop-blur-md border-2 border-urbana-gold/30">
              <h3 className="text-xl sm:text-2xl font-bold text-urbana-light mb-4 text-center">
                Forma de Pagamento
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handlePayment('pix')}
                  disabled={processing}
                  className="group h-40 bg-gradient-to-br from-blue-500/20 to-blue-600/20 active:from-blue-500/30 active:to-blue-600/30 border-2 border-blue-500/50 active:border-blue-500 rounded-2xl transition-all duration-100 active:scale-98 disabled:opacity-50 overflow-hidden"
                >
                  <div className="flex flex-col items-center justify-center gap-3 h-full">
                    <DollarSign className="w-14 h-14 text-blue-400" />
                    <span className="text-3xl font-black text-blue-400">PIX</span>
                    <span className="text-sm text-urbana-gray-light">Instantâneo</span>
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handlePayment('credit')}
                    disabled={processing}
                    className="group h-40 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/20 active:from-urbana-gold/30 active:to-urbana-gold-dark/30 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-2xl transition-all duration-100 active:scale-98 disabled:opacity-50 overflow-hidden"
                  >
                    <div className="flex flex-col items-center justify-center gap-3 h-full">
                      <CreditCard className="w-14 h-14 text-urbana-gold" />
                      <span className="text-3xl font-black text-urbana-gold">CRÉDITO</span>
                      <span className="text-sm text-urbana-gray-light">Cartão</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handlePayment('debit')}
                    disabled={processing}
                    className="group h-40 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/20 active:from-urbana-gold/30 active:to-urbana-gold-dark/30 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-2xl transition-all duration-100 active:scale-98 disabled:opacity-50 overflow-hidden"
                  >
                    <div className="flex flex-col items-center justify-center gap-3 h-full">
                      <CreditCard className="w-14 h-14 text-urbana-gold" />
                      <span className="text-3xl font-black text-urbana-gold">DÉBITO</span>
                      <span className="text-sm text-urbana-gray-light">Cartão</span>
                    </div>
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <TotemProductPaymentPixModal
        isOpen={showPixModal}
        onClose={() => setShowPixModal(false)}
        onSuccess={handlePaymentSuccess}
        total={calculateTotal()}
      />

      <TotemProductPaymentCardModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        onSuccess={handlePaymentSuccess}
        total={calculateTotal()}
        paymentType={paymentType}
      />
    </div>
  );
};

export default TotemProductSale;
