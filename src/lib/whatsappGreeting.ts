import { formatInTimeZone } from 'date-fns-tz';
import { BRAZIL_TIMEZONE } from './brazilTimezone';

/**
 * Retorna a saudação de acordo com a hora atual em São Paulo.
 * - Até 11:59 → "Bom dia"
 * - 12:00 às 17:59 → "Boa tarde"
 * - 18:00 em diante → "Boa noite"
 */
export const getBrazilGreeting = (date: Date = new Date()): string => {
  const hour = parseInt(formatInTimeZone(date, BRAZIL_TIMEZONE, 'H'), 10);
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

/**
 * Normaliza um telefone brasileiro para o formato E.164 sem o "+",
 * que é o aceito pelo wa.me / api.whatsapp.com.
 */
export const normalizeBrazilWhatsapp = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  // Já vem com DDI 55
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  // DDD + número (10 ou 11 dígitos)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  // fallback: prefixa 55
  return `55${digits}`;
};

/**
 * Gera a URL definitiva do WhatsApp com mensagem pré-preenchida
 * para reengajar o cliente. Usa api.whatsapp.com/send que funciona
 * tanto no WhatsApp Web (desktop) quanto no app nativo (mobile).
 */
export const buildClientReengagementWhatsappUrl = (
  phone: string | null | undefined,
  clientName: string,
  customMessage?: string | null,
): string | null => {
  const normalized = normalizeBrazilWhatsapp(phone);
  if (!normalized) return null;

  const greeting = getBrazilGreeting();
  const firstName = (clientName || '').trim().split(/\s+/)[0] || '';
  const saudacao = firstName ? `${greeting}, ${firstName}!` : `${greeting}!`;

  const trimmedCustom = (customMessage || '').trim().slice(0, 500);
  const body = trimmedCustom
    ? trimmedCustom.replace(/\{nome\}/gi, firstName)
    : `Estamos sentindo a sua falta por aqui! Que tal agendar seu próximo horário ` +
      `e renovar o visual com a gente?\n\nSerá um prazer te receber novamente. 🖤`;

  const message = `${saudacao} Aqui é da *Barbearia Costa Urbana* ✂️\n\n${body}`;

  return `https://api.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(message)}`;
};
