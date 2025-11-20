import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, User, Star, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import barbershopBg from '@/assets/barbershop-background.jpg';

interface Barber {
  id: string;
  staff_id: string;
  nome: string;
  email: string;
  especialidade?: string;
  image_url?: string;
  commission_rate?: number;
}

const TotemProductBarberSelect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, cart } = location.state || {};
  
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    if (!client || !cart || cart.length === 0) {
      toast.error('Dados incompletos');
      navigate('/totem/products', { state: { client } });
      return;
    }

    loadBarbers();

    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

  const loadBarbers = async () => {
    try {
      console.log('🔍 Carregando barbeiros ativos...');
      
      const { data: barbersData, error } = await supabase
        .from('painel_barbeiros')
        .select(`
          id,
          nome,
          email,
          telefone,
          image_url,
          specialties,
          commission_rate,
          staff_id,
          is_active
        `)
        .eq('is_active', true)
        .order('nome');

      if (error) {
        console.error('❌ Erro ao carregar barbeiros:', error);
        throw error;
      }

      console.log('✅ Barbeiros carregados:', barbersData);

      const mappedBarbers = (barbersData || []).map((b: any) => ({
        id: b.id,
        staff_id: b.staff_id,
        nome: b.nome,
        email: b.email,
        especialidade: b.specialties,
        image_url: b.image_url,
        commission_rate: b.commission_rate
      }));

      setBarbers(mappedBarbers);

      // Auto-selecionar se houver apenas um barbeiro
      if (mappedBarbers.length === 1) {
        setSelectedBarber(mappedBarbers[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar barbeiros:', error);
      toast.error('Erro ao carregar barbeiros');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedBarber) {
      toast.error('Selecione um barbeiro');
      return;
    }

    console.log('✅ Navegando para checkout com:', {
      client: { id: client.id, nome: client.nome },
      cart: cart.map(i => ({ produto: i.product.nome, qtd: i.quantity })),
      barber: {
        id: selectedBarber.id,
        staff_id: selectedBarber.staff_id,
        nome: selectedBarber.nome
      }
    });
    
    navigate('/totem/product-checkout', {
      state: { 
        client, 
        cart,
        barber: selectedBarber
      }
    });
  };

  const handleBack = () => {
    navigate('/totem/products', { state: { client } });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mx-auto" />
          <p className="text-white text-xl">Carregando barbeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 w-screen h-screen bg-cover bg-center overflow-auto"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), url(${barbershopBg})`
      }}
    >
      <div className="min-h-screen flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={handleBack}
            variant="ghost"
            className="text-white hover:bg-white/10 gap-2"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-lg">Voltar</span>
          </Button>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Selecione o Barbeiro
          </h1>
          <p className="text-white/80 text-xl">
            Escolha quem está te atendendo
          </p>
        </div>

        {/* Barbers Grid */}
        {barbers.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-12 text-center">
            <User className="w-16 h-16 text-white/50 mx-auto mb-4" />
            <p className="text-white text-xl">Nenhum barbeiro disponível no momento</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {barbers.map((barber) => (
              <Card
                key={barber.id}
                onClick={() => setSelectedBarber(barber)}
                className={`
                  cursor-pointer transition-all duration-300 p-6
                  ${selectedBarber?.id === barber.id
                    ? 'bg-urbana-gold border-urbana-gold shadow-2xl shadow-urbana-gold/50 scale-105'
                    : 'bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 hover:scale-102'
                  }
                `}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Avatar */}
                  <div className={`
                    w-24 h-24 rounded-full overflow-hidden border-4
                    ${selectedBarber?.id === barber.id 
                      ? 'border-urbana-black' 
                      : 'border-white/30'
                    }
                  `}>
                    {barber.image_url ? (
                      <img 
                        src={barber.image_url} 
                        alt={barber.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`
                        w-full h-full flex items-center justify-center
                        ${selectedBarber?.id === barber.id 
                          ? 'bg-urbana-black' 
                          : 'bg-white/20'
                        }
                      `}>
                        <User className={`
                          w-12 h-12
                          ${selectedBarber?.id === barber.id 
                            ? 'text-urbana-gold' 
                            : 'text-white'
                          }
                        `} />
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className={`
                    text-2xl font-bold
                    ${selectedBarber?.id === barber.id 
                      ? 'text-urbana-black' 
                      : 'text-white'
                    }
                  `}>
                    {barber.nome}
                  </h3>

                  {/* Specialty */}
                  {barber.especialidade && (
                    <div className="flex items-center gap-2">
                      <Award className={`
                        w-5 h-5
                        ${selectedBarber?.id === barber.id 
                          ? 'text-urbana-black' 
                          : 'text-urbana-gold'
                        }
                      `} />
                      <p className={`
                        text-sm
                        ${selectedBarber?.id === barber.id 
                          ? 'text-urbana-black/80' 
                          : 'text-white/80'
                        }
                      `}>
                        {barber.especialidade}
                      </p>
                    </div>
                  )}

                  {/* Selected Badge */}
                  {selectedBarber?.id === barber.id && (
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="w-5 h-5 text-urbana-black fill-urbana-black" />
                      <span className="text-urbana-black font-semibold">Selecionado</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Continue Button */}
        {barbers.length > 0 && (
          <div className="mt-auto pt-8">
            <Button
              onClick={handleContinue}
              disabled={!selectedBarber}
              className="w-full py-8 text-2xl font-bold bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black disabled:opacity-50"
            >
              Continuar para Checkout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TotemProductBarberSelect;
