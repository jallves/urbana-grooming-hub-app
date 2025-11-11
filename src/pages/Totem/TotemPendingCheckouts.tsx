import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, AlertCircle, CreditCard, Clock, User, Calendar, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import barbershopBg from '@/assets/barbershop-background.jpg';
import { toast } from 'sonner';

interface PendingCheckout {
  id: string;
  data: string;
  hora: string;
  cliente_id: string;
  barbeiro_id: string;
  servico_id: string;
  painel_clientes?: {
    nome: string;
  };
  painel_barbeiros?: {
    nome: string;
  };
  painel_servicos?: {
    nome: string;
    preco: number;
  };
  totem_sessions: Array<{
    id: string;
    check_in_time: string;
    check_out_time: string | null;
    status: string;
  }>;
}

const TotemPendingCheckouts: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { whatsapp, cliente } = location.state || {};
  const [pendingCheckouts, setPendingCheckouts] = useState<PendingCheckout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

  useEffect(() => {
    if (!cliente) {
      navigate('/totem/home');
      return;
    }
    loadPendingCheckouts();
  }, [cliente]);

  const loadPendingCheckouts = async () => {
    try {
      console.log('🔍 Carregando checkouts pendentes para cliente:', cliente.id);
      
      const { data: checkouts, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          id,
          data,
          hora,
          cliente_id,
          barbeiro_id,
          servico_id,
          painel_clientes!inner (
            nome
          ),
          painel_barbeiros (
            nome
          ),
          painel_servicos (
            nome,
            preco
          ),
          totem_sessions!inner (
            id,
            check_in_time,
            check_out_time,
            status
          )
        `)
        .eq('cliente_id', cliente.id)
        .not('totem_sessions.check_in_time', 'is', null)
        .is('totem_sessions.check_out_time', null);

      if (error) throw error;

      console.log('✅ Checkouts pendentes encontrados:', checkouts?.length || 0);
      setPendingCheckouts(checkouts || []);
    } catch (error) {
      console.error('❌ Erro ao carregar checkouts pendentes:', error);
      toast.error('Erro ao carregar pagamentos pendentes');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToCheckout = (appointment: PendingCheckout) => {
    const session = appointment.totem_sessions[0];
    
    navigate('/totem/checkout', {
      state: {
        appointment: {
          id: appointment.id,
          data: appointment.data,
          hora: appointment.hora,
          cliente_id: appointment.cliente_id,
          barbeiro_id: appointment.barbeiro_id,
          servico_id: appointment.servico_id,
          cliente: {
            id: appointment.cliente_id,
            nome: appointment.painel_clientes?.nome || cliente.nome,
          },
          barbeiro: {
            id: appointment.barbeiro_id,
            nome: appointment.painel_barbeiros?.nome,
          },
          servico: {
            id: appointment.servico_id,
            nome: appointment.painel_servicos?.nome,
            preco: appointment.painel_servicos?.preco,
          },
        },
        client: cliente,
        session: {
          id: session.id,
          appointment_id: appointment.id,
          status: session.status,
          check_in_time: session.check_in_time,
        },
      },
    });
  };

  const handleSkipAndContinue = () => {
    toast.info('Você pode finalizar seus pagamentos a qualquer momento usando a opção CHECK-OUT');
    navigate('/totem/home');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mx-auto" />
          <p className="text-2xl sm:text-3xl md:text-4xl text-urbana-light font-poppins">Verificando pagamentos...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return null;
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 font-poppins relative overflow-hidden">
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
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl opacity-40" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6 z-10">
        <Button
          onClick={handleSkipAndContinue}
          variant="ghost"
          size="lg"
          className="h-12 md:h-14 px-4 md:px-6 text-base md:text-lg text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10 active:bg-urbana-gold/20 transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 mr-2" />
          <span>Pular</span>
        </Button>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-7 h-7 md:w-8 md:h-8 text-amber-400" />
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">
            Pagamentos Pendentes
          </h1>
          <AlertCircle className="w-7 h-7 md:w-8 md:h-8 text-amber-400" />
        </div>
        <div className="w-20 md:w-32"></div>
      </div>

      {/* Alert Message */}
      <div className="z-10 mb-4 md:mb-6">
        <Card className="p-4 md:p-6 bg-amber-500/10 backdrop-blur-xl border-2 border-amber-500/40 rounded-2xl shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-6 h-6 md:w-7 md:h-7 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-bold text-amber-400 mb-2">
                Atenção! Você possui {pendingCheckouts.length} atendimento(s) aguardando pagamento
              </h3>
              <p className="text-sm md:text-base text-urbana-light/80">
                Finalize seus pagamentos antes de realizar novos agendamentos ou check-ins.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Checkouts List */}
      <div className="flex-1 z-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-4 pb-4">
          {pendingCheckouts.map((checkout) => {
            const session = checkout.totem_sessions[0];
            const appointmentDate = parseISO(checkout.data);
            
            return (
              <Card
                key={checkout.id}
                className="p-6 md:p-8 bg-white/5 backdrop-blur-2xl border-2 border-amber-500/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-amber-500/60 transition-all"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Calendar className="w-7 h-7 md:w-8 md:h-8 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl md:text-3xl font-bold text-urbana-light">
                        {format(appointmentDate, "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className="text-sm md:text-base text-urbana-light/60">
                        Check-in: {format(new Date(session.check_in_time), 'HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-amber-500/20 border-2 border-amber-500/40 rounded-lg">
                    <p className="text-sm md:text-base font-bold text-amber-400">
                      AGUARDANDO PAGAMENTO
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-amber-400" />
                    <div>
                      <p className="text-sm text-urbana-light/60">Horário</p>
                      <p className="text-xl font-bold text-urbana-light">{checkout.hora}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-amber-400" />
                    <div>
                      <p className="text-sm text-urbana-light/60">Barbeiro</p>
                      <p className="text-xl font-bold text-urbana-light">
                        {checkout.painel_barbeiros?.nome || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-urbana-gold" />
                    <div>
                      <p className="text-sm text-urbana-light/60">Serviço</p>
                      <p className="text-xl font-bold text-urbana-light">
                        {checkout.painel_servicos?.nome || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleGoToCheckout(checkout)}
                  className="w-full h-16 md:h-20 text-xl md:text-2xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-urbana-black hover:from-amber-600 hover:via-orange-600 hover:to-amber-600 shadow-2xl shadow-amber-500/40 transition-all duration-300"
                >
                  <CreditCard className="w-6 h-6 md:w-8 md:h-8 mr-3" />
                  FINALIZAR PAGAMENTO
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Skip Button */}
      <div className="z-10 pt-4">
        <Button
          onClick={handleSkipAndContinue}
          variant="outline"
          className="w-full h-14 md:h-16 text-lg md:text-xl font-bold border-2 border-urbana-light/30 text-urbana-light hover:bg-urbana-light/10"
        >
          Continuar sem pagar agora
        </Button>
      </div>
    </div>
  );
};

export default TotemPendingCheckouts;
