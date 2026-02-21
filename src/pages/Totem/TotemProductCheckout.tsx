import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, DollarSign, Package, Loader2, User, Award, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CartItem } from '@/types/product';
import { resolveProductImageUrl } from '@/utils/productImages';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemProductCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, cart: initialCart, barber } = location.state || {};
  
  // Estado local do carrinho para permitir edição
  const [cart, setCart] = useState<CartItem[]>(initialCart || []);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    console.log('🛒 Checkout de Produto - State recebido:', { client, cart, barber });
    
    if (!client || !cart || cart.length === 0) {
      toast.error('Carrinho vazio ou cliente não identificado');
      navigate('/totem/home');
      return;
    }

    if (!barber) {
      console.warn('⚠️ Barbeiro não selecionado, redirecionando...');
      toast.error('Selecione um barbeiro');
      navigate('/totem/product-barber-select', { state: { client, cart } });
      return;
    }

    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, [client, barber, navigate]);

  // Cálculo do total em tempo real
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.preco * item.quantity), 0);
  }, [cart]);

  const cartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Funções para manipular o carrinho
  const increaseQuantity = (productId: string) => {
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.product.id === productId) {
          if (item.quantity >= item.product.estoque) {
            toast.error('Estoque insuficiente');
            return item;
          }
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      })
    );
  };

  const decreaseQuantity = (productId: string) => {
    setCart(prevCart => {
      const item = prevCart.find(i => i.product.id === productId);
      if (item && item.quantity > 1) {
        return prevCart.map(i =>
          i.product.id === productId
            ? { ...i, quantity: i.quantity - 1 }
            : i
        );
      } else {
        // Remove o item se quantidade for 1
        return prevCart.filter(i => i.product.id !== productId);
      }
    });
  };

  const removeItem = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
    toast.success('Item removido');
  };

  // Navegar para adicionar mais produtos
  const handleAddMoreProducts = () => {
    navigate('/totem/products', { 
      state: { client, cart, barber } 
    });
  };

  const handlePayment = async (paymentMethod: 'pix' | 'card') => {
    if (cart.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🛒 Criando venda de produtos usando tabela vendas (unificada)');
      console.log('🔍 Barbeiro selecionado:', { id: barber.id, staff_id: barber.staff_id, nome: barber.nome });
      
      // IMPORTANTE: vendas.barbeiro_id tem FK para painel_barbeiros.id
      // Usar barber.id (que é o id da painel_barbeiros), NÃO barber.staff_id
      const { data: saleData, error: saleError } = await supabase
        .from('vendas')
        .insert({
          cliente_id: client.id,
          barbeiro_id: barber.id, // ID da tabela painel_barbeiros (não staff_id)
          valor_total: cartTotal,
          desconto: 0,
          status: 'ABERTA'
        })
        .select()
        .single();

      if (saleError) {
        console.error('❌ Erro ao criar venda:', saleError);
        throw saleError;
      }
      
      // Criar objeto sale com campo total para compatibilidade
      const sale = { ...saleData, total: cartTotal };

      console.log('✅ Venda criada:', saleData.id);

      const saleItems = cart.map(item => ({
        venda_id: saleData.id,
        tipo: 'PRODUTO',
        item_id: item.product.id,
        nome: item.product.nome,
        quantidade: item.quantity,
        preco_unitario: item.product.preco,
        subtotal: item.product.preco * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('vendas_itens')
        .insert(saleItems);

      if (itemsError) {
        console.error('❌ Erro ao criar itens:', itemsError);
        throw itemsError;
      }

      console.log('✅ Itens criados. Navegando para pagamento:', paymentMethod);

      if (paymentMethod === 'pix') {
        navigate('/totem/product-payment-pix', {
          state: { sale, client, cart, barber }
        });
      } else {
        navigate('/totem/product-payment-card', {
          state: { sale, client, cart, barber }
        });
      }

    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Verificar se carrinho está vazio após remoções
  useEffect(() => {
    if (cart.length === 0 && initialCart && initialCart.length > 0) {
      toast.info('Carrinho esvaziado. Redirecionando...');
      setTimeout(() => {
        navigate('/totem/products', { state: { client } });
      }, 1500);
    }
  }, [cart.length, initialCart, client, navigate]);

  if (!initialCart) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-2 sm:p-3 md:p-4 font-poppins overflow-hidden">
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
      <div className="flex items-center justify-between mb-2 sm:mb-3 z-10">
        <Button
          onClick={() => navigate('/totem/products', { 
            state: { client, cart, barber } 
          })}
          variant="ghost"
          size="sm"
          className="h-9 sm:h-10 md:h-12 px-2 sm:px-3 md:px-4 text-xs sm:text-sm md:text-base text-urbana-light active:text-urbana-gold active:bg-urbana-gold/20 transition-all duration-100 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light">
          Checkout de Produtos
        </h1>
        
        <div className="w-10 sm:w-16 md:w-24"></div>
      </div>

      {/* Content - Grid layout */}
      <div className="flex-1 overflow-hidden z-10 grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">
        {/* Left Column - Barber Info */}
        {barber && (
          <Card className="p-2 sm:p-3 md:p-4 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30 flex-shrink-0 h-fit">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-urbana-light mb-2 flex items-center gap-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold" />
              Barbeiro
            </h2>
            
            <div className="flex items-center gap-3 p-2 sm:p-3 bg-urbana-gold/10 backdrop-blur-sm rounded-lg border border-urbana-gold/30">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-urbana-gold flex-shrink-0">
                {barber.image_url ? (
                  <img 
                    src={barber.image_url} 
                    alt={barber.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-urbana-gold/20">
                    <User className="w-5 h-5 text-urbana-gold" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-bold text-urbana-light truncate">{barber.nome}</p>
                {barber.especialidade && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Award className="w-3 h-3 text-urbana-gold flex-shrink-0" />
                    <p className="text-[10px] sm:text-xs text-urbana-light/70 truncate">{barber.especialidade}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Center Column - Order Summary (Nota Fiscal Style) */}
        <Card className="p-2 sm:p-3 md:p-4 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-urbana-light flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold" />
              Resumo do Pedido
            </h2>
            <span className="text-xs sm:text-sm text-urbana-light/60">
              {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'itens'}
            </span>
          </div>

          {/* Botão Adicionar Mais Produtos */}
          <Button
            onClick={handleAddMoreProducts}
            className="mb-3 h-10 sm:h-11 bg-urbana-gold/15 border-2 border-urbana-gold/40 text-urbana-gold hover:bg-urbana-gold/20 active:bg-urbana-gold/30"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Adicionar mais produtos
          </Button>

          {/* Receipt Style Header */}
          <div className="bg-urbana-black/40 rounded-t-xl border-2 border-b-0 border-urbana-gold/30 p-2 sm:p-3">
            <div className="text-center border-b border-dashed border-urbana-gold/30 pb-2 mb-2">
              <p className="text-urbana-gold font-bold text-xs sm:text-sm tracking-wider">COSTA URBANA BARBEARIA</p>
              <p className="text-urbana-light/50 text-[10px] sm:text-xs">CUPOM DE VENDA - PRODUTOS</p>
            </div>
            
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-1 text-[10px] sm:text-xs text-urbana-light/60 font-medium border-b border-urbana-gold/20 pb-2">
              <div className="col-span-5">PRODUTO</div>
              <div className="col-span-3 text-center">QTD</div>
              <div className="col-span-2 text-right">UNIT</div>
              <div className="col-span-2 text-right">TOTAL</div>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-urbana-black/30 border-2 border-t-0 border-b-0 border-urbana-gold/30 flex-1 overflow-y-auto max-h-[calc(100vh-400px)]">
            {cart.map((item) => (
              <div 
                key={item.product.id} 
                className="grid grid-cols-12 gap-1 p-2 sm:p-3 items-center border-b border-urbana-gold/10 last:border-b-0"
              >
                {/* Produto */}
                <div className="col-span-5 flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-urbana-gold/30 flex-shrink-0 bg-urbana-black/50">
                    {(() => {
                      const resolvedImageUrl = resolveProductImageUrl(item.product.imagem_url);
                      return resolvedImageUrl ? (
                        <img 
                          src={resolvedImageUrl} 
                          alt={item.product.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-4 h-4 text-urbana-gold/50" />
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-urbana-light text-xs sm:text-sm font-medium leading-tight truncate">
                      {item.product.nome}
                    </p>
                    <button 
                      onClick={() => removeItem(item.product.id)}
                      className="text-red-400/70 text-[10px] flex items-center gap-0.5 hover:text-red-400 mt-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remover
                    </button>
                  </div>
                </div>
                
                {/* Quantidade com controles */}
                <div className="col-span-3 flex items-center justify-center gap-1">
                  <button
                    onClick={() => decreaseQuantity(item.product.id)}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 flex items-center justify-center active:bg-red-500/30 transition-colors"
                  >
                    <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <span className="text-urbana-gold font-bold text-sm sm:text-base min-w-[24px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => increaseQuantity(item.product.id)}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-green-500/20 text-green-300 border border-green-500/40 flex items-center justify-center active:bg-green-500/30 transition-colors"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
                
                {/* Preço Unitário */}
                <div className="col-span-2 text-right text-urbana-light/80 text-[10px] sm:text-xs">
                  R$ {item.product.preco.toFixed(2)}
                </div>
                
                {/* Total do Item */}
                <div className="col-span-2 text-right text-urbana-gold font-bold text-xs sm:text-sm">
                  R$ {(item.product.preco * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Footer - Total */}
          <div className="bg-urbana-black/40 border-2 border-t-0 border-urbana-gold/30 rounded-b-xl p-2 sm:p-3">
            <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-urbana-gold/20 via-urbana-gold-vibrant/20 to-urbana-gold/20 rounded-xl border-2 border-urbana-gold shadow-xl shadow-urbana-gold/30">
              <p className="text-sm sm:text-base font-black text-urbana-light">TOTAL A PAGAR:</p>
              <p className="text-lg sm:text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
                R$ {cartTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        {/* Right Column - Payment Methods */}
        <Card className="p-2 sm:p-3 md:p-4 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30 h-fit">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-urbana-light mb-2 sm:mb-3 text-center">
            Forma de Pagamento
          </h3>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* PIX Button */}
            <button
              onClick={() => handlePayment('pix')}
              disabled={isProcessing || cart.length === 0}
              className="group relative h-24 sm:h-28 md:h-32 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/10 backdrop-blur-md active:from-urbana-gold/30 active:to-urbana-gold-dark/20 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-xl transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative h-full flex flex-col items-center justify-center gap-1 sm:gap-2 p-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-urbana-gold/20 backdrop-blur-sm flex items-center justify-center">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-urbana-gold" />
                </div>
                <span className="text-lg sm:text-xl md:text-2xl font-black text-urbana-gold">PIX</span>
                <span className="text-[9px] sm:text-[10px] md:text-xs text-urbana-gray-light">Instantâneo</span>
              </div>
            </button>

            {/* Card Button */}
            <button
              onClick={() => handlePayment('card')}
              disabled={isProcessing || cart.length === 0}
              className="group relative h-24 sm:h-28 md:h-32 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/10 backdrop-blur-md active:from-urbana-gold/30 active:to-urbana-gold-dark/20 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-xl transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative h-full flex flex-col items-center justify-center gap-1 sm:gap-2 p-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-urbana-gold/20 backdrop-blur-sm flex items-center justify-center">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-urbana-gold" />
                </div>
                <span className="text-lg sm:text-xl md:text-2xl font-black text-urbana-gold">CARTÃO</span>
                <span className="text-[9px] sm:text-[10px] md:text-xs text-urbana-gray-light">Débito/Crédito</span>
              </div>
            </button>
          </div>

          {isProcessing && (
            <div className="mt-3 flex items-center justify-center gap-2 text-urbana-gold">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Processando...</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TotemProductCheckout;
