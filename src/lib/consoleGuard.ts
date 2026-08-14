/**
 * Console Guard — impede que dados sensíveis (e-mails, telefones, tokens, senhas)
 * apareçam no console do navegador (F12), em qualquer painel.
 */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?:\+?55\s?)?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}/g;
const JWT_RE = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;
const SENSITIVE_KEYS =
  /^(email|e_mail|e-mail|mail|password|senha|token|access_token|refresh_token|apikey|api_key|authorization|telefone|phone|whatsapp|cpf)$/i;

const maskEmail = (value: string) => {
  const [, domain] = value.split('@');
  return `***@${domain?.split('.').slice(-2).join('.') ?? '***'}`;
};

const sanitizeString = (value: string) =>
  value
    .replace(JWT_RE, '[token oculto]')
    .replace(EMAIL_RE, maskEmail)
    .replace(PHONE_RE, '[telefone oculto]');

const sanitize = (value: unknown, depth = 0, seen = new WeakSet<object>()): unknown => {
  if (typeof value === 'string') return sanitizeString(value);
  if (!value || typeof value !== 'object' || depth > 4) return value;

  const obj = value as object;
  if (seen.has(obj)) return '[circular]';
  seen.add(obj);

  if (Array.isArray(value)) return value.map((item) => sanitize(item, depth + 1, seen));
  if (value instanceof Error) return sanitizeString(value.message);

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEYS.test(key) ? '[oculto]' : sanitize(val, depth + 1, seen);
  }
  return out;
};

let installed = false;

export const installConsoleGuard = () => {
  if (installed || typeof console === 'undefined') return;
  installed = true;

  (['log', 'info', 'warn', 'error', 'debug', 'trace'] as const).forEach((method) => {
    const original = console[method]?.bind(console);
    if (!original) return;
    console[method] = (...args: unknown[]) => {
      try {
        original(...args.map((arg) => sanitize(arg)));
      } catch {
        original(...args);
      }
    };
  });
};
