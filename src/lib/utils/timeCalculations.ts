/**
 * Utilitários para cálculos de tempo e validação de agendamentos
 * 
 * REGRAS DO SISTEMA:
 * - Buffer de 10 minutos entre agendamentos
 * - Horário de funcionamento: 09:00 às 20:00
 * - Slots de 30 minutos
 */

export const BUFFER_MINUTES = 10;
export const SLOT_INTERVAL_MINUTES = 30;
export const BUSINESS_START_HOUR = 9;
export const BUSINESS_END_HOUR = 20;

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
 */
export const isWithinBusinessHours = (startTime: string, serviceDuration: number): boolean => {
  const startMinutes = timeToMinutes(startTime);
  const startHour = Math.floor(startMinutes / 60);
  
  // Verificar início
  if (startHour < BUSINESS_START_HOUR || startHour >= BUSINESS_END_HOUR) {
    return false;
  }
  
  // Verificar se o serviço termina antes do fechamento (sem buffer)
  const endMinutes = startMinutes + serviceDuration;
  const endHour = Math.floor(endMinutes / 60);
  const endMinute = endMinutes % 60;
  
  // Não pode terminar depois das 20:00
  if (endHour > BUSINESS_END_HOUR || (endHour === BUSINESS_END_HOUR && endMinute > 0)) {
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
 * Verifica se um horário já passou (apenas para o dia atual)
 * Considera buffer de 10 minutos de antecedência mínima para processamento
 */
export const isPastTime = (date: Date, time: string): boolean => {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const selectedDay = new Date(date);
  selectedDay.setHours(0, 0, 0, 0);
  
  // Se não é hoje, nunca é passado
  if (selectedDay.getTime() !== today.getTime()) {
    return false;
  }
  
  // É hoje - verificar hora
  const [hours, minutes] = time.split(':').map(Number);
  const selectedDateTime = new Date(date);
  selectedDateTime.setHours(hours, minutes, 0, 0);
  
  // Adicionar apenas 10 minutos de margem para processamento
  const minTime = new Date(now.getTime() + 10 * 60 * 1000);
  
  return selectedDateTime < minTime;
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
