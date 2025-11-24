/**
 * Utilitários para trabalhar com timezone do Brasil (America/Sao_Paulo)
 * 
 * IMPORTANTE: Todo o sistema usa o timezone do Brasil (UTC-3)
 */

import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Timezone do Brasil (Horário de Brasília)
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Obtém a data/hora atual no timezone do Brasil
 */
export const getBrazilNow = (): Date => {
  return toZonedTime(new Date(), BRAZIL_TIMEZONE);
};

/**
 * Converte uma data UTC para o timezone do Brasil
 */
export const toBrazilTime = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateObj, BRAZIL_TIMEZONE);
};

/**
 * Converte uma data do timezone do Brasil para UTC
 */
export const fromBrazilTime = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return fromZonedTime(dateObj, BRAZIL_TIMEZONE);
};

/**
 * Formata uma data no timezone do Brasil
 */
export const formatBrazilTime = (
  date: Date | string,
  formatStr: string = 'dd/MM/yyyy HH:mm'
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, BRAZIL_TIMEZONE, formatStr, { locale: ptBR });
};

/**
 * Formata apenas a data no timezone do Brasil
 */
export const formatBrazilDate = (date: Date | string): string => {
  return formatBrazilTime(date, 'dd/MM/yyyy');
};

/**
 * Formata apenas a hora no timezone do Brasil
 */
export const formatBrazilHour = (date: Date | string): string => {
  return formatBrazilTime(date, 'HH:mm');
};

/**
 * Verifica se uma data/hora já passou no timezone do Brasil
 */
export const isPastInBrazil = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const brazilDate = toBrazilTime(dateObj);
  const brazilNow = getBrazilNow();
  return brazilDate < brazilNow;
};

/**
 * Combina data e hora em uma string ISO no timezone do Brasil
 */
export const combineDateTimeInBrazil = (date: string, time: string): Date => {
  // date formato: "2025-11-23"
  // time formato: "09:00:00"
  const dateTimeStr = `${date}T${time}`;
  return fromBrazilTime(new Date(dateTimeStr));
};

/**
 * Verifica se a data/hora de agendamento ainda é válida (não passou mais de 10 minutos)
 */
export const isAppointmentTimeValid = (date: string, time: string): boolean => {
  const appointmentDateTime = new Date(`${date}T${time}`);
  const appointmentBrazil = toBrazilTime(appointmentDateTime);
  const brazilNow = getBrazilNow();
  
  // Permite agendar até 10 minutos depois do horário
  const tenMinutesAgo = new Date(brazilNow.getTime() - 10 * 60 * 1000);
  
  return appointmentBrazil >= tenMinutesAgo;
};
