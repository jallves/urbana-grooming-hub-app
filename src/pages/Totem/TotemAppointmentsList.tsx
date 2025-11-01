import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, Scissors, User, CheckCircle, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  data: string;
  hora: string;
  status: string;
  servico: {
    nome: string;
    preco: number;
  };
  barbeiro: {
    nome: string;
  };
}

interface CheckInInfo {
  appointment_id: string;
  check_in_time: string;
  session_id: string;
}

const TotemAppointmentsList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointments, client } = location.state || {};
  const [checkInInfo, setCheckInInfo] = useState<Record<string, CheckInInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

  useEffect(() => {
    if (appointments) {
      loadCheckInInfo();
    }
  }, [appointments]);

  const loadCheckInInfo = async () => {
    try {
      const appointmentIds = appointments.map((a: Appointment) => a.id);
      
      const { data: sessions, error } = await supabase
        .from('totem_sessions')
        .select('*')
        .in('appointment_id', appointmentIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Criar mapa de check-ins por agendamento
      const checkIns: Record<string, CheckInInfo> = {};
      sessions?.forEach(session => {
        if (!checkIns[session.appointment_id]) {
          checkIns[session.appointment_id] = {
            appointment_id: session.appointment_id,
            check_in_time: session.check_in_time || session.created_at,
            session_id: session.id
          };
        }
      });

      setCheckInInfo(checkIns);
    } catch (error) {
      console.error('Erro ao carregar check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!appointments || !client) {
    navigate('/totem/search');
    return null;
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      agendado: { label: 'Agendado', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
      confirmado: { label: 'Confirmado', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
      concluido: { label: 'Concluído', className: 'bg-urbana-gold/20 text-urbana-gold border-urbana-gold/30' },
      cancelado: { label: 'Cancelado', className: 'bg-red-500/20 text-red-300 border-red-500/30' },
    };
    return badges[status] || badges.agendado;
  };

  const canCheckIn = (appointment: Appointment) => {
    const appointmentDate = parseISO(appointment.data);
    return (
      (appointment.status === 'agendado' || appointment.status === 'confirmado') &&
      isToday(appointmentDate)
    );
  };

  const handleSelectAppointment = async (appointment: Appointment) => {
    if (!canCheckIn(appointment)) {
      return;
    }

    // Verificar se já foi feito check-in para este agendamento
    const checkIn = checkInInfo[appointment.id];
    
    if (checkIn) {
      // Não navega, apenas informa
      return;
    }
    
    navigate('/totem/confirmation', { 
      state: { 
        appointment,
        client 
      } 
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mx-auto" />
          <p className="text-2xl sm:text-3xl md:text-4xl text-urbana-light font-poppins">Carregando agendamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex flex-col p-4 sm:p-6 md:p-8 font-poppins relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black opacity-50" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 z-10">
        <Button
          onClick={() => navigate('/totem/search')}
          variant="ghost"
          size="lg"
          className="h-12 sm:h-14 md:h-16 px-4 sm:px-6 md:px-8 text-base sm:text-lg md:text-xl text-urbana-light active:text-urbana-gold active:bg-urbana-gold/20 transition-all duration-100 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 mr-2 sm:mr-3" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-urbana-light">
            Olá, {client.nome}!
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-urbana-light/60 mt-1 sm:mt-2">
            Selecione um agendamento para fazer check-in
          </p>
        </div>
        <div className="w-16 sm:w-20 md:w-32"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 z-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 pb-6">
          {appointments.map((appointment: Appointment) => {
            const statusBadge = getStatusBadge(appointment.status);
            const allowCheckIn = canCheckIn(appointment);
            const appointmentDate = parseISO(appointment.data);
            const isPastAppointment = isPast(appointmentDate) && !isToday(appointmentDate);
            const hasCheckIn = checkInInfo[appointment.id];

            return (
              <Card
                key={appointment.id}
                onClick={() => !hasCheckIn && allowCheckIn && handleSelectAppointment(appointment)}
                className={`p-4 sm:p-6 md:p-8 bg-card/50 backdrop-blur-sm border-2 transition-all duration-100 ${
                  hasCheckIn
                    ? 'border-green-500/50 bg-green-500/5'
                    : allowCheckIn
                    ? 'border-urbana-gold/50 cursor-pointer active:border-urbana-gold active:bg-urbana-gold/10 active:scale-98'
                    : 'border-urbana-gray/30 opacity-75 cursor-not-allowed'
                }`}
              >
                {/* Check-in já realizado - Badge no topo */}
                {hasCheckIn && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 bg-gradient-to-r from-green-500/20 to-green-600/20 border-2 border-green-500/50 rounded-xl">
                    <div className="flex items-center gap-3 sm:gap-4 mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg sm:text-xl md:text-2xl font-black text-green-400">
                          CHECK-IN JÁ REALIZADO ✓
                        </p>
                        <p className="text-sm sm:text-base md:text-lg text-green-300/80 mt-1">
                          Realizado em {format(new Date(hasCheckIn.check_in_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-urbana-black/30 rounded-lg border border-urbana-gold/30">
                      <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-urbana-gold" />
                      <p className="text-sm sm:text-base md:text-lg text-urbana-light font-medium">
                        Para finalizar o pagamento, use a opção <span className="text-urbana-gold font-bold">CHECK-OUT</span> no menu principal
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center ${
                      hasCheckIn ? 'bg-green-500/20' : 'bg-urbana-gold/10'
                    }`}>
                      <Calendar className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 ${
                        hasCheckIn ? 'text-green-400' : 'text-urbana-gold'
                      }`} />
                    </div>
                    <div>
                      <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-urbana-light">
                        {format(appointmentDate, "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className="text-sm sm:text-base md:text-lg text-urbana-light/60">
                        {format(appointmentDate, 'EEEE', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 rounded-lg border-2 ${statusBadge.className}`}>
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold">
                      {statusBadge.label}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                    <Clock className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${hasCheckIn ? 'text-green-400' : 'text-urbana-gold'}`} />
                    <div>
                      <p className="text-xs sm:text-sm md:text-base text-urbana-light/60">Horário</p>
                      <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light">
                        {appointment.hora}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                    <Scissors className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${hasCheckIn ? 'text-green-400' : 'text-urbana-gold'}`} />
                    <div>
                      <p className="text-xs sm:text-sm md:text-base text-urbana-light/60">Serviço</p>
                      <p className="text-base sm:text-lg md:text-xl font-bold text-urbana-light">
                        {appointment.servico.nome}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                    <User className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${hasCheckIn ? 'text-green-400' : 'text-urbana-gold'}`} />
                    <div>
                      <p className="text-xs sm:text-sm md:text-base text-urbana-light/60">Barbeiro</p>
                      <p className="text-base sm:text-lg md:text-xl font-bold text-urbana-light">
                        {appointment.barbeiro.nome}
                      </p>
                    </div>
                  </div>
                </div>

                {!hasCheckIn && allowCheckIn && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-urbana-gold/20">
                    <div className="flex items-center justify-center gap-2 sm:gap-3 text-urbana-gold">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold">
                        Toque para fazer CHECK-IN
                      </p>
                    </div>
                  </div>
                )}

                {!hasCheckIn && !allowCheckIn && isPastAppointment && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-urbana-gray/20">
                    <div className="flex items-center justify-center gap-2 sm:gap-3 text-urbana-light/40">
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      <p className="text-xs sm:text-sm md:text-base">
                        Agendamento passado
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TotemAppointmentsList;
