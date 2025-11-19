import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Scissors, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TotemCard, TotemCardTitle, TotemCardPrice, TotemCardDuration } from '@/components/totem/TotemCard';
import barbershopBg from '@/assets/barbershop-background.jpg';

interface Service {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

/**
 * TotemServico - Tela de seleção de serviços
 * Implementa o design system completo com glassmorphism
 */
const TotemServico: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client } = location.state || {};
  
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    if (!client) {
      navigate('/totem/search');
      return;
    }
    
    loadServices();
    
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, [client, navigate]);

  const loadServices = async () => {
    setLoading(true);
    try {
      // Buscar apenas serviços vinculados a barbeiros
      // @ts-ignore - Evitar inferência profunda de tipos do Supabase
      const response = await supabase
        .from('painel_servicos')
        .select(`
          id, 
          nome, 
          preco, 
          duracao,
          service_staff!inner(staff_id)
        `)
        .eq('is_active', true)
        .gt('preco', 0)
        .order('nome');

      if (response.error) throw response.error;

      // Remove duplicates (serviços com múltiplos barbeiros)
      const uniqueServices = (response.data || []).reduce((acc: Service[], curr: any) => {
        if (!acc.find(s => s.id === curr.id)) {
          acc.push({
            id: curr.id,
            nome: curr.nome,
            preco: curr.preco,
            duracao: curr.duracao
          });
        }
        return acc;
      }, []);

      setServices(uniqueServices);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast.error('Erro ao carregar serviços', {
        description: 'Tente novamente ou procure a recepção.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    
    // Navegar para seleção de barbeiro
    navigate('/totem/barbeiro', {
      state: {
        client,
        service
      }
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-urbana-black">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mx-auto" />
          <p className="text-xl sm:text-2xl text-urbana-light">Carregando serviços...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 font-poppins relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-4 sm:mb-6">
        <Button
          onClick={() => navigate('/totem/home')}
          variant="ghost"
          size="lg"
          className="h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-urbana-light text-center flex-1 drop-shadow-lg">
          Escolha o Serviço
        </h1>

        <div className="w-12 sm:w-16 md:w-24" />
      </div>

      {/* Subtitle */}
      <p className="relative z-10 text-center text-sm sm:text-base md:text-lg text-urbana-light/70 mb-4 sm:mb-6 drop-shadow-md">
        Selecione o serviço desejado
      </p>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <TotemCard
                key={service.id}
                icon={Scissors}
                variant={selectedService?.id === service.id ? 'selected' : 'default'}
                onClick={() => handleServiceSelect(service)}
              >
                <TotemCardTitle>{service.nome}</TotemCardTitle>
                <TotemCardPrice value={service.preco} />
                <TotemCardDuration minutes={service.duracao} />
              </TotemCard>
            ))}
          </div>

          {services.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-urbana-light/60">
                Nenhum serviço disponível no momento.
              </p>
              <p className="text-lg text-urbana-light/40 mt-2">
                Por favor, procure a recepção.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TotemServico;
