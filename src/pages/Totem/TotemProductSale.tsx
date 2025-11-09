import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, ShoppingCart, CreditCard, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import barbershopBg from '@/assets/barbershop-background.jpg';

interface Product {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
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
        .order('nome');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.product_id === productId);
    
    if (existingItem) {
      if (existingItem.quantidade >= product.estoque) {
        toast.error('Estoque insuficiente');
        return;
      }
      
      setCart(cart.map(item =>
        item.product_id === productId
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
    
    toast.success('Produto adicionado!');
  };

  const handleRemoveFromCart = (index: number) => {
    const item = cart[index];
    
    if (item.quantidade > 1) {
      setCart(cart.map((cartItem, i) =>
        i === index
          ? { ...cartItem, quantidade: cartItem.quantidade - 1 }
          : cartItem
      ));
    } else {
      setCart(cart.filter((_, i) => i !== index));
      toast.info('Produto removido do carrinho');
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
  };

  const handlePayment = async (method: 'pix' | 'card') => {
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
          agendamento_id: null, // Venda direta de produtos
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

      // Criar pagamento
      const { data: payment, error: paymentError } = await supabase
        .from('totem_payments')
        .insert({
          session_id: null, // Venda direta
          payment_method: method,
          amount: calculateTotal(),
          status: 'pending'
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      console.log('✅ Pagamento criado:', payment.id);

      // Navegar para tela de pagamento
      if (method === 'pix') {
        navigate('/totem/payment/pix', {
          state: {
            payment,
            venda,
            client,
            total: calculateTotal(),
            isDirect: true // Flag para indicar venda direta
          }
        });
      } else {
        navigate('/totem/payment/card', {
          state: {
            payment,
            venda,
            client,
            total: calculateTotal(),
            isDirect: true
          }
        });
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

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex items-center justify-center">
        <div className="w-20 h-20 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin" />
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-6 font-poppins overflow-hidden relative">
      
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 z-10">
        <Button
          onClick={() => navigate('/totem/home')}
          variant="ghost"
          size="lg"
          className="h-16 px-8 text-lg text-urbana-light"
        >
          <ArrowLeft className="w-7 h-7 mr-3" />
          Voltar
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold mb-1">
            Comprar Produtos
          </h1>
          <p className="text-lg text-urbana-gray-light">
            Olá, {client?.nome?.split(' ')[0]}! Selecione os produtos desejados
          </p>
        </div>
        <div className="w-48"></div>
      </div>

      {/* Content */}
      <div className="flex-1 z-10 grid grid-cols-2 gap-6 overflow-hidden">
        
        {/* Left - Products */}
        <Card className="p-6 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-6 h-6 text-urbana-gold" />
            <h2 className="text-2xl font-bold text-urbana-light">Produtos Disponíveis</h2>
          </div>
          
          <Select onValueChange={handleAddToCart}>
            <SelectTrigger className="w-full h-14 text-lg text-urbana-light bg-urbana-black-soft/30 border-2 border-urbana-gold/40">
              <SelectValue placeholder="Selecione um produto" />
            </SelectTrigger>
            <SelectContent className="bg-urbana-black-soft backdrop-blur-xl border-urbana-gold/30">
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id} className="text-lg text-urbana-light hover:bg-urbana-gold/10">
                  {product.nome} - <span className="text-urbana-gold font-bold">R$ {product.preco.toFixed(2)}</span>
                  <span className="text-xs text-urbana-light/60 ml-2">(Est: {product.estoque})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Cart Items */}
          {cart.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-semibold text-urbana-light">Carrinho:</h3>
              {cart.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-urbana-black/40 rounded-lg border border-urbana-gold-vibrant/20">
                  <div className="flex-1">
                    <p className="text-base font-semibold text-urbana-light">{item.nome}</p>
                    <p className="text-sm text-urbana-gray-light">Quantidade: {item.quantidade}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-urbana-gold font-bold whitespace-nowrap">
                      R$ {(item.preco * item.quantidade).toFixed(2)}
                    </span>
                    <Button
                      onClick={() => handleRemoveFromCart(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right - Payment */}
        <div className="flex flex-col gap-6">
          {/* Total */}
          <Card className="p-6 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30">
            <h2 className="text-2xl font-bold text-urbana-light mb-4">Resumo</h2>
            <div className="p-6 bg-gradient-to-r from-urbana-gold/10 to-urbana-gold-dark/10 rounded-xl border-2 border-urbana-gold">
              <p className="text-lg text-urbana-light mb-2">Total:</p>
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
                R$ {total.toFixed(2)}
              </p>
            </div>
          </Card>

          {/* Payment Methods */}
          <Card className="flex-1 p-6 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30">
            <h3 className="text-2xl font-bold text-urbana-light mb-4">Forma de Pagamento</h3>
            
            <div className="grid grid-cols-1 gap-4 h-[calc(100%-4rem)]">
              <button
                onClick={() => handlePayment('pix')}
                disabled={processing || cart.length === 0}
                className="group h-full min-h-[120px] bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/10 border-2 border-urbana-gold/50 rounded-2xl transition-all duration-100 active:scale-98 disabled:opacity-50"
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <DollarSign className="w-16 h-16 text-urbana-gold" />
                  <span className="text-3xl font-black text-urbana-gold">PIX</span>
                </div>
              </button>

              <button
                onClick={() => handlePayment('card')}
                disabled={processing || cart.length === 0}
                className="group h-full min-h-[120px] bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/10 border-2 border-urbana-gold/50 rounded-2xl transition-all duration-100 active:scale-98 disabled:opacity-50"
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <CreditCard className="w-16 h-16 text-urbana-gold" />
                  <span className="text-3xl font-black text-urbana-gold">CARTÃO</span>
                </div>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TotemProductSale;
