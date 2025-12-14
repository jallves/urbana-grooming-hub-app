import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, Scissors, User, CheckCircle, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, parseISO, isPast, isToday, addHours, subHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import barbershopBg from '@/assets/barbershop-background.jpg';

// ============================================
// 🚨 MODO HOMOLOGAÇÃO - BYPASS DE VALIDAÇÃO DE HORÁRIO
// Para voltar ao normal: alterar para false
// ============================================
const HOMOLOGATION_MODE = true;
// ============================================

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
      agendado: { label: 'Agendado', className: 'bg-blue-500/20 text-blue-300 border-2 border-blue-500/40' },
      confirmado: { label: 'Confirmado', className: 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/40' },
      concluido: { label: 'Concluído', className: 'bg-urbana-gold/20 text-urbana-gold border-2 border-urbana-gold/40' },
      cancelado: { label: 'Cancelado', className: 'bg-red-500/20 text-red-300 border-2 border-red-500/40' },
    };
    return badges[status] || badges.agendado;
  };

  const canCheckIn = (appointment: Appointment): { allowed: boolean; reason?: string } => {
    console.log('🔍 Verificando check-in para agendamento:', {
      id: appointment.id,
      data: appointment.data,
      hora: appointment.hora,
      status: appointment.status,
      homologationMode: HOMOLOGATION_MODE
    });

    // Verificar se o status permite check-in
    if (appointment.status !== 'agendado' && appointment.status !== 'confirmado') {
      console.log('❌ Status não permite check-in:', appointment.status);
      return { allowed: false, reason: 'Status do agendamento não permite check-in' };
    }

    // 🚨 MODO HOMOLOGAÇÃO: Bypass de validação de horário
    if (HOMOLOGATION_MODE) {
      console.log('🔓 MODO HOMOLOGAÇÃO ATIVO - Check-in liberado independente do horário');
      return { allowed: true };
    }

    // Criar data/hora completa do agendamento no horário de Brasília
    const [hours, minutes] = appointment.hora.split(':').map(Number);
    
    // Parse da data e ajuste para horário de Brasília (UTC-3)
    const appointmentDate = parseISO(appointment.data);
    const appointmentDateTime = new Date(
      appointmentDate.getFullYear(),
      appointmentDate.getMonth(),
      appointmentDate.getDate(),
      hours,
      minutes,
      0,
      0
    );

    // Obter horário atual
    const currentTime = new Date();
    
    console.log('⏰ Comparação de horários:', {
      agendamento: format(appointmentDateTime, 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      agora: format(currentTime, 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      diffMinutes: Math.floor((currentTime.getTime() - appointmentDateTime.getTime()) / (1000 * 60)),
      appointmentTimestamp: appointmentDateTime.getTime(),
      nowTimestamp: currentTime.getTime()
    });
    
    // Verificar se é muito cedo (mais de 2 horas antes)
    const twoHoursBefore = subHours(appointmentDateTime, 2);
    if (currentTime < twoHoursBefore) {
      const hoursUntil = Math.floor((twoHoursBefore.getTime() - currentTime.getTime()) / (1000 * 60 * 60));
      const minutesUntil = Math.floor(((twoHoursBefore.getTime() - currentTime.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
      console.log('⏰ Muito cedo - faltam', hoursUntil, 'h', minutesUntil, 'min');
      return { 
        allowed: false, 
        reason: `Check-in disponível a partir de ${format(twoHoursBefore, 'HH:mm', { locale: ptBR })} (faltam ${hoursUntil}h ${minutesUntil}min)` 
      };
    }

    // Verificar se é muito tarde (mais de 1 hora depois)
    const oneHourAfter = addHours(appointmentDateTime, 1);
    if (currentTime > oneHourAfter) {
      console.log('⏰ Muito tarde - expirou às', format(oneHourAfter, 'HH:mm', { locale: ptBR }));
      return { 
        allowed: false, 
        reason: `Check-in expirado. Limite era até ${format(oneHourAfter, 'HH:mm', { locale: ptBR })} (1 hora após o horário agendado)` 
      };
    }

    // Check-in permitido
    console.log('✅ Check-in permitido!');
    return { allowed: true };
  };

  const handleSelectAppointment = async (appointment: Appointment) => {
    const checkInValidation = canCheckIn(appointment);
    
    if (!checkInValidation.allowed) {
      toast.error(checkInValidation.reason || 'Check-in não disponível', {
        duration: 5000,
        style: {
          background: 'hsl(var(--urbana-brown))',
          color: 'hsl(var(--urbana-light))',
          border: '2px solid hsl(var(--destructive))',
          fontSize: '1.125rem',
          padding: '1.5rem',
        }
      });
      return;
    }

    // Verificar se já foi feito check-in para este agendamento
    const checkIn = checkInInfo[appointment.id];
    
    if (checkIn) {
      toast.info('Check-in já realizado para este agendamento', {
        duration: 3000,
        style: {
          background: 'hsl(var(--urbana-brown))',
          color: 'hsl(var(--urbana-light))',
          border: '2px solid hsl(var(--urbana-gold))',
          fontSize: '1.125rem',
          padding: '1.5rem',
        }
      });
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
        <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-urbana-gold/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl opacity-40" />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6 z-10">
        <Button
          onClick={() => navigate('/totem/search')}
          variant="ghost"
          size="lg"
          className="h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg text-urbana-light active:text-urbana-gold active:bg-urbana-gold/20 transition-all duration-100 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-urbana-light mb-1">
            Olá, {client.nome.split(' ')[0]}! 👋
          </h1>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-urbana-light/60">
            Selecione um agendamento para fazer check-in
          </p>
        </div>
        <div className="w-12 sm:w-16 md:w-24"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 z-10 overflow-y-auto py-2">
        <div className="max-w-5xl mx-auto space-y-2 sm:space-y-3 md:space-y-4 pb-4">
          {appointments.map((appointment: Appointment) => {
            const statusBadge = getStatusBadge(appointment.status);
            const checkInValidation = canCheckIn(appointment);
            const allowCheckIn = checkInValidation.allowed;
            const appointmentDate = parseISO(appointment.data);
            const isPastAppointment = isPast(appointmentDate) && !isToday(appointmentDate);
            const hasCheckIn = checkInInfo[appointment.id];

            return (
              <Card
                key={appointment.id}
                onClick={() => !hasCheckIn && allowCheckIn && handleSelectAppointment(appointment)}
                className={`p-4 sm:p-6 md:p-8 bg-white/5 backdrop-blur-2xl border-2 transition-all duration-100 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${
                  hasCheckIn
                    ? 'border-green-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)]'
                    : allowCheckIn
                    ? 'border-urbana-gold/50 cursor-pointer active:border-urbana-gold active:shadow-[0_0_40px_rgba(212,175,55,0.3)] active:scale-98'
                    : 'border-red-500/30 opacity-75 cursor-not-allowed'
                }`}
              >
                {/* Check-in já realizado - Badge no topo */}
                {hasCheckIn && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 bg-gradient-to-r from-green-500/10 to-green-600/10 backdrop-blur-sm border-2 border-green-500/50 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                    <div className="flex items-center gap-3 sm:gap-4 mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-green-500/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-green-500/20">
                        <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-400 drop-shadow-lg" />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg sm:text-xl md:text-2xl font-black text-green-400 drop-shadow-lg">
                          CHECK-IN JÁ REALIZADO ✓
                        </p>
                        <p className="text-sm sm:text-base md:text-lg text-green-300/80 mt-1">
                          Realizado em {format(new Date(hasCheckIn.check_in_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-urbana-black/20 backdrop-blur-sm rounded-lg border border-urbana-gold/30">
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

                {!hasCheckIn && !allowCheckIn && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-red-500/20">
                    <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-red-500/10 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <XCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-red-400" />
                        <p className="text-sm sm:text-base md:text-lg font-bold text-red-400">
                          Check-in não disponível
                        </p>
                      </div>
                      {checkInValidation.reason && (
                        <p className="text-xs sm:text-sm md:text-base text-red-300/80 text-center">
                          {checkInValidation.reason}
                        </p>
                      )}
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
