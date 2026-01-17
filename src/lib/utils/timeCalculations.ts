/**
 * Utilitários para cálculos de tempo e validação de agendamentos
 * 
 * REGRAS DO SISTEMA:
 * - Buffer de 10 minutos entre agendamentos
 * - Horário de funcionamento: 
 *   Segunda a Sábado: 09:00 às 20:00
 *   Último atendimento: calculado dinamicamente baseado na duração do serviço
 *   Exemplo: serviço de 60min -> último slot 19:00, serviço de 30min -> último slot 19:30
 *   Domingo: 09:00 às 13:00 (quando habilitado)
 * - Slots de 30 minutos
 * 
 * MODO HOMOLOGAÇÃO:
 * - Check-in liberado independente do horário do agendamento
 * - Domingo habilitado para testes
 * - Em produção: alterar HOMOLOGATION_MODE para false
 */

// ============================================
// 🚨 MODO HOMOLOGAÇÃO - CONFIGURAÇÃO GLOBAL
// Para produção: alterar para false
// ============================================
export const HOMOLOGATION_MODE = true;
// ============================================

export const BUFFER_MINUTES = 10;
export const SLOT_INTERVAL_MINUTES = 30;
export const BUSINESS_START_HOUR = 9; // Barbearia abre às 09:00
export const BUSINESS_START_MINUTE = 0; // Primeiro atendimento às 09:00
export const BUSINESS_END_HOUR = 20; // Barbearia fecha às 20:00
export const SUNDAY_START_HOUR = 9; // Domingo inicia às 09:00
export const SUNDAY_END_HOUR = 13; // Domingo termina às 13:00

// Em homologação, domingo funciona igual aos outros dias
export const getSundayHours = () => HOMOLOGATION_MODE 
  ? { start: BUSINESS_START_HOUR, end: BUSINESS_END_HOUR }
  : { start: SUNDAY_START_HOUR, end: SUNDAY_END_HOUR };

/**
 * Converte string de hora para minutos totais desde meia-noite
 * @example "09:30" => 570
 */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Converte minutos totais para string de hora
 * @example 570 => "09:30"
 */
export const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Calcula o horário de término de um agendamento (incluindo buffer)
 * @param startTime - Horário de início (ex: "09:00")
 * @param serviceDuration - Duração do serviço em minutos (ex: 20)
 * @returns Horário de término com buffer (ex: "09:30" para 20min + 10min buffer)
 * 
 * @example
 * calculateEndTimeWithBuffer("09:00", 20) => "09:30" (20min serviço + 10min buffer)
 * calculateEndTimeWithBuffer("09:00", 30) => "09:40" (30min serviço + 10min buffer)
 */
export const calculateEndTimeWithBuffer = (startTime: string, serviceDuration: number): string => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + serviceDuration + BUFFER_MINUTES;
  return minutesToTime(endMinutes);
};

/**
 * Calcula apenas o horário de término do serviço (sem buffer)
 * @param startTime - Horário de início
 * @param serviceDuration - Duração do serviço em minutos
 * @returns Horário de término sem buffer
 */
export const calculateServiceEndTime = (startTime: string, serviceDuration: number): string => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + serviceDuration;
  return minutesToTime(endMinutes);
};

/**
 * Verifica se dois períodos de tempo se sobrepõem
 * Considera o buffer após cada agendamento
 * 
 * @example
 * Agendamento 1: 09:00-09:20 (+ 10min buffer = até 09:30)
 * Agendamento 2: 09:25-09:45
 * Resultado: true (há sobreposição com o buffer)
 * 
 * Agendamento 1: 09:00-09:20 (+ 10min buffer = até 09:30)
 * Agendamento 2: 09:30-09:50
 * Resultado: false (sem sobreposição)
 */
export const hasTimeOverlap = (
  start1: string,
  duration1: number,
  start2: string,
  duration2: number
): boolean => {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = start1Minutes + duration1 + BUFFER_MINUTES; // Incluir buffer
  
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = start2Minutes + duration2 + BUFFER_MINUTES; // Incluir buffer
  
  // Há sobreposição se:
  // - start1 está antes de end2 E end1 está depois de start2
  return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
};

/**
 * Valida se um horário está dentro do expediente
 * Considera que o serviço precisa terminar antes do fechamento
 * REGRA: Primeiro atendimento às 09:00, fechamento às 20:00
 * REGRA: O último slot depende da duração do serviço (serviço deve terminar até 20:00)
 */
export const isWithinBusinessHours = (startTime: string, serviceDuration: number): boolean => {
  const startMinutes = timeToMinutes(startTime);
  const businessStartMinutes = BUSINESS_START_HOUR * 60 + BUSINESS_START_MINUTE; // 09:00 = 540 min
  const businessEndMinutes = BUSINESS_END_HOUR * 60; // 20:00 = 1200 min
  
  // Verificar se o início é após o horário de abertura para atendimentos (09:00)
  if (startMinutes < businessStartMinutes) {
    return false;
  }
  
  // Verificar se o início é antes do fechamento
  if (startMinutes >= businessEndMinutes) {
    return false;
  }
  
  // Verificar se o serviço termina antes do fechamento (sem buffer)
  const endMinutes = startMinutes + serviceDuration;
  
  // Não pode terminar depois das 20:00
  if (endMinutes > businessEndMinutes) {
    return false;
  }
  
  return true;
};

/**
 * Gera próximo horário disponível após um agendamento (com buffer)
 * @example
 * getNextAvailableTime("09:00", 20) => "09:30" (serviço de 20min termina 09:20, + 10min buffer = 09:30)
 */
export const getNextAvailableTime = (startTime: string, serviceDuration: number): string => {
  return calculateEndTimeWithBuffer(startTime, serviceDuration);
};

/**
 * Verifica se um horário já passou há mais de 10 minutos (apenas para o dia atual)
 * Permite agendamento até 10 minutos APÓS o horário (ex: horário 19:00 disponível até 19:10)
 * 
 * IMPORTANTE: Compara usando ano/mês/dia diretamente para evitar problemas de timezone
 */
export const isPastTime = (date: Date, time: string): boolean => {
  const now = new Date();
  
  // Extrair componentes de data diretamente (evita problemas de timezone)
  const selectedYear = date.getFullYear();
  const selectedMonth = date.getMonth();
  const selectedDay = date.getDate();
  
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDay = now.getDate();
  
  // Se não é hoje, nunca é passado
  const isToday = selectedYear === todayYear && selectedMonth === todayMonth && selectedDay === todayDay;
  
  if (!isToday) {
    return false;
  }
  
  // É hoje - verificar hora
  const [hours, minutes] = time.split(':').map(Number);
  
  // Criar data/hora do slot usando componentes locais
  const selectedDateTime = new Date(selectedYear, selectedMonth, selectedDay, hours, minutes, 0, 0);
  
  // Permitir agendamento até 10 minutos DEPOIS do horário passar
  // Ex: horário 19:00 disponível de 19:00 até 19:10
  const minTime = new Date(now.getTime() - 10 * 60 * 1000);
  
  const isPast = selectedDateTime < minTime;
  
  if (isPast) {
    console.log('🕐 isPastTime:', {
      time,
      selectedDateTime: selectedDateTime.toISOString(),
      minTime: minTime.toISOString(),
      now: now.toISOString(),
      isPast
    });
  }
  
  return isPast;
};

/**
 * Calcula todos os slots ocupados por um agendamento (incluindo buffer)
 * Retorna array de horários em formato "HH:MM"
 * 
 * @example
 * getOccupiedSlots("09:00", 20) 
 * => ["09:00", "09:30"] (20min serviço cabe em 1 slot, + buffer ocupa parte do próximo)
 */
export const getOccupiedSlots = (startTime: string, duration: number): string[] => {
  const startMinutes = timeToMinutes(startTime);
  const totalDuration = duration + BUFFER_MINUTES;
  const slots: string[] = [];
  
  // Calcular quantos slots de 30 minutos são ocupados
  const slotsNeeded = Math.ceil(totalDuration / SLOT_INTERVAL_MINUTES);
  
  for (let i = 0; i < slotsNeeded; i++) {
    const slotMinutes = startMinutes + (i * SLOT_INTERVAL_MINUTES);
    
    // Arredondar para o slot mais próximo
    const roundedMinutes = Math.floor(slotMinutes / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;
    const slotTime = minutesToTime(roundedMinutes);
    
    if (!slots.includes(slotTime)) {
      slots.push(slotTime);
    }
  }
  
  return slots;
};

/**
 * Formata duração em minutos para formato legível
 * @example formatDuration(90) => "1h 30min"
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}min`;
};
