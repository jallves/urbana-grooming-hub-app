/**
 * Utilitários de data/hora para o timezone do Brasil (America/Sao_Paulo)
 * IMPORTANTE: Todas as datas do sistema devem usar estas funções
 */

/**
 * Retorna data/hora atual no timezone do Brasil
 * - date: YYYY-MM-DD
 * - datetime: YYYY-MM-DDTHH:MM:SS-03:00 (ISO com offset)
 * - formatted: DD/MM/YYYY HH:MM:SS
 * - time: HH:MM:SS
 */
export function getBrazilDateTime() {
  const now = new Date();
  
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat('pt-BR', options);
  const parts = formatter.formatToParts(now);
  
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
  
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');
  
  const date = `${year}-${month}-${day}`;
  const time = `${hour}:${minute}:${second}`;
  const datetime = `${date}T${time}-03:00`;
  const formatted = `${day}/${month}/${year} ${time}`;
  
  return { date, datetime, time, formatted };
}

/**
 * Converte uma data UTC para ISO string no timezone do Brasil
 */
export function toBrazilISOString(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat('pt-BR', options);
  const parts = formatter.formatToParts(date);
  
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
  
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');
  
  return `${year}-${month}-${day}T${hour}:${minute}:${second}-03:00`;
}

/**
 * Retorna apenas a data atual no Brasil (YYYY-MM-DD)
 */
export function getBrazilDate(): string {
  return getBrazilDateTime().date;
}

/**
 * Retorna apenas a hora atual no Brasil (HH:MM:SS)
 */
export function getBrazilTime(): string {
  return getBrazilDateTime().time;
}
