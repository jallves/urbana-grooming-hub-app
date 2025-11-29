import { format as dateFnsFormat, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

// Timezone do Brasil
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte uma data UTC para o horário do Brasil
 */
export function toBrazilTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateObj, BRAZIL_TIMEZONE);
}

/**
 * Converte uma data do horário do Brasil para UTC
 */
export function fromBrazilTime(date: Date): Date {
  return fromZonedTime(date, BRAZIL_TIMEZONE);
}

/**
 * Formata uma data no horário do Brasil
 */
export function formatBrazilDate(
  date: Date | string,
  formatStr: string = 'dd/MM/yyyy HH:mm:ss'
): string {
  const brazilDate = toBrazilTime(date);
  return dateFnsFormat(brazilDate, formatStr, { locale: ptBR });
}

/**
 * Formata apenas a data (sem hora) no horário do Brasil
 */
export function formatBrazilDateOnly(date: Date | string): string {
  return formatBrazilDate(date, 'dd/MM/yyyy');
}

/**
 * Formata apenas a hora no horário do Brasil
 */
export function formatBrazilTime(date: Date | string): string {
  return formatBrazilDate(date, 'HH:mm');
}

/**
 * Retorna a data/hora atual no Brasil
 */
export function getNowInBrazil(): Date {
  return toBrazilTime(new Date());
}

/**
 * Retorna a data atual no Brasil (sem hora)
 */
export function getTodayInBrazil(): string {
  const now = getNowInBrazil();
  return dateFnsFormat(now, 'yyyy-MM-dd');
}

/**
 * Verifica se uma data está no passado (considerando horário do Brasil)
 */
export function isPastInBrazil(date: Date | string): boolean {
  const brazilDate = toBrazilTime(date);
  const now = getNowInBrazil();
  return brazilDate < now;
}

/**
 * Formata data para exibição em listas (formato brasileiro)
 */
export function formatListDate(date: Date | string): string {
  return formatBrazilDate(date, "dd 'de' MMMM 'de' yyyy");
}

/**
 * Formata data e hora para exibição completa
 */
export function formatFullDateTime(date: Date | string): string {
  return formatBrazilDate(date, "dd/MM/yyyy 'às' HH:mm");
}
