import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TotemCard, TotemCardTitle, TotemCardDescription } from '@/components/totem/TotemCard';
import { BarberInfoModal } from '@/components/totem/BarberInfoModal';
import barbershopBg from '@/assets/barbershop-background.jpg';

interface Barber {
  id: string;
  nome: string;
  especialidade?: string;
  foto_url?: string;
  ativo: boolean;
  staff_id?: string;
}

/**
 * TotemBarbeiro - Tela de seleção de barbeiro
 * Implementa o design system completo com glassmorphism
 */
const TotemBarbeiro: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, service } = location.state || {};
  
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    if (!client || !service) {
      navigate('/totem/servico', { state: { client } });
      return;
    }
    
    loadBarbers();
    
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, [client, service, navigate]);

  const loadBarbers = async () => {
    if (!service) return;
    
    setLoading(true);
    try {
      // Verificar se há barbeiros específicos vinculados a este serviço
      const { data: serviceStaff, error: staffError } = await supabase
        .from('service_staff')
        .select('staff_id')
        .eq('service_id', service.id);

      // Buscar barbeiros da tabela painel_barbeiros
      let query = supabase
        .from('painel_barbeiros')
        .select('id, nome, specialties, image_url, foto_url, is_active, staff_id, ativo')
        .eq('ativo', true)
        .order('nome');

      // Se há barbeiros vinculados, filtrar apenas eles
      if (!staffError && serviceStaff && serviceStaff.length > 0) {
        const staffIds = serviceStaff.map(s => s.staff_id);
        query = query.in('id', staffIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Buscar fotos atualizadas da tabela staff (fonte principal de fotos)
      const staffIds = (data || []).map(b => b.staff_id).filter(Boolean);
      let staffPhotos: Record<string, string> = {};
      
      if (staffIds.length > 0) {
        const { data: staffData } = await supabase
          .from('staff')
          .select('id, image_url')
          .in('id', staffIds);
        
        if (staffData) {
          staffPhotos = staffData.reduce((acc, s) => {
            if (s.image_url) acc[s.id] = s.image_url;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Mapear dados do Supabase para o tipo Barber
      const mappedBarbers: Barber[] = (data || []).map(b => {
        let specialtyStr: string | undefined;
        if (Array.isArray(b.specialties)) {
          specialtyStr = b.specialties.join(', ');
        } else if (typeof b.specialties === 'string') {
          specialtyStr = b.specialties;
        }
        
        // Prioridade: staff.image_url > painel_barbeiros.image_url > painel_barbeiros.foto_url
        const fotoUrl = (b.staff_id && staffPhotos[b.staff_id]) 
          ? staffPhotos[b.staff_id] 
          : (b.image_url || b.foto_url || undefined);
        
        return {
          id: b.id,
          nome: b.nome,
          especialidade: specialtyStr,
          foto_url: fotoUrl,
          ativo: b.ativo ?? b.is_active ?? true,
          staff_id: b.staff_id || b.id
        };
      });

      setBarbers(mappedBarbers);
      
      if (mappedBarbers.length === 0) {
        toast.info('Nenhum barbeiro disponível no momento', {
          description: 'Por favor, procure a recepção.'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar barbeiros:', error);
      toast.error('Erro ao carregar barbeiros', {
        description: 'Tente novamente ou procure a recepção.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBarberSelect = (barber: Barber) => {
    setSelectedBarber(barber);
    setShowModal(true);
  };

  const handleConfirmBarber = () => {
    if (!selectedBarber) return;
    
    setShowModal(false);
    // Navegar para seleção de data/hora
    navigate('/totem/data-hora', {
      state: {
        client,
        service,
        barber: selectedBarber
      }
    });
  };

  const handleCancelModal = () => {
    setShowModal(false);
    setSelectedBarber(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-urbana-black">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mx-auto" />
          <p className="text-xl sm:text-2xl text-urbana-light">Carregando barbeiros...</p>
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
          onClick={() => navigate('/totem/servico', { state: { client } })}
          variant="ghost"
          size="lg"
          className="h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-urbana-light text-center flex-1 drop-shadow-lg">
          Escolha o Profissional
        </h1>

        <div className="w-12 sm:w-16 md:w-24" />
      </div>

      {/* Subtitle */}
      <p className="relative z-10 text-center text-sm sm:text-base md:text-lg text-urbana-light/70 mb-4 sm:mb-6 drop-shadow-md">
        Selecione o barbeiro de sua preferência
      </p>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {barbers.map((barber) => (
              <TotemCard
                key={barber.id}
                imageUrl={barber.foto_url}
                imageFallbackIcon={User}
                variant={selectedBarber?.id === barber.id ? 'selected' : 'default'}
                onClick={() => handleBarberSelect(barber)}
              >
                <TotemCardTitle>{barber.nome}</TotemCardTitle>
                {barber.especialidade && (
                  <TotemCardDescription>
                    <Star className="w-4 h-4 inline mr-1" />
                    {barber.especialidade}
                  </TotemCardDescription>
                )}
              </TotemCard>
            ))}
          </div>

          {barbers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-urbana-light/60">
                Nenhum barbeiro disponível no momento.
              </p>
              <p className="text-lg text-urbana-light/40 mt-2">
                Por favor, procure a recepção.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Barber Info Modal */}
      {showModal && selectedBarber && (
        <BarberInfoModal
          barber={selectedBarber}
          onConfirm={handleConfirmBarber}
          onCancel={handleCancelModal}
        />
      )}
    </div>
  );
};

export default TotemBarbeiro;
